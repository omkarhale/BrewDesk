package com.office.brewdesk.service;

import com.office.brewdesk.dto.CreateBeverageRequest;
import com.office.brewdesk.dto.UpdateBeverageRequest;
import com.office.brewdesk.entity.Beverage;
import com.office.brewdesk.repository.BeverageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeverageService {


    private final BeverageRepository beverageRepository;

    public List<Beverage> getAllBeverages() {
        return beverageRepository.findAll();
    }

    public Beverage createBeverage(CreateBeverageRequest request) {

        if (beverageRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException(
                    "Beverage with this name already exists"
            );
        }

        Beverage beverage = Beverage.builder()
                .name(request.getName())
                .icon(request.getIcon())
                .active(true)
                .build();

        return beverageRepository.save(beverage);
    }

    public Beverage updateBeverage(
            Long id,
            UpdateBeverageRequest request) {

        Beverage beverage = beverageRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Beverage not found"));

        beverageRepository.findByName(request.getName())
                .ifPresent(existing -> {

                    if (!existing.getId().equals(id)) {
                        throw new RuntimeException(
                                "Beverage with this name already exists"
                        );
                    }
                });

        beverage.setName(request.getName());
        beverage.setIcon(request.getIcon());
        beverage.setActive(request.isActive());

        return beverageRepository.save(beverage);
    }

    public void deleteBeverage(Long id) {

        Beverage beverage = beverageRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Beverage not found"));

        beverageRepository.delete(beverage);
    }
}