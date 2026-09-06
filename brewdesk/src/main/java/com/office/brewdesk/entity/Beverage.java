package com.office.brewdesk.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "beverages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Beverage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String icon;

    @Builder.Default
    private boolean active = true;
}