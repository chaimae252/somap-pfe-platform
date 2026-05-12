package com.somap.backend.service;

import com.somap.backend.dto.DashboardStatsDTO;

public interface DashboardService {

    DashboardStatsDTO getStats(Long clientId);
}