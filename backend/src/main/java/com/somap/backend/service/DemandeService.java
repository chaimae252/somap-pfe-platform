package com.somap.backend.service;

import com.somap.backend.dto.DemandeDTO;

import java.util.List;

public interface DemandeService {

    DemandeDTO createDemande(DemandeDTO demandeDTO);

    List<DemandeDTO> getAllDemandes();

    DemandeDTO getDemandeById(Long id);

    DemandeDTO updateDemandeStatus(Long id, String status);
    DemandeDTO updateDemande(Long id, DemandeDTO demandeDTO);
    void deleteDemande(Long id);
    List<DemandeDTO> getDemandesByClient(Long clientId);
}