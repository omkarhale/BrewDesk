package com.office.brewdesk.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderRequest {

    @NotNull
    private Long roundId;

    @NotNull
    private Long beverageId;
}