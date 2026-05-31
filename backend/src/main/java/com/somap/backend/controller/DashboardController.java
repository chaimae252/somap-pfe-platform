package com.somap.backend.controller;

import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.dto.MonthlyStatsDTO;
import com.somap.backend.dto.StatusStatsDTO;
import com.somap.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
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
    
    @GetMapping("/monthly")
public List<MonthlyStatsDTO> getMonthlyStats() {
    return dashboardService.getMonthlyStats();
}

@GetMapping("/status")
public List<StatusStatsDTO> getStatusStats() {
    return dashboardService.getStatusStats();
}
}