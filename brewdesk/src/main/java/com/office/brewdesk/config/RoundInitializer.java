package com.office.brewdesk.config;

import com.office.brewdesk.service.RoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoundInitializer implements CommandLineRunner {

    private final RoundService roundService;

    @Override
    public void run(String... args) {

        roundService.createTodayRounds();
    }
}