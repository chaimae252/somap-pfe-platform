package com.somap.backend.service.impl;

import com.somap.backend.dto.AdminDTO;
import com.somap.backend.entity.Admin;
import com.somap.backend.mapper.AdminMapper;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;

    @Override
    public List<AdminDTO> getAllAdmins() {

        List<Admin> admins = adminRepository.findAll();

        return admins.stream()
                .map(AdminMapper::toDTO)
                .toList();
    }

    @Override
    public AdminDTO getAdminById(Long id) {

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin introuvable"));

        return AdminMapper.toDTO(admin);
    }

    @Override
    public void deleteAdmin(Long id) {

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin introuvable"));

        adminRepository.delete(admin);
    }
}