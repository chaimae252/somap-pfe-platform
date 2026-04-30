package com.somap.backend.service;

import com.somap.backend.dto.UtilisateurDTO;

import java.util.List;

public interface UtilisateurService {

    List<UtilisateurDTO> getAllUsers();

    UtilisateurDTO getUserById(Long id);

    void deleteUser(Long id);
}