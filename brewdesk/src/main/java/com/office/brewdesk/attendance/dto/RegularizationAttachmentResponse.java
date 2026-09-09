package com.office.brewdesk.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Read-only projection of a {@link com.office.brewdesk.attendance.entity.RegularizationAttachment}.
 *
 * storageReference is intentionally excluded from this response — it is an
 * internal storage key that must never be exposed to clients.
 * A separate download endpoint will use the id to resolve the reference
 * server-side (implemented in Phase 6: Attachment handling).
 */
@Getter
@Builder
public class RegularizationAttachmentResponse {

    private Long id;

    /** Original filename as supplied by the browser at upload time. */
    private String originalFilename;

    /** Verified MIME type (e.g. "application/pdf", "image/jpeg"). */
    private String contentType;

    /** File size in bytes — used by the frontend to show human-readable size. */
    private Long fileSizeBytes;

    /** Id of the user who uploaded this attachment. */
    private Long uploadedById;

    /** Display name of the uploader (from User.name). */
    private String uploadedByName;

    /** When the file was uploaded. */
    private LocalDateTime uploadedAt;
}
