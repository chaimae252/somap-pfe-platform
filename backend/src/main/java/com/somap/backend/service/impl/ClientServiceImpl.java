package com.somap.backend.service.impl;

import com.somap.backend.dto.ClientDTO;
import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Admin;
import com.somap.backend.entity.Demande;
import com.somap.backend.entity.Projet;
import com.somap.backend.enums.NotificationType;
import com.somap.backend.mapper.ClientMapper;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.repository.AdminRepository;
import com.somap.backend.service.ClientService;
import com.somap.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final DemandeRepository demandeRepository;
    private final ProjetRepository projetRepository;
    private final ServiceRepository serviceRepository;
    private final NotificationRepository notificationRepository;
    private final AdminRepository adminRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllClients() {

        List<Client> clients = clientRepository.findAll();

        return clients.stream()
                .map(this::toDTOWithActivity)
                .toList();
    }

    @Override
    public DashboardStatsDTO getStats() {
        return DashboardStatsDTO.builder()
                .clients(clientRepository.count())
                .demandes(demandeRepository.count())
                .projets(projetRepository.count())
                .services(serviceRepository.count())
                .notifications(notificationRepository.count())
                .build();
    }

    @Override
    public ClientDTO getClientById(Long id) {


        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        return toDTOWithActivity(client);
    }

    @Override
    public ClientDTO updateClient(Long id, ClientDTO clientDTO) {

        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        client.setNom(clientDTO.getNom());
        client.setEmail(clientDTO.getEmail());
        client.setTelephone(clientDTO.getTelephone());
        client.setAdresse(clientDTO.getAdresse());

        Client updatedClient = clientRepository.save(client);

        return toDTOWithActivity(updatedClient);
    }

    @Override
    public void deleteClient(Long id) {

        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

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
        String clientNom = client.getNom() != null ? client.getNom() : "sans nom";
        String notifTitle = "Client supprimé";
        String notifMsg = String.format("L'administrateur %s a supprimé le compte client de %s.", adminName, clientNom);

        try {
            List<Admin> admins = adminRepository.findAll();
            for (Admin admin : admins) {
                if (currentAdmin == null || !admin.getId().equals(currentAdmin.getId())) {
                    notificationService.notifyUser(
                            admin.getId(),
                            notifTitle,
                            notifMsg,
                            NotificationType.SYSTEME
                    );
                }
            }
        } catch (Exception e) {
            // ignore
        }

        clientRepository.delete(client);
    }

    private ClientDTO toDTOWithActivity(Client client) {
        ClientDTO dto = ClientMapper.toDTO(client);
        Long clientId = client.getId();
        List<Demande> demandes = demandeRepository.findByClientId(clientId);
        List<Projet> projets = projetRepository.findByClientId(clientId);

        dto.setDemandesCount(demandes.size());
        dto.setProjetsCount(projets.size());
        dto.setDemandeTitres(demandes.stream()
                .map(demande -> demande.getObjet() != null ? demande.getObjet() : "Demande sans titre")
                .toList());
        dto.setProjetTitres(projets.stream()
                .map(projet -> projet.getTitre() != null ? projet.getTitre() : "Projet sans titre")
                .toList());

        return dto;
    }

    @Override
    @Transactional
    public void updatePushToken(Long id, String pushToken) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));
        client.setPushToken(pushToken);
        clientRepository.save(client);
    }
}
