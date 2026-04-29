package com.somap.backend.repository;

import com.somap.backend.entity.Demande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    List<Demande> findByClientId(Long clientId);
}