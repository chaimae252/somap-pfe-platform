package com.somap.backend.mapper;

import com.somap.backend.dto.AdminDTO;
import com.somap.backend.entity.Admin;

public class AdminMapper {

    public static AdminDTO toDTO(Admin admin) {

        if (admin == null) {
            return null;
        }

        AdminDTO dto = new AdminDTO();

        dto.setId(admin.getId());
        dto.setNom(admin.getNom());
        dto.setEmail(admin.getEmail());

        return dto;
    }

    public static Admin toEntity(AdminDTO dto) {

        if (dto == null) {
            return null;
        }

        Admin admin = new Admin();

        admin.setId(dto.getId());
        admin.setNom(dto.getNom());
        admin.setEmail(dto.getEmail());

        return admin;
    }
}