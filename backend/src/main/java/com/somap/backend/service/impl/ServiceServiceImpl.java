package com.somap.backend.service.impl;

import com.somap.backend.dto.ServiceDTO;
import com.somap.backend.entity.Service;
import com.somap.backend.entity.Admin;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.mapper.ServiceMapper;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.ServiceService;
import com.somap.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;


import java.util.List;
import java.util.stream.Collectors;
import com.somap.backend.repository.AdminRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Transactional
public class ServiceServiceImpl implements ServiceService {

    private final ServiceRepository serviceRepository;
    private final AdminRepository adminRepository;
    private final NotificationService notificationService;

    @Override
    public ServiceDTO createService(ServiceDTO serviceDTO) {

        Service service = ServiceMapper.toEntity(serviceDTO);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            adminRepository.findByEmail(email).ifPresent(service::setAdmin);
        }

        Service saved = serviceRepository.save(service);

        return ServiceMapper.toDTO(saved);
    }

    @Override
    public List<ServiceDTO> getAllServices() {

        return serviceRepository.findAll()
                .stream()
                .map(ServiceMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ServiceDTO getServiceById(Long id) {

        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        return ServiceMapper.toDTO(service);
    }

    @Override
    public ServiceDTO updateService(Long id, ServiceDTO serviceDTO) {

        Service existing = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        existing.setTitre(serviceDTO.getTitre());
        existing.setDescription(serviceDTO.getDescription());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            adminRepository.findByEmail(email).ifPresent(existing::setAdmin);
        }

        Service updated = serviceRepository.save(existing);

        return ServiceMapper.toDTO(updated);
    }

    @Override
    public void deleteService(Long id) {

        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        // 1. Resolve current admin name
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Admin currentAdmin = null;
        String adminName = "Un administrateur";
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            currentAdmin = adminRepository.findByEmail(email).orElse(null);
            if (currentAdmin != null) {
                adminName = currentAdmin.getNom();
            }
        }

        // 2. Notify other admins
        String serviceTitre = service.getTitre() != null ? service.getTitre() : "sans titre";
        String notifTitle = "Service supprimé";
        String notifMsg = String.format("L'administrateur %s a supprimé le service '%s'.", adminName, serviceTitre);

        try {
            List<Admin> admins = adminRepository.findAll();
            for (Admin admin : admins) {
                if (currentAdmin == null || !admin.getId().equals(currentAdmin.getId())) {
                    notificationService.notifyUser(
                            admin.getId(),
                            notifTitle,
                            notifMsg,
                            NotificationType.SYSTEME
                    );
                }
            }
        } catch (Exception e) {
            // ignore or log using a proper logger if needed
        }

        serviceRepository.delete(service);
    }
}