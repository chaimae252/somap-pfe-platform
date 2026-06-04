package com.somap.backend.repository;

import com.somap.backend.entity.Demande;
import com.somap.backend.enums.DemandeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    List<Demande> findByClientId(Long clientId);
    List<Demande> findByStatut(DemandeStatus statut);
    List<Demande> findByClientIdOrderByDateCreationDesc(Long clientId);
    List<Demande> findAllByOrderByDateCreationDesc();
    long countByClientId(Long clientId);
    long countByStatut(DemandeStatus statut);

    // Monthly count of demandes (all clients)
    @Query("SELECT MONTH(d.dateCreation), COUNT(d) FROM Demande d WHERE d.dateCreation IS NOT NULL GROUP BY MONTH(d.dateCreation) ORDER BY MONTH(d.dateCreation)")
    List<Object[]> countDemandesByMonth();

    // Status distribution of demandes (all clients)
    @Query(value = "SELECT statut, COUNT(*) FROM demande GROUP BY statut", nativeQuery = true)
    List<Object[]> countDemandesByStatus();
}
