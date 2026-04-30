package com.somap.backend.service.impl;

import com.somap.backend.dto.ClientRegisterDTO;
import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.enums.Role;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ClientRepository clientRepository;

    @Override
    @Transactional
    public void registerClient(ClientRegisterDTO dto) {

        Client client = new Client();

        client.setNom(dto.getNom());
        client.setEmail(dto.getEmail());
        client.setMotDePasse(dto.getMotDePasse());
        client.setTelephone(dto.getTelephone());
        client.setAdresse(dto.getAdresse());

        client.setRole(Role.CLIENT);

        clientRepository.save(client);

        System.out.println("CLIENT REGISTERED ✔ " + client.getEmail());
    }

    @Override
    public LoginResponseDTO login(LoginRequestDTO dto) {

        Optional<Client> clientOpt = clientRepository.findByEmail(dto.getEmail());

        if (clientOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        Client client = clientOpt.get();

        if (!client.getMotDePasse().equals(dto.getMotDePasse())) {
            throw new RuntimeException("Wrong password");
        }

        LoginResponseDTO response = new LoginResponseDTO();
        response.setId(client.getId());
        response.setNom(client.getNom());
        response.setEmail(client.getEmail());
        response.setRole(client.getRole().name());

        return response;
    }
}