package com.office.brewdesk.repository;

import com.office.brewdesk.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {

    List<Round> findByDate(LocalDate date);
    Optional<Round> findByDateAndName(LocalDate date, String name);
}