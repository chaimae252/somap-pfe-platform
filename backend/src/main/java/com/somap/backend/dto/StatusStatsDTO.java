package com.somap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusStatsDTO {
    private String name;    // "En attente", "Approuvé", etc.
    private long value;
    private String color;   // optional, you can set colors in frontend
}