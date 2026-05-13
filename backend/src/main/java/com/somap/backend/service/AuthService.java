package com.somap.backend.service;

import com.somap.backend.dto.AuthResponseDTO;
import com.somap.backend.dto.ClientRegisterDTO;
import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;

public interface AuthService {

    AuthResponseDTO registerClient(ClientRegisterDTO dto);

    LoginResponseDTO login(LoginRequestDTO dto);

    // NEW
    void forgotPassword(String email);

    // NEW
    boolean verifyCode(String email, String code);

    // NEW
    void resetPassword(String email, String newPassword);
}