package com.office.brewdesk.service;

import com.office.brewdesk.dto.OrderRequest;
import com.office.brewdesk.dto.OrderResponse;
import com.office.brewdesk.entity.Beverage;
import com.office.brewdesk.entity.BeverageOrder;
import com.office.brewdesk.entity.Round;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.BeverageOrderRepository;
import com.office.brewdesk.repository.BeverageRepository;
import com.office.brewdesk.repository.RoundRepository;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final BeverageOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BeverageRepository beverageRepository;
    private final RoundRepository roundRepository;

    public OrderResponse createOrder(OrderRequest request) {

        // 1. Get logged-in employee from JWT
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User employee = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Employee not found"));

        // 2. Find round
        Round round = roundRepository.findById(request.getRoundId())
                .orElseThrow(() ->
                        new RuntimeException("Round not found"));

        validateRound(round);

        // 3. Find beverage
        Beverage beverage = beverageRepository.findById(request.getBeverageId())
                .orElseThrow(() ->
                        new RuntimeException("Beverage not found"));

        // 4. Check duplicate order
        if (orderRepository
                .findByRoundIdAndEmployeeId(
                        request.getRoundId(),
                        employee.getId()
                )
                .isPresent()) {

            throw new RuntimeException(
                    "You have already selected a beverage for this round"
            );
        }

        // 5. Create order
        BeverageOrder order = BeverageOrder.builder()
                .employee(employee)
                .round(round)
                .beverage(beverage)
                .build();

        // 6. Save
        BeverageOrder savedOrder = orderRepository.save(order);

        // 7. Return response
        return OrderResponse.builder()
                .orderId(savedOrder.getId())
                .employeeName(employee.getName())
                .beverageName(beverage.getName())
                .roundName(round.getName())
                .createdAt(savedOrder.getCreatedAt())
                .build();
    }

    private void validateRound(Round round) {

        if (!round.getDate().equals(LocalDate.now())) {

            throw new RuntimeException(
                    "You can only order for today's round"
            );
        }

        LocalTime now = LocalTime.now();

        if (now.isBefore(round.getStartTime())) {

            throw new RuntimeException(
                    "This round has not started yet"
            );
        }

        if (now.isAfter(round.getCutoffTime())) {

            throw new RuntimeException(
                    "This round is already closed"
            );
        }
    }
}