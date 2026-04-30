package com.somap.backend.service.impl;

import com.somap.backend.dto.UtilisateurDTO;
import com.somap.backend.service.UtilisateurService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UtilisateurServiceImpl implements UtilisateurService {

    @Override
    public List<UtilisateurDTO> getAllUsers() {
        return null;
    }

    @Override
    public UtilisateurDTO getUserById(Long id) {
        return null;
    }

    @Override
    public void deleteUser(Long id) {

    }
}