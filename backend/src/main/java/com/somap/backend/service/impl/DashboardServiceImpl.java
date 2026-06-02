package com.somap.backend.service.impl;

import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.dto.MonthlyStatsDTO;
import com.somap.backend.dto.StatusStatsDTO;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DemandeRepository demandeRepository;
    private final ServiceRepository serviceRepository;
    private final ProjetRepository projetRepository;
    private final NotificationRepository notificationRepository;
    private final ClientRepository clientRepository;

      @Override
    public DashboardStatsDTO getStats(Long clientId) {
           if (clientId != null) {
            return DashboardStatsDTO.builder()
                    .clients(clientRepository.existsById(clientId) ? 1 : 0)
                    .demandes(demandeRepository.countByClientId(clientId))
                    .projets(projetRepository.countByClientId(clientId))
                    .services(serviceRepository.count())
                    .notifications(notificationRepository.countByUtilisateurId(clientId))
                    .build();
        }
        return DashboardStatsDTO.builder()
                .clients(clientRepository.count())
                .demandes(demandeRepository.count())
                .projets(projetRepository.count())
                .services(serviceRepository.count())
                .notifications(notificationRepository.count())
                .build();
    }

    @Override
    public List<MonthlyStatsDTO> getMonthlyStats() {
        List<Object[]> demandesByMonth = demandeRepository.countDemandesByMonth();
        List<Object[]> projetsByMonth = projetRepository.countProjetsByMonth();

        Map<Integer, MonthlyStatsDTO> map = new HashMap<>();
        String[] monthNames = {"Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"};

        for (int i = 1; i <= 12; i++) {
            map.put(i, new MonthlyStatsDTO(monthNames[i - 1], 0, 0));
        }

        for (Object[] row : demandesByMonth) {
            Integer month = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            map.get(month).setDemandes(count);
        }

        for (Object[] row : projetsByMonth) {
            Integer month = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            map.get(month).setProjets(count);
        }

        List<MonthlyStatsDTO> result = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            result.add(map.get(i));
        }

        return result;
    }

    @Override
    public List<StatusStatsDTO> getStatusStats() {
        List<Object[]> statusCounts = demandeRepository.countDemandesByStatus();
        List<StatusStatsDTO> result = new ArrayList<>();
        for (Object[] row : statusCounts) {
            String status = String.valueOf(row[0]);
            long count = ((Number) row[1]).longValue();
            result.add(new StatusStatsDTO(status, count, null));
        }
        return result;
    }
}
