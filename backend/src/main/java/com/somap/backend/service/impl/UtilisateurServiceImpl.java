package com.somap.backend.service.impl;

import com.somap.backend.dto.UtilisateurDTO;
import com.somap.backend.entity.Utilisateur;
import com.somap.backend.repository.UtilisateurRepository;
import com.somap.backend.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    // =========================
    // GET ALL USERS
    // =========================
    @Override
    public List<UtilisateurDTO> getAllUsers() {

        return utilisateurRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // =========================
    // GET USER BY ID
    // =========================
    @Override
    public UtilisateurDTO getUserById(Long id) {

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec id: " + id));

        return mapToDTO(user);
    }

    // =========================
    // DELETE USER
    // =========================
    @Override
    public void deleteUser(Long id) {

        if (!utilisateurRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur introuvable avec id: " + id);
        }

        utilisateurRepository.deleteById(id);
    }

    // =========================
    // MAPPER (Entity -> DTO)
    // =========================
    private UtilisateurDTO mapToDTO(Utilisateur user) {

        UtilisateurDTO dto = new UtilisateurDTO();

        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setEmail(user.getEmail());

        return dto;
    }
}