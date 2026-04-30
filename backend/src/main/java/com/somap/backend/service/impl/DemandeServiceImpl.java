package com.somap.backend.service.impl;

import com.somap.backend.dto.DemandeDTO;
import com.somap.backend.entity.Demande;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Service;
import com.somap.backend.enums.DemandeStatus;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.DemandeService;
import lombok.RequiredArgsConstructor;


import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class DemandeServiceImpl implements DemandeService {

    private final DemandeRepository demandeRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;

    // 🔥 CREATE DEMANDE
    @Override
    public DemandeDTO createDemande(DemandeDTO dto) {

        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Service service = serviceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Demande demande = new Demande();
        demande.setDescription(dto.getDescription());
        demande.setDateCreation(LocalDateTime.now());
        demande.setStatut(DemandeStatus.EN_ATTENTE);
        demande.setClient(client);
        demande.setService(service);

        Demande saved = demandeRepository.save(demande);

        return mapToDTO(saved);
    }

    // 📋 GET ALL
    @Override
    public List<DemandeDTO> getAllDemandes() {
        return demandeRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 🔍 GET BY ID
    @Override
    public DemandeDTO getDemandeById(Long id) {

        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found"));

        return mapToDTO(demande);
    }

    // 🔄 UPDATE STATUS
    @Override
    public DemandeDTO updateDemandeStatus(Long id, String status) {

        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found"));

        demande.setStatut(DemandeStatus.valueOf(status));

        Demande updated = demandeRepository.save(demande);

        return mapToDTO(updated);
    }

    // ❌ DELETE
    @Override
    public void deleteDemande(Long id) {

        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found"));

        demandeRepository.delete(demande);
    }

    // 🔁 MAPPER (Entity → DTO)
    private DemandeDTO mapToDTO(Demande demande) {

        DemandeDTO dto = new DemandeDTO();
        dto.setId(demande.getId());
        dto.setDescription(demande.getDescription());
        dto.setDateCreation(demande.getDateCreation());
        dto.setStatut(demande.getStatut());

        dto.setClientId(demande.getClient().getId());
        dto.setServiceId(demande.getService().getId());

        return dto;
    }
}