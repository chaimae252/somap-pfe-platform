package com.somap.backend.service;

import com.somap.backend.dto.ClientRegisterDTO;
import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;

public interface AuthService {

    void registerClient(ClientRegisterDTO dto);

    LoginResponseDTO login(LoginRequestDTO dto);
}