package com.office.brewdesk.repository;

import com.office.brewdesk.entity.Beverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BeverageRepository extends JpaRepository<Beverage, Long> {

    Optional<Beverage> findByName(String name);
}