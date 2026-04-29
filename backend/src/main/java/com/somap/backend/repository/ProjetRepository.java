package com.somap.backend.repository;

import com.somap.backend.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjetRepository extends JpaRepository<Projet, Long> {

    List<Projet> findByClientId(Long clientId);
}