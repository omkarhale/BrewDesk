package com.office.brewdesk.attendance.controller;

import com.office.brewdesk.attendance.dto.RegularizationAttachmentResponse;
import com.office.brewdesk.attendance.entity.RegularizationAttachment;
import com.office.brewdesk.attendance.service.AttachmentStorageService;
import com.office.brewdesk.attendance.service.RegularizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Attachment upload/download for regularization requests.
 *
 * POST   /api/attendance/regularization/{requestId}/attachments        — upload
 * DELETE /api/attendance/regularization/attachments/{attachmentId}     — delete
 * GET    /api/attendance/regularization/attachments/{attachmentId}/download — download
 */
@RestController
@RequestMapping("/api/attendance/regularization")
@RequiredArgsConstructor
public class RegularizationAttachmentController {

    private final AttachmentStorageService storageService;
    private final RegularizationService    regularizationService;

    /** Upload a supporting document to a PENDING regularization request. */
    @PostMapping("/{requestId}/attachments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<RegularizationAttachmentResponse> upload(
            @PathVariable Long requestId,
            @RequestParam("file") MultipartFile file) throws IOException {

        RegularizationAttachment saved = storageService.upload(requestId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(regularizationService.mapAttachmentPublic(saved));
    }

    /** Delete an attachment from a PENDING request. */
    @DeleteMapping("/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<Void> delete(@PathVariable Long attachmentId) {
        storageService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }

    /** Download an attachment — returns the binary file. */
    @GetMapping("/attachments/{attachmentId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','REPORTING_MANAGER','CHEF','EMPLOYEE')")
    public ResponseEntity<Resource> download(@PathVariable Long attachmentId) {

        RegularizationAttachment metadata = storageService.getMetadata(attachmentId);
        Resource resource = storageService.download(attachmentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(metadata.getOriginalFilename(), StandardCharsets.UTF_8)
                                .build().toString())
                .body(resource);
    }
}
