package com.somap.backend.service.impl;

import com.somap.backend.dto.ClientDTO;
import com.somap.backend.dto.DashboardStatsDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.mapper.ClientMapper;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.DemandeRepository;
import com.somap.backend.repository.NotificationRepository;
import com.somap.backend.repository.ProjetRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final DemandeRepository demandeRepository;
    private final ProjetRepository projetRepository;
    private final ServiceRepository serviceRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public List<ClientDTO> getAllClients() {

        List<Client> clients = clientRepository.findAll();

        return clients.stream()
                .map(ClientMapper::toDTO)
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

        return ClientMapper.toDTO(client);
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

        return ClientMapper.toDTO(updatedClient);
    }

    @Override
    public void deleteClient(Long id) {

        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        clientRepository.delete(client);
    }
}
