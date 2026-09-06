package com.office.brewdesk.service;

import com.office.brewdesk.dto.BeverageSummary;
import com.office.brewdesk.dto.RoundSummaryResponse;
import com.office.brewdesk.entity.BeverageOrder;
import com.office.brewdesk.entity.Round;
import com.office.brewdesk.repository.BeverageOrderRepository;
import com.office.brewdesk.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoundSummaryService {

    private final RoundRepository roundRepository;
    private final BeverageOrderRepository orderRepository;

    public RoundSummaryResponse getRoundSummary(Long roundId) {

        // 1. Find round
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() ->
                        new RuntimeException("Round not found"));

        // 2. Get all orders
        List<BeverageOrder> orders =
                orderRepository.findByRoundId(roundId);

        // 3. Group orders by beverage
        Map<Long, List<BeverageOrder>> groupedOrders =
                orders.stream()
                        .collect(Collectors.groupingBy(
                                order -> order.getBeverage().getId()
                        ));

        // 4. Create beverage summary
        List<BeverageSummary> beverages =
                groupedOrders.values()
                        .stream()
                        .map(orderList -> {

                            BeverageOrder firstOrder =
                                    orderList.get(0);

                            return BeverageSummary.builder()
                                    .beverageName(
                                            firstOrder
                                                    .getBeverage()
                                                    .getName()
                                    )
                                    .icon(
                                            firstOrder
                                                    .getBeverage()
                                                    .getIcon()
                                    )
                                    .count(orderList.size())
                                    .build();
                        })
                        .toList();

        // 5. Return response
        return RoundSummaryResponse.builder()
                .roundId(round.getId())
                .roundName(round.getName())
                .totalOrders(orders.size())
                .beverages(beverages)
                .build();
    }
}