package com.somap.backend.service;

import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.dto.MonthlyStatsDTO;
import com.somap.backend.dto.StatusStatsDTO;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
public interface DashboardService {

    DashboardStatsDTO getStats(Long clientId);
    List<MonthlyStatsDTO> getMonthlyStats();  // no clientId needed
List<StatusStatsDTO> getStatusStats();
 }