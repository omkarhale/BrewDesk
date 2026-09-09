package com.office.brewdesk.attendance.entity;

import com.office.brewdesk.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Metadata record for a supporting document attached to a regularization request.
 *
 * Design decisions:
 *  - Binary file data is NOT stored in PostgreSQL.
 *    Only metadata + a storage reference (path / object-storage key) is persisted.
 *  - This record is immutable after creation — no @PreUpdate / updatedAt.
 *    Files are added before submission and cannot be edited in-place;
 *    the employee removes and re-uploads instead.
 *  - Cascade ALL + orphanRemoval on the parent (RegularizationRequest)
 *    means rows are automatically deleted when the request is deleted.
 *
 * Supported content types (enforced at service layer, not here):
 *   application/pdf, image/jpeg, image/png
 *
 * storageReference holds whatever key the storage layer returns
 * (e.g. a relative filesystem path, an S3 object key, etc.).
 * It is opaque to this entity.
 */
@Entity
@Table(
        name = "regularization_attachments",
        indexes = {
                @Index(
                        name = "idx_reg_attach_request",
                        columnList = "regularization_request_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegularizationAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Parent request ───────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "regularization_request_id", nullable = false)
    private RegularizationRequest regularizationRequest;

    // ── File metadata ────────────────────────────────────────────────────────

    /**
     * Original filename as supplied by the browser/client.
     * Stored for display only — never used for file retrieval.
     */
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    /**
     * MIME type verified by the service layer (e.g. "application/pdf").
     * Client-provided type is NOT trusted; service detects actual type.
     */
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /**
     * File size in bytes at the time of upload.
     * Used for display and to enforce size limits at the service layer.
     */
    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    /**
     * Opaque reference to the stored file.
     * For local storage this is a relative path under the upload root.
     * For object storage (e.g. S3) this is the object key.
     * Length 1000 to accommodate long object-storage paths.
     */
    @Column(name = "storage_reference", nullable = false, length = 1000)
    private String storageReference;

    // ── Audit ────────────────────────────────────────────────────────────────

    /**
     * The user who uploaded this attachment.
     * Should always be the employee who owns the regularization request,
     * but typed as User to match the pattern used throughout the project.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    /**
     * When the attachment was uploaded.
     * Set once on insert; never updated (immutable audit record).
     */
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    /**
     * JPA-managed creation timestamp — mirrors uploadedAt for consistency
     * with the rest of the attendance entities but stored separately so
     * the schema is self-documenting.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── JPA lifecycle ────────────────────────────────────────────────────────

    /**
     * Attachment rows are immutable — no @PreUpdate / no updatedAt column.
     * This matches the AttendanceEvent pattern used in the existing module.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        uploadedAt = now;
        createdAt  = now;
    }
}
