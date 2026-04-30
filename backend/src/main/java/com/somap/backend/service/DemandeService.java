package com.somap.backend.service;

import com.somap.backend.dto.DemandeDTO;

import java.util.List;

public interface DemandeService {

    DemandeDTO createDemande(DemandeDTO demandeDTO);

    List<DemandeDTO> getAllDemandes();

    DemandeDTO getDemandeById(Long id);

    DemandeDTO updateDemandeStatus(Long id, String status);

    void deleteDemande(Long id);
}