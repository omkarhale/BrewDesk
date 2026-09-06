package com.office.brewdesk.repository;

import com.office.brewdesk.entity.BeverageOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BeverageOrderRepository
        extends JpaRepository<BeverageOrder, Long> {

    Optional<BeverageOrder> findByRoundIdAndEmployeeId(
            Long roundId,
            Long employeeId
    );

    List<BeverageOrder> findByRoundId(Long roundId);
}