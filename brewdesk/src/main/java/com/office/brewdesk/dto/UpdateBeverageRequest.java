package com.office.brewdesk.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateBeverageRequest {

    @NotBlank
    private String name;

    private String icon;

    private boolean active;
}