package com.somap.backend.repository;

import com.somap.backend.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjetRepository extends JpaRepository<Projet, Long> {

    List<Projet> findByClientId(Long clientId);
    List<Projet> findByClientIdOrderByDateDebutDesc(Long clientId);
    List<Projet> findAllByOrderByDateDebutDesc();
    Optional<Projet> findFirstByOrderByDateDebutDesc();
    long countByClientId(Long clientId);
    boolean existsByDemandeId(Long demandeId);

    @Query(value = "SELECT setval(pg_get_serial_sequence('projet', 'id'), COALESCE((SELECT MAX(id) FROM projet), 0) + 1, false)", nativeQuery = true)
    Long syncProjetIdSequence();
    Optional<Projet> findFirstByClientIdOrderByDateDebutDesc(
            Long clientId
    );
     
Optional<Projet> findByIdAndClientId(Long id, Long clientId); 

@Query("SELECT MONTH(p.dateDebut), COUNT(p) FROM Projet p WHERE p.dateDebut IS NOT NULL GROUP BY MONTH(p.dateDebut) ORDER BY MONTH(p.dateDebut)")
List<Object[]> countProjetsByMonth();

@Modifying
@Query("UPDATE Projet p SET p.admin = null WHERE p.admin.id = :adminId")
void detachAdmin(@Param("adminId") Long adminId);
}
