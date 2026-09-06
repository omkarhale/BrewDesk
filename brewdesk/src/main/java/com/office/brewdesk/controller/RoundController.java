package com.office.brewdesk.controller;

import com.office.brewdesk.dto.RoundSummaryResponse;
import com.office.brewdesk.entity.Round;
import com.office.brewdesk.service.RoundService;
import com.office.brewdesk.service.RoundSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rounds")
@RequiredArgsConstructor
public class RoundController {

    private final RoundService roundService;
    private final RoundSummaryService roundSummaryService;

    @GetMapping("/today")
    public List<Round> getTodayRounds() {

        return roundService.getTodayRounds();
    }
    @GetMapping("/{roundId}/summary")
    public RoundSummaryResponse getRoundSummary(
            @PathVariable Long roundId) {

        return roundSummaryService.getRoundSummary(roundId);
    }
}