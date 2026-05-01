package com.somap.backend.controller;

import com.somap.backend.dto.AdminDTO;
import com.somap.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminDTO>> getAllAdmins() {

        return ResponseEntity.ok(
                adminService.getAllAdmins()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminDTO> getAdminById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                adminService.getAdminById(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAdmin(
            @PathVariable Long id
    ) {

        adminService.deleteAdmin(id);

        return ResponseEntity.ok("Admin supprimé avec succès");
    }
}