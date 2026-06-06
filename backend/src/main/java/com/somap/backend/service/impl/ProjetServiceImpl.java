package com.somap.backend.service.impl;

import com.somap.backend.dto.ProjetDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Demande;
import com.somap.backend.entity.Projet;
import com.somap.backend.entity.Admin;
import com.somap.backend.enums.DemandeStatus;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.enums.ProjetStatus;
import com.somap.backend.exception.ResourceNotFoundException;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.service.NotificationService;
import com.somap.backend.service.ProjetService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjetServiceImpl implements ProjetService {

    private final ProjetRepository projetRepository;
    private final ClientRepository clientRepository;
    private final DemandeRepository demandeRepository;
    private final NotificationService notificationService;
    private final AdminRepository adminRepository;


    @Override
    public ProjetDTO createProjet(ProjetDTO projetDTO) {

        Client client = clientRepository.findById(projetDTO.getClientId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Client introuvable"));

        Demande demande = demandeRepository.findById(projetDTO.getDemandeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Demande introuvable"));
         if (projetRepository.existsByDemandeId(demande.getId())) {
            throw new RuntimeException("Un projet existe déjà pour cette demande");
        }
        Projet projet = new Projet();

        projet.setTitre(projetDTO.getTitre());
        projet.setDescription(projetDTO.getDescription());
        projet.setStatut(projetDTO.getStatut());
        projet.setDateDebut(LocalDateTime.now());
        projet.setDateFin(projetDTO.getDateFin());
        projet.setClient(client);
        projet.setDemande(demande);
        demande.setProjet(projet);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            adminRepository.findByEmail(email).ifPresent(projet::setAdmin);
        }

        projetRepository.syncProjetIdSequence();
        Projet savedProjet = projetRepository.save(projet);

        try {
            notificationService.notifyUser(
                    client.getId(),
                    "Nouveau projet créé",
                    "Votre projet \"" + savedProjet.getTitre() + "\" a été créé.",
                    NotificationType.PROJET,
                    "PROJET",
                    savedProjet.getId()
            );
        } catch (Exception e) {
            System.out.println("Notification projet create error: " + e.getMessage());
        }

        return mapToDTO(savedProjet);
    }

     @Override
    public List<ProjetDTO> getAllProjects() {
        return projetRepository.findAllByOrderByDateDebutDesc()
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
           Long currentDemandeId = projet.getDemande() != null ? projet.getDemande().getId() : null;
        if (!demande.getId().equals(currentDemandeId)
                && projetRepository.existsByDemandeId(demande.getId())) {
            throw new RuntimeException("Un projet existe déjà pour cette demande");
        }
        
        var oldStatus = projet.getStatut();

        projet.setTitre(projetDTO.getTitre());
        projet.setDescription(projetDTO.getDescription());
        projet.setStatut(projetDTO.getStatut());
        projet.setDateDebut(projetDTO.getDateDebut());
        projet.setDateFin(projetDTO.getDateFin());
        projet.setClient(client);
        projet.setDemande(demande);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            adminRepository.findByEmail(email).ifPresent(projet::setAdmin);
        }

        Projet updatedProjet = projetRepository.save(projet);

        try {
            String message = oldStatus != projet.getStatut()
                    ? "Le statut de votre projet \"" + updatedProjet.getTitre() + "\" a été mis à jour."
                    : "Votre projet \"" + updatedProjet.getTitre() + "\" a été mis à jour.";

            notificationService.notifyUser(
                    client.getId(),
                    "Mise à jour de projet",
                    message,
                    NotificationType.PROJET,
                    "PROJET",
                    updatedProjet.getId()
            );
        } catch (Exception e) {
            System.out.println("Notification projet update error: " + e.getMessage());
        }

        return mapToDTO(updatedProjet);
     }

    @Override
    @Transactional
    public void deleteProjet(Long id) {

        Projet projet = projetRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Projet introuvable"));

        // 1. Resolve current admin name
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Admin currentAdmin = null;
        String adminName = "Un administrateur";
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            currentAdmin = adminRepository.findByEmail(email).orElse(null);
            if (currentAdmin != null) {
                adminName = currentAdmin.getNom();
            }
        }

        // 2. Notify other admins
        String projetTitre = projet.getTitre() != null ? projet.getTitre() : "sans titre";
        String notifTitle = "Projet supprimé";
        String notifMsg = String.format("L'administrateur %s a supprimé le projet '%s'.", adminName, projetTitre);

        try {
            List<Admin> admins = adminRepository.findAll();
            for (Admin admin : admins) {
                if (currentAdmin == null || !admin.getId().equals(currentAdmin.getId())) {
                    notificationService.notifyUser(
                            admin.getId(),
                            notifTitle,
                            notifMsg,
                            NotificationType.PROJET
                    );
                }
            }
        } catch (Exception e) {
            System.out.println("[DELETE PROJET] Other admins notification failed: " + e.getMessage());
        }

        Demande demande = projet.getDemande();
        if (demande != null) {
            demandeRepository.delete(demande);
            return;
        }

        projetRepository.delete(projet);
    }
    private void createMissingProjectsForValidatedDemandes() {
        demandeRepository.findByStatut(DemandeStatus.VALIDEE).forEach(demande -> {
            if (demande.getClient() == null || projetRepository.existsByDemandeId(demande.getId())) {
                return;
            }

            Projet projet = new Projet();
            projet.setTitre(demande.getObjet());
            projet.setDescription(demande.getDescription());
            projet.setStatut(ProjetStatus.EN_COURS);
            projet.setDateDebut(LocalDateTime.now());
            projet.setClient(demande.getClient());
            projet.setDemande(demande);
            projet.setAdmin(demande.getAdmin());
            demande.setProjet(projet);

            projetRepository.syncProjetIdSequence();
            Projet savedProjet = projetRepository.saveAndFlush(projet);

            try {
                notificationService.notifyUser(
                        demande.getClient().getId(),
                        "Nouveau projet créé",
                        "Votre demande \"" + demande.getObjet() + "\" a été validée et un projet a été créé.",
                        NotificationType.PROJET,
                        "PROJET",
                        savedProjet.getId()
                );
            } catch (Exception e) {
                System.out.println("Notification missing projet error: " + e.getMessage());
            }
        });
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
            dto.setClientNom(projet.getClient().getNom());
        }

        if (projet.getDemande() != null) {
            dto.setDemandeId(projet.getDemande().getId());
            dto.setDemandeObjet(projet.getDemande().getObjet());
            if (projet.getDemande().getStatut() != null) {
                dto.setDemandeStatut(projet.getDemande().getStatut().name());
            }
            if (projet.getDemande().getService() != null) {
                dto.setServiceTitre(projet.getDemande().getService().getTitre());
            }
        }

        if (projet.getAdmin() != null) {
            dto.setAdminId(projet.getAdmin().getId());
            dto.setAdminNom(projet.getAdmin().getNom());
        }

        return dto;
    }

     @Override
    public ProjetDTO getCurrentProject(Long clientId) {
        Projet projet = projetRepository
                .findFirstByClientIdOrderByDateDebutDesc(clientId)
                .orElseThrow(() ->
                        new RuntimeException("Aucun projet trouvé")
                );

        return mapToDTO(projet);
    }
    @Override
public List<ProjetDTO> getProjectsByClient(Long clientId) {
    return projetRepository.findByClientIdOrderByDateDebutDesc(clientId)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
}
}
