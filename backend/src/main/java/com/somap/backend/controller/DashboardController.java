package com.somap.backend.controller;

import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats/{clientId}")
    public DashboardStatsDTO getStats(
            @PathVariable Long clientId
    ) {
        return dashboardService.getStats(clientId);
    }
}