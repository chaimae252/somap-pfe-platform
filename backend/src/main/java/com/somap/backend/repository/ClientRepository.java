package com.somap.backend.repository;

import com.somap.backend.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByEmail(String email);

}