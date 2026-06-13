package com.somap.backend.controller;

import com.somap.backend.dto.AuthResponseDTO;
import com.somap.backend.dto.ClientRegisterDTO;
import com.somap.backend.dto.ForgotPasswordRequestDTO;
import com.somap.backend.dto.LoginRequestDTO;
import com.somap.backend.dto.LoginResponseDTO;
import com.somap.backend.dto.ResetPasswordDTO;
import com.somap.backend.dto.VerifyCodeDTO;
import com.somap.backend.dto.ChangePasswordRequestDTO;
import com.somap.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.somap.backend.dto.AdminRegisterDTO;
import com.somap.backend.dto.TokenRefreshRequestDTO;
import com.somap.backend.dto.TokenRefreshResponseDTO;
import com.somap.backend.service.EmailService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam String email) {
        try {
            String randomCode = String.valueOf((int)(Math.random() * 9000) + 1000);
            emailService.sendResetCode(email, randomCode);
            return ResponseEntity.ok("Email diagnostic test sent successfully with random code " + randomCode + " using current configuration.");
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send email. Error: " + e.getMessage() + "\nStacktrace:\n" + sw.toString());
        }
    }


    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @RequestBody ClientRegisterDTO dto
    ) {
        return ResponseEntity.ok(
                authService.registerClient(dto)
        );
    }
    @PostMapping("/register-admin")
public ResponseEntity<AuthResponseDTO> registerAdmin(
        @RequestBody AdminRegisterDTO dto
) {

    return ResponseEntity.ok(
            authService.registerAdmin(dto)
    );
}
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @RequestBody LoginRequestDTO loginRequestDTO
    ) {

        return ResponseEntity.ok(
                authService.login(loginRequestDTO)
        );
    }

    @PostMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(
        @RequestBody ForgotPasswordRequestDTO dto
) {

    authService.forgotPassword(dto.getEmail());

    return ResponseEntity.ok("Code envoyé");
}
@PostMapping("/verify-code")
public ResponseEntity<?> verifyCode(
        @RequestBody VerifyCodeDTO dto
) {

    boolean valid = authService.verifyCode(
            dto.getEmail(),
            dto.getCode()
    );

    if (!valid) {
        return ResponseEntity
                .badRequest()
                .body("Code invalide");
    }

    return ResponseEntity.ok("Code valide");
}
@PostMapping("/reset-password")
public ResponseEntity<?> resetPassword(
        @RequestBody ResetPasswordDTO dto
) {

    authService.resetPassword(
            dto.getEmail(),
            dto.getNewPassword()
    );

    return ResponseEntity.ok(
            "Mot de passe modifié"
    );
}
@PutMapping("/change-password")
public ResponseEntity<?> changePassword(
        @RequestHeader("Authorization") String authorization,
        @RequestBody ChangePasswordRequestDTO request
) {
    // Extract token from "Bearer <token>"
    String token = authorization.substring(7);
    authService.changePassword(token, request.getCurrentPassword(), request.getNewPassword());
    return ResponseEntity.ok("Mot de passe modifié avec succès");
}
@PostMapping("/forgot-password-logged-in")
public ResponseEntity<?> forgotPasswordLoggedIn(
        @RequestHeader("Authorization") String authorization
) {
    authService.forgotPasswordLoggedIn(authorization);
    return ResponseEntity.ok("Un nouveau mot de passe a été envoyé à votre adresse email");
}

@PostMapping("/refresh")
public ResponseEntity<TokenRefreshResponseDTO> refresh(
        @RequestBody TokenRefreshRequestDTO request
) {
    return ResponseEntity.ok(
            authService.refreshToken(request)
    );
}

@PostMapping("/logout")
public ResponseEntity<?> logout(
        @RequestBody java.util.Map<String, Long> payload
) {
    authService.logout(payload.get("userId"));
    return ResponseEntity.ok("Déconnecté avec succès");
}
}