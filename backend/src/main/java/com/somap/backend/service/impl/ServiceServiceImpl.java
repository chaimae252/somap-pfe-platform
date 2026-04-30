package com.somap.backend.service.impl;

import com.somap.backend.dto.ServiceDTO;
import com.somap.backend.service.ServiceService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceServiceImpl implements ServiceService {

    @Override
    public ServiceDTO createService(ServiceDTO serviceDTO) {
        return null;
    }

    @Override
    public List<ServiceDTO> getAllServices() {
        return null;
    }

    @Override
    public ServiceDTO getServiceById(Long id) {
        return null;
    }

    @Override
    public ServiceDTO updateService(Long id, ServiceDTO serviceDTO) {
        return null;
    }

    @Override
    public void deleteService(Long id) {

    }
}