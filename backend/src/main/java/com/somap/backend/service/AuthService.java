package com.somap.backend.service;

import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;
import com.somap.backend.dto.RegisterRequestDTO;

public interface AuthService {

    LoginResponseDTO login(LoginRequestDTO loginRequestDTO);

    void register(RegisterRequestDTO registerRequestDTO);
}