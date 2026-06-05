package com.somap.backend.repository;

import com.somap.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUtilisateurId(Long utilisateurId);

    long countByUtilisateurId(Long utilisateurId);

    List<Notification> findByUtilisateurIdOrderByDateEnvoiDesc(Long utilisateurId);

    List<Notification> findAllByOrderByDateEnvoiDesc();

    long countByUtilisateurIdAndLuFalse(Long utilisateurId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.utilisateur.id = :userId")
    void deleteByUtilisateurIdBulk(@Param("userId") Long userId);
}
