package com.somap.backend.service.impl;

import com.somap.backend.dto.ProjetDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Demande;
import com.somap.backend.entity.Projet;
import com.somap.backend.exception.ResourceNotFoundException;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.service.ProjetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjetServiceImpl implements ProjetService {

    private final ProjetRepository projetRepository;
    private final ClientRepository clientRepository;
    private final DemandeRepository demandeRepository;

    @Override
    public ProjetDTO createProjet(ProjetDTO projetDTO) {

        Client client = clientRepository.findById(projetDTO.getClientId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Client introuvable"));

        Demande demande = demandeRepository.findById(projetDTO.getDemandeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Demande introuvable"));

        Projet projet = new Projet();

        projet.setTitre(projetDTO.getTitre());
        projet.setDescription(projetDTO.getDescription());
        projet.setStatut(projetDTO.getStatut());
        projet.setDateDebut(LocalDateTime.now());
        projet.setDateFin(projetDTO.getDateFin());
        projet.setClient(client);
        projet.setDemande(demande);

        Projet savedProjet = projetRepository.save(projet);

        return mapToDTO(savedProjet);
    }

    @Override
    public List<ProjetDTO> getAllProjects() {

        return projetRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProjetDTO getProjetById(Long id) {

        Projet projet = projetRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Projet introuvable"));

        return mapToDTO(projet);
    }

    @Override
    public ProjetDTO updateProjet(Long id, ProjetDTO projetDTO) {

        Projet projet = projetRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Projet introuvable"));

        Client client = clientRepository.findById(projetDTO.getClientId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Client introuvable"));

        Demande demande = demandeRepository.findById(projetDTO.getDemandeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Demande introuvable"));

        projet.setTitre(projetDTO.getTitre());
        projet.setDescription(projetDTO.getDescription());
        projet.setStatut(projetDTO.getStatut());
        projet.setDateDebut(projetDTO.getDateDebut());
        projet.setDateFin(projetDTO.getDateFin());
        projet.setClient(client);
        projet.setDemande(demande);

        Projet updatedProjet = projetRepository.save(projet);

        return mapToDTO(updatedProjet);
    }

    @Override
    public void deleteProjet(Long id) {

        Projet projet = projetRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Projet introuvable"));

        projetRepository.delete(projet);
    }

    // =========================
    // MAPPER
    // =========================

    private ProjetDTO mapToDTO(Projet projet) {

        ProjetDTO dto = new ProjetDTO();

        dto.setId(projet.getId());
        dto.setTitre(projet.getTitre());
        dto.setDescription(projet.getDescription());
        dto.setStatut(projet.getStatut());
        dto.setDateDebut(projet.getDateDebut());
        dto.setDateFin(projet.getDateFin());

        if (projet.getClient() != null) {
            dto.setClientId(projet.getClient().getId());
        }

        if (projet.getDemande() != null) {
            dto.setDemandeId(projet.getDemande().getId());
        }

        return dto;
    }
}