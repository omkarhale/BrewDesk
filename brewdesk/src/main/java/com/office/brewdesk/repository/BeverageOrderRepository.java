package com.office.brewdesk.repository;

import com.office.brewdesk.entity.BeverageOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BeverageOrderRepository
        extends JpaRepository<BeverageOrder, Long> {

    Optional<BeverageOrder> findByRoundIdAndEmployeeId(
            Long roundId,
            Long employeeId
    );

    List<BeverageOrder> findByRoundId(Long roundId);

    @Query("SELECT bo FROM BeverageOrder bo JOIN FETCH bo.beverage WHERE bo.round.id = :roundId")
    List<BeverageOrder> findByRoundIdWithBeverage(@Param("roundId") Long roundId);

    List<BeverageOrder> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<BeverageOrder> findAllByOrderByCreatedAtDesc();
}