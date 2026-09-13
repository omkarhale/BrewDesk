package com.office.brewdesk.leave.repository;

import com.office.brewdesk.leave.entity.LeaveApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveApprovalHistoryRepository extends JpaRepository<LeaveApprovalHistory, Long> {

    List<LeaveApprovalHistory> findAllByLeaveRequestIdOrderByCreatedAtAsc(Long requestId);
}
