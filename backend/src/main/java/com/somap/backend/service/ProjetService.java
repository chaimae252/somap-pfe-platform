package com.somap.backend.service;

import com.somap.backend.dto.ProjetDTO;

import java.util.List;

public interface ProjetService {

    ProjetDTO createProjet(ProjetDTO projetDTO);

    List<ProjetDTO> getAllProjects();

    ProjetDTO getProjetById(Long id);

    ProjetDTO updateProjet(Long id, ProjetDTO projetDTO);

    void deleteProjet(Long id);
}