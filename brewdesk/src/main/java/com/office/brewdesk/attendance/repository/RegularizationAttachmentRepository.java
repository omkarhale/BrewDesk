package com.office.brewdesk.attendance.repository;

import com.office.brewdesk.attendance.entity.RegularizationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository for {@link RegularizationAttachment}.
 *
 * Attachments are owned by a {@link com.office.brewdesk.attendance.entity.RegularizationRequest}
 * via {@code CascadeType.ALL + orphanRemoval = true}, so bulk delete is
 * handled automatically by JPA when the parent request is deleted.
 *
 * The explicit {@code findByRegularizationRequestId} query is provided
 * for cases where only the attachment list needs to be loaded without
 * fetching the full request graph — following the same pattern as
 * {@link AttendanceSessionRepository#findByAttendanceRecordIdOrderByPunchInAsc}.
 */
public interface RegularizationAttachmentRepository
        extends JpaRepository<RegularizationAttachment, Long> {

    /**
     * All attachments for a given regularization request, ordered by
     * upload time ascending so they are displayed in upload order.
     */
    List<RegularizationAttachment> findByRegularizationRequestIdOrderByUploadedAtAsc(
            Long regularizationRequestId
    );

    /**
     * Delete all attachments belonging to a request.
     *
     * Typically not needed because of cascade, but provided for explicit
     * bulk cleanup when the service needs a transactional delete without
     * loading the parent entity first.
     */
    void deleteByRegularizationRequestId(Long regularizationRequestId);

    /**
     * Returns Object[]{regularizationRequestId, count} pairs for the given
     * request IDs in a single SQL query. Used to avoid the N+1 attachment
     * indicator lookup on list views.
     */
    @Query("SELECT a.regularizationRequest.id, COUNT(a) "
            + "FROM RegularizationAttachment a "
            + "WHERE a.regularizationRequest.id IN :ids "
            + "GROUP BY a.regularizationRequest.id")
    List<Object[]> countByRequestIdsGrouped(@Param("ids") List<Long> ids);
}
