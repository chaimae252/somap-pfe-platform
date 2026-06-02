package com.somap.backend.mapper;

import com.somap.backend.dto.ClientDTO;
import com.somap.backend.entity.Client;

import java.util.List;
import java.util.Optional;

public class ClientMapper {

    public static ClientDTO toDTO(Client client) {

        if (client == null) {
            return null;
        }

        ClientDTO dto = new ClientDTO();

        dto.setId(client.getId());
        dto.setNom(client.getNom());
        dto.setEmail(client.getEmail());
        dto.setTelephone(client.getTelephone());
        dto.setAdresse(client.getAdresse());
        dto.setDemandesCount(Optional.ofNullable(client.getDemandes()).map(List::size).orElse(0));
        dto.setProjetsCount(Optional.ofNullable(client.getProjets()).map(List::size).orElse(0));
        dto.setDemandeTitres(Optional.ofNullable(client.getDemandes()).orElse(List.of()).stream()
                .map(demande -> demande.getObjet() != null ? demande.getObjet() : "Demande sans titre")
                .toList());
        dto.setProjetTitres(Optional.ofNullable(client.getProjets()).orElse(List.of()).stream()
                .map(projet -> projet.getTitre() != null ? projet.getTitre() : "Projet sans titre")
                .toList());

        return dto;
    }

    public static Client toEntity(ClientDTO dto) {

        if (dto == null) {
            return null;
        }

        Client client = new Client();

        client.setId(dto.getId());
        client.setNom(dto.getNom());
        client.setEmail(dto.getEmail());
        client.setTelephone(dto.getTelephone());
        client.setAdresse(dto.getAdresse());

        return client;
    }
}
