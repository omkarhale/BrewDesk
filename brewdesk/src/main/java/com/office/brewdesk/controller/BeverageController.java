package com.office.brewdesk.controller;

import com.office.brewdesk.entity.Beverage;
import com.office.brewdesk.repository.BeverageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/beverages")
@RequiredArgsConstructor
public class BeverageController {

    private final BeverageRepository beverageRepository;

    @GetMapping
    public List<Beverage> getAllBeverages() {
        return beverageRepository.findAll();
    }
}