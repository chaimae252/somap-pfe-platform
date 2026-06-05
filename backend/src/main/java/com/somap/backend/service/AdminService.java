package com.somap.backend.service;

import com.somap.backend.dto.AdminDTO;
import com.somap.backend.dto.AdminUpdateDTO;
import com.somap.backend.dto.AuthResponseDTO;

import java.util.List;

public interface AdminService {

    List<AdminDTO> getAllAdmins();

    AdminDTO getAdminById(Long id);

    AuthResponseDTO updateAdmin(Long id, AdminUpdateDTO dto);

    void deleteAdmin(Long id);
}
