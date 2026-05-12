package com.somap.backend.service.impl;

import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DemandeRepository demandeRepository;
    private final ServiceRepository serviceRepository;
    private final ProjetRepository projetRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public DashboardStatsDTO getStats(Long clientId) {

        DashboardStatsDTO dto = new DashboardStatsDTO();

        dto.setDemandes(
                demandeRepository.countByClientId(clientId)
        );

        dto.setProjets(
                projetRepository.countByClientId(clientId)
        );

        dto.setNotifications(
                notificationRepository.countByUtilisateurId(clientId)
        );

        return dto;
    }
}