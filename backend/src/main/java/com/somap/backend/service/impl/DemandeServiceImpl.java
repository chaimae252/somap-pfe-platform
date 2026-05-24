package com.somap.backend.service.impl;

import com.somap.backend.dto.DemandeDTO;
import com.somap.backend.entity.Demande;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Service;
import com.somap.backend.enums.DemandeStatus;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.DemandeService;
import com.somap.backend.service.NotificationService;
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
    private final NotificationService notificationService;

    // 🔥 CREATE DEMANDE
    @Override
    public DemandeDTO createDemande(DemandeDTO dto) {

        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Service service = serviceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Demande demande = new Demande();
        demande.setObjet(dto.getObjet());
        demande.setDescription(dto.getDescription());
        demande.setDateCreation(LocalDateTime.now());
        demande.setStatut(DemandeStatus.EN_ATTENTE);
        demande.setClient(client);
        demande.setService(service);
        demande.setUrgence(dto.getUrgence());
        Demande saved = demandeRepository.save(demande);

        try {
            notificationService.notifyUser(
                    client.getId(),
                    "Demande envoyée",
                    "Votre demande \"" + saved.getObjet() + "\" a bien été reçue.",
                    NotificationType.DEMANDE,
                    "DEMANDE",
                    saved.getId()
            );
        } catch (Exception e) {
            System.out.println("Notification demande client error: " + e.getMessage());
        }

        try {
            notificationService.notifyAdmins(
                    "Nouvelle demande reçue",
                    client.getNom() + " a créé une nouvelle demande : " + saved.getObjet(),
                    NotificationType.DEMANDE,
                    "DEMANDE",
                    saved.getId()
            );
        } catch (Exception e) {
            System.out.println("Notification demande admin error: " + e.getMessage());
        }

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
        System.out.println("[NOTIF DEBUG] DemandeService.updateDemandeStatus START id=" + id + " rawStatus=" + status);

        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found"));

        DemandeStatus oldStatus = demande.getStatut();
        DemandeStatus newStatus = DemandeStatus.valueOf(status);
        Long clientId = demande.getClient() != null ? demande.getClient().getId() : null;

        System.out.println("[NOTIF DEBUG] DemandeService.updateDemandeStatus loaded id=" + id
                + " oldStatus=" + oldStatus
                + " newStatus=" + newStatus
                + " clientId=" + clientId
                + " objet=" + demande.getObjet());

        demande.setStatut(newStatus);

        Demande updated = demandeRepository.save(demande);
        System.out.println("[NOTIF DEBUG] DemandeService.updateDemandeStatus saved id=" + updated.getId()
                + " savedStatus=" + updated.getStatut());

        notifyClientAboutStatusChange(updated, oldStatus, newStatus);

        return mapToDTO(updated);
    }
    @Override
public DemandeDTO updateDemande(Long id, DemandeDTO dto) {
    System.out.println("[NOTIF DEBUG] DemandeService.updateDemande START id=" + id
            + " dtoStatus=" + dto.getStatut());
    Demande demande = demandeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Demande not found"));

    DemandeStatus oldStatus = demande.getStatut();
    Long clientId = demande.getClient() != null ? demande.getClient().getId() : null;

    System.out.println("[NOTIF DEBUG] DemandeService.updateDemande loaded id=" + id
            + " oldStatus=" + oldStatus
            + " dtoStatus=" + dto.getStatut()
            + " clientId=" + clientId
            + " objet=" + demande.getObjet());

    demande.setObjet(dto.getObjet());
    demande.setDescription(dto.getDescription());
    demande.setUrgence(dto.getUrgence());

    if (dto.getStatut() != null) {
        demande.setStatut(dto.getStatut());
    }

    Demande updated = demandeRepository.save(demande);
    System.out.println("[NOTIF DEBUG] DemandeService.updateDemande saved id=" + updated.getId()
            + " savedStatus=" + updated.getStatut());

    notifyClientAboutStatusChange(updated, oldStatus, updated.getStatut());

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
        dto.setObjet(demande.getObjet()); 
        dto.setDescription(demande.getDescription());
        dto.setDateCreation(demande.getDateCreation());
        dto.setStatut(demande.getStatut());
        dto.setUrgence(demande.getUrgence());
        dto.setClientId(demande.getClient().getId());
        dto.setServiceId(demande.getService().getId());

        return dto;
    }
    @Override
public List<DemandeDTO> getDemandesByClient(Long clientId) {
    return demandeRepository.findByClientId(clientId)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
}

    private String getStatusLabel(DemandeStatus status) {
        return switch (status) {
            case EN_ATTENTE -> "en attente";
            case VALIDEE -> "validée";
            case REJETEE -> "rejetée";
        };
    }

    private void notifyClientAboutStatusChange(
            Demande demande,
            DemandeStatus oldStatus,
            DemandeStatus newStatus
    ) {
        Long clientId = demande.getClient() != null ? demande.getClient().getId() : null;
        System.out.println("[NOTIF DEBUG] notifyClientAboutStatusChange demandeId=" + demande.getId()
                + " oldStatus=" + oldStatus
                + " newStatus=" + newStatus
                + " clientId=" + clientId);

        if (oldStatus == newStatus || demande.getClient() == null) {
            System.out.println("[NOTIF DEBUG] notifyClientAboutStatusChange SKIP demandeId=" + demande.getId()
                    + " sameStatus=" + (oldStatus == newStatus)
                    + " hasClient=" + (demande.getClient() != null));
            return;
        }

        try {
            var notification = notificationService.notifyUser(
                    demande.getClient().getId(),
                    "Statut de votre demande mis à jour",
                    "Votre demande \"" + demande.getObjet() + "\" est maintenant " + getStatusLabel(newStatus) + ".",
                    NotificationType.DEMANDE,
                    "DEMANDE",
                    demande.getId()
            );
            System.out.println("[NOTIF DEBUG] notifyClientAboutStatusChange CREATED notificationId="
                    + notification.getId()
                    + " userId=" + notification.getUtilisateurId()
                    + " demandeId=" + demande.getId());
        } catch (Exception e) {
            System.out.println("Notification demande status error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
