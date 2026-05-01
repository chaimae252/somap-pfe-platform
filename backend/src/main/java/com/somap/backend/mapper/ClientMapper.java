package com.somap.backend.mapper;

import com.somap.backend.dto.ClientDTO;
import com.somap.backend.entity.Client;

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