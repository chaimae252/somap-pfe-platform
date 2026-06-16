package com.somap.backend.service;

import com.somap.backend.dto.AdminRegisterDTO;
import com.somap.backend.dto.AuthResponseDTO;
import com.somap.backend.dto.ClientRegisterDTO;
import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;

public interface AuthService {

    AuthResponseDTO registerClient(ClientRegisterDTO dto);
    AuthResponseDTO registerAdmin(AdminRegisterDTO dto);

    LoginResponseDTO login(LoginRequestDTO dto);

    // NEW
    void forgotPassword(String email);

    // NEW
    boolean verifyCode(String email, String code);

    // NEW
    void resetPassword(String email, String newPassword);
    void changePassword(String token, String currentPassword, String newPassword);
    void forgotPasswordLoggedIn(String token);
    void forgotPasswordTemp(String email);

    com.somap.backend.dto.TokenRefreshResponseDTO refreshToken(com.somap.backend.dto.TokenRefreshRequestDTO request);
    void logout(Long userId);
}