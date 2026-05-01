package com.somap.backend.service;

import com.somap.backend.dto.AdminDTO;

import java.util.List;

public interface AdminService {

    List<AdminDTO> getAllAdmins();

    AdminDTO getAdminById(Long id);

    void deleteAdmin(Long id);
}