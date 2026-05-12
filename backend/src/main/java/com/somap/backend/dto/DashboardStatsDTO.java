package com.somap.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {

    private long demandes;
    private long services;
    private long projets;
    private long notifications;
}