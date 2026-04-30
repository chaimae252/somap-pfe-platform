package com.somap.backend.service.impl;

import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;
import com.somap.backend.dto.RegisterRequestDTO;
import com.somap.backend.service.AuthService;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Override
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        return null;
    }

    @Override
    public void register(RegisterRequestDTO registerRequestDTO) {

    }
}