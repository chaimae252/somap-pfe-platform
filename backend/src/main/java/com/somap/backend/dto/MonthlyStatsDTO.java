package com.somap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatsDTO {
    private String month;   // "Jan", "Fév", ...
    private long demandes;
    private long projets;
}