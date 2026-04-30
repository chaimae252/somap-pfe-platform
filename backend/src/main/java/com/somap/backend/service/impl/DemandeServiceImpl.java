package com.somap.backend.service.impl;

import com.somap.backend.dto.DemandeDTO;
import com.somap.backend.service.DemandeService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DemandeServiceImpl implements DemandeService {

    @Override
    public DemandeDTO createDemande(DemandeDTO demandeDTO) {
        return null;
    }

    @Override
    public List<DemandeDTO> getAllDemandes() {
        return null;
    }

    @Override
    public DemandeDTO getDemandeById(Long id) {
        return null;
    }

    @Override
    public DemandeDTO updateDemandeStatus(Long id, String status) {
        return null;
    }

    @Override
    public void deleteDemande(Long id) {

    }
}