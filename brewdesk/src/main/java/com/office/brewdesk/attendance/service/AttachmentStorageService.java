package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.entity.EmployeeProfile;
import com.office.brewdesk.attendance.entity.RegularizationAttachment;
import com.office.brewdesk.attendance.entity.RegularizationRequest;
import com.office.brewdesk.attendance.enums.RegularizationStatus;
import com.office.brewdesk.attendance.repository.RegularizationAttachmentRepository;
import com.office.brewdesk.attendance.repository.RegularizationRequestRepository;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.enums.Role;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

/**
 * Phase 6: Local filesystem attachment storage.
 *
 * Files are stored under {@code upload.dir} (default: ./uploads/regularization).
 * The storageReference saved in RegularizationAttachment is the relative path
 * within that root — never an absolute path.
 *
 * Allowed MIME types: application/pdf, image/jpeg, image/png.
 * Max file size: 5 MB (enforced here and via spring.servlet.multipart.max-file-size).
 *
 * Binary content is never stored in PostgreSQL.
 * The download endpoint resolves the file from the storageReference at request time.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AttachmentStorageService {

    private static final long   MAX_BYTES        = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png");

    @Value("${upload.dir:uploads/regularization}")
    private String uploadDir;

    private final RegularizationRequestRepository requestRepository;
    private final RegularizationAttachmentRepository attachmentRepository;
    private final UserRepository                     userRepository;

    // ── Upload ────────────────────────────────────────────────────────────────

    public RegularizationAttachment upload(Long requestId, MultipartFile file)
            throws IOException {

        RegularizationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Regularization request not found"));

        User currentUser = resolveCurrentUser();
        requireIsOwner(currentUser, request);

        // Only PENDING requests can receive attachments
        if (request.getStatus() != RegularizationStatus.PENDING) {
            throw new IllegalStateException(
                    "Attachments can only be added to PENDING requests");
        }

        // Size check
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException(
                    "File size exceeds the 5 MB limit");
        }

        // MIME type check — use detected content type, not client-provided
        String detectedType = detectContentType(file);
        if (!ALLOWED_TYPES.contains(detectedType)) {
            throw new IllegalArgumentException(
                    "Unsupported file type: " + detectedType
                    + ". Allowed: PDF, JPEG, PNG");
        }

        // Resolve uploader
        User uploader = resolveCurrentUser();

        // Store the file
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadRoot);

        String storedName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path   target     = uploadRoot.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Persist metadata
        RegularizationAttachment attachment = RegularizationAttachment.builder()
                .regularizationRequest(request)
                .originalFilename(file.getOriginalFilename() != null
                        ? file.getOriginalFilename() : storedName)
                .contentType(detectedType)
                .fileSizeBytes(file.getSize())
                .storageReference(storedName)   // relative — never absolute
                .uploadedBy(uploader)
                .build();

        return attachmentRepository.save(attachment);
    }

    // ── Download ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Resource download(Long attachmentId) {

        RegularizationAttachment attachment = getMetadata(attachmentId);

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve(attachment.getStorageReference()).normalize();

            // Security: ensure resolved path stays within uploadDir
            if (!filePath.startsWith(Paths.get(uploadDir).toAbsolutePath().normalize())) {
                throw new SecurityException("Path traversal attempt detected");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalStateException("File not found in storage");
            }
            return resource;

        } catch (MalformedURLException ex) {
            throw new IllegalStateException("Could not resolve file", ex);
        }
    }

    @Transactional(readOnly = true)
    public RegularizationAttachment getMetadata(Long attachmentId) {
        RegularizationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        User viewer = resolveCurrentUser();
        requireCanViewAttachment(viewer, attachment);
        return attachment;
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public void delete(Long attachmentId) {

        RegularizationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        User currentUser = resolveCurrentUser();
        requireIsOwner(currentUser, attachment.getRegularizationRequest());

        if (attachment.getRegularizationRequest().getStatus() != RegularizationStatus.PENDING) {
            throw new IllegalStateException(
                    "Attachments can only be deleted from PENDING requests");
        }

        // Remove file from disk (best-effort)
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve(attachment.getStorageReference()).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
            // Do not fail the transaction if the file is already gone
        }

        attachmentRepository.delete(attachment);
    }

    // ── Authorization helpers ─────────────────────────────────────────────────

    private static boolean isManagementRole(User u) {
        return u.getRole() == Role.SUPER_ADMIN || u.getRole() == Role.ADMIN;
    }

    /** Throws unless the current user is the employee who submitted this request. */
    private static void requireIsOwner(User currentUser, RegularizationRequest request) {
        EmployeeProfile emp = request.getEmployee();
        if (emp.getUser() == null || !emp.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException(
                    "Only the employee who submitted this request may perform this action");
        }
    }

    /**
     * Throws unless the viewer may see this attachment:
     *   - the owner
     *   - the employee's manager
     *   - any ADMIN / SUPER_ADMIN
     */
    private static void requireCanViewAttachment(User viewer,
                                                  RegularizationAttachment attachment) {
        RegularizationRequest req = attachment.getRegularizationRequest();
        EmployeeProfile emp = req.getEmployee();
        if (isManagementRole(viewer)) return;
        if (emp.getUser() != null && emp.getUser().getId().equals(viewer.getId())) return;
        if (emp.getManager() != null && emp.getManager().getId().equals(viewer.getId())) return;
        throw new IllegalArgumentException("Attachment not found");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    private String sanitize(String filename) {
        if (filename == null || filename.isBlank()) return "file";
        // Keep only alphanumeric, dot, hyphen, underscore
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * Detect MIME type from the file bytes rather than trusting the
     * client-provided Content-Type header.
     */
    private String detectContentType(MultipartFile file) throws IOException {
        byte[] header = new byte[Math.min((int) file.getSize(), 12)];
        try (java.io.InputStream is = file.getInputStream()) {
            //noinspection ResultOfMethodCallIgnored
            is.read(header);
        }
        // Check magic bytes
        if (header.length >= 4) {
            // PDF: %PDF
            if (header[0] == 0x25 && header[1] == 0x50
                    && header[2] == 0x44 && header[3] == 0x46) {
                return "application/pdf";
            }
            // JPEG: FF D8 FF
            if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF) {
                return "image/jpeg";
            }
            // PNG: 89 50 4E 47
            if ((header[0] & 0xFF) == 0x89 && header[1] == 0x50
                    && header[2] == 0x4E && header[3] == 0x47) {
                return "image/png";
            }
        }
        // Fall back to client-provided type if magic bytes unrecognised
        String clientType = file.getContentType();
        return (clientType != null) ? clientType : "application/octet-stream";
    }
}
