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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
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
        return mapToResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User employee = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return orderRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(Long roundId) {
        List<BeverageOrder> orders = (roundId != null)
                ? orderRepository.findByRoundId(roundId)
                : orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void cancelOrder(Long orderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User employee = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        BeverageOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        boolean isAdmin = employee.getRole() != null &&
                (employee.getRole() == com.office.brewdesk.enums.Role.ADMIN ||
                 employee.getRole() == com.office.brewdesk.enums.Role.SUPER_ADMIN);

        if (!order.getEmployee().getId().equals(employee.getId()) && !isAdmin) {
            throw new RuntimeException("You can only cancel your own order");
        }

        validateRound(order.getRound());
        orderRepository.delete(order);
    }

    private OrderResponse mapToResponse(BeverageOrder order) {
        return OrderResponse.builder()
                .orderId(order.getId())
                .employeeId(order.getEmployee() != null ? order.getEmployee().getId() : null)
                .employeeName(order.getEmployee() != null ? order.getEmployee().getName() : null)
                .beverageId(order.getBeverage() != null ? order.getBeverage().getId() : null)
                .beverageName(order.getBeverage() != null ? order.getBeverage().getName() : null)
                .beverageIcon(order.getBeverage() != null ? order.getBeverage().getIcon() : null)
                .roundId(order.getRound() != null ? order.getRound().getId() : null)
                .roundName(order.getRound() != null ? order.getRound().getName() : null)
                .roundStatus(order.getRound() != null && order.getRound().getStatus() != null ? order.getRound().getStatus().name() : null)
                .createdAt(order.getCreatedAt())
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