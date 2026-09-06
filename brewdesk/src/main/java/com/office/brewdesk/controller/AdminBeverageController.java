package com.office.brewdesk.controller;

import com.office.brewdesk.dto.CreateBeverageRequest;
import com.office.brewdesk.dto.UpdateBeverageRequest;
import com.office.brewdesk.entity.Beverage;
import com.office.brewdesk.service.BeverageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/beverages")
@RequiredArgsConstructor
public class AdminBeverageController {

    private final BeverageService beverageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Beverage createBeverage(
            @Valid @RequestBody CreateBeverageRequest request) {

        return beverageService.createBeverage(request);
    }

    @GetMapping
    public List<Beverage> getAllBeverages() {
        return beverageService.getAllBeverages();
    }

    @PutMapping("/{id}")
    public Beverage updateBeverage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBeverageRequest request) {

        return beverageService.updateBeverage(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBeverage(@PathVariable Long id) {

        beverageService.deleteBeverage(id);
    }
}