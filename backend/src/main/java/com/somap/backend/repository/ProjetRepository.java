package com.somap.backend.repository;

import com.somap.backend.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProjetRepository extends JpaRepository<Projet, Long> {

    List<Projet> findByClientId(Long clientId);
    Optional<Projet> findFirstByOrderByDateDebutDesc();
    long countByClientId(Long clientId);
    Optional<Projet> findFirstByClientIdOrderByDateDebutDesc(
            Long clientId
    );
     
Optional<Projet> findByIdAndClientId(Long id, Long clientId); 

@Query(value = "SELECT EXTRACT(MONTH FROM date_debut) as month, COUNT(*) FROM projet GROUP BY month ORDER BY month", nativeQuery = true)
List<Object[]> countProjetsByMonth();
}