package com.office.brewdesk.controller;

import com.office.brewdesk.dto.CreateRoundRequest;
import com.office.brewdesk.dto.UpdateRoundRequest;
import com.office.brewdesk.entity.Round;
import com.office.brewdesk.service.RoundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/rounds")
@RequiredArgsConstructor
public class AdminRoundController {

    private final RoundService roundService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Round createRound(
            @Valid @RequestBody CreateRoundRequest request) {

        return roundService.createRound(request);
    }

    @GetMapping
    public List<Round> getTodayRounds() {

        return roundService.getTodayRounds();
    }

    @PutMapping("/{id}")
    public Round updateRound(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoundRequest request) {

        return roundService.updateRound(id, request);
    }
}