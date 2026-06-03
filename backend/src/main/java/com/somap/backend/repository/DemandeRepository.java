package com.somap.backend.repository;

import com.somap.backend.entity.Demande;
import com.somap.backend.enums.DemandeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    List<Demande> findByClientId(Long clientId);
    List<Demande> findByStatut(DemandeStatus statut);
    long countByClientId(Long clientId);
    long countByStatut(DemandeStatus statut);

    // Monthly count of demandes (all clients)
    @Query(value = "SELECT EXTRACT(MONTH FROM date_creation) as month, COUNT(*) FROM demande GROUP BY month ORDER BY month", nativeQuery = true)
    List<Object[]> countDemandesByMonth();

    // Status distribution of demandes (all clients)
    @Query(value = "SELECT statut, COUNT(*) FROM demande GROUP BY statut", nativeQuery = true)
    List<Object[]> countDemandesByStatus();
}
