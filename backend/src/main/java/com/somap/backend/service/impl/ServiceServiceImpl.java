package com.somap.backend.service.impl;

import com.somap.backend.dto.ServiceDTO;
import com.somap.backend.entity.Service;
import com.somap.backend.mapper.ServiceMapper;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.ServiceService;
import lombok.RequiredArgsConstructor;


import java.util.List;
import java.util.stream.Collectors;
import com.somap.backend.repository.AdminRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServiceServiceImpl implements ServiceService {

    private final ServiceRepository serviceRepository;
    private final AdminRepository adminRepository;

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

        serviceRepository.delete(service);
    }
}