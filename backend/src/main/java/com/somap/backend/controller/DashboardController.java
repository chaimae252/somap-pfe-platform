package com.somap.backend.controller;

import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.dto.MonthlyStatsDTO;
import com.somap.backend.dto.StatusStatsDTO;
import com.somap.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardStatsDTO getAdminStats() {
        return dashboardService.getStats(null);
    }

    @GetMapping("/stats/{clientId}")
    public DashboardStatsDTO getStats(@PathVariable Long clientId) {
        return dashboardService.getStats(clientId);
    }

    @GetMapping("/monthly")
    public List<MonthlyStatsDTO> getMonthlyStats() {
        return dashboardService.getMonthlyStats();
    }

    @GetMapping("/status")
    public List<StatusStatsDTO> getStatusStats() {
        return dashboardService.getStatusStats();
    }
}
