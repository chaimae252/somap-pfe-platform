package com.somap.backend.service;

import com.somap.backend.dto.ClientDTO;
import com.somap.backend.dto.DashboardStatsDTO;

import java.util.List;

public interface ClientService {

    List<ClientDTO> getAllClients();

    DashboardStatsDTO getStats();

    ClientDTO getClientById(Long id);

    ClientDTO updateClient(Long id, ClientDTO clientDTO);

    void deleteClient(Long id);
}
