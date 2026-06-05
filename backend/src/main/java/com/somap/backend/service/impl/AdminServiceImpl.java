package com.somap.backend.service.impl;

import com.somap.backend.dto.AdminDTO;
import com.somap.backend.dto.AdminUpdateDTO;
import com.somap.backend.dto.AuthResponseDTO;
import com.somap.backend.entity.Admin;
import com.somap.backend.mapper.AdminMapper;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.repository.ContactMessageRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.security.JwtService;
import com.somap.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final JwtService jwtService;
    private final DemandeRepository demandeRepository;
    private final ProjetRepository projetRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final NotificationRepository notificationRepository;

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
    public AuthResponseDTO updateAdmin(Long id, AdminUpdateDTO dto) {

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin introuvable"));

        String nom = dto.getNom() != null ? dto.getNom().trim() : "";
        String email = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : "";

        if (nom.isBlank()) {
            throw new RuntimeException("Le nom est obligatoire");
        }

        if (email.isBlank()) {
            throw new RuntimeException("L'email est obligatoire");
        }

        adminRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Cet email est déjà utilisé");
                });

        admin.setNom(nom);
        admin.setEmail(email);

        Admin updated = adminRepository.save(admin);

        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(jwtService.generateToken(updated));
        response.setId(updated.getId());
        response.setNom(updated.getNom());
        response.setEmail(updated.getEmail());
        response.setRole(updated.getRole().name());

        return response;
    }

    @Override
    @Transactional
    public void deleteAdmin(Long id) {

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin introuvable"));

        demandeRepository.detachAdmin(id);
        projetRepository.detachAdmin(id);
        contactMessageRepository.detachAdmin(id);
        notificationRepository.deleteByUtilisateurIdBulk(id);

        adminRepository.delete(admin);
    }
}
