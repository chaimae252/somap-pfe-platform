package com.somap.backend.repository;

import com.somap.backend.entity.ContactMessage;
import com.somap.backend.enums.ContactMessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    List<ContactMessage> findAllByOrderByCreatedAtDesc();
    List<ContactMessage> findByClientIdOrderByCreatedAtDesc(Long clientId);
    long countByStatus(ContactMessageStatus status);

    @Modifying
    @Query("UPDATE ContactMessage m SET m.admin = null WHERE m.admin.id = :adminId")
    void detachAdmin(@Param("adminId") Long adminId);

    @Modifying
    @Query("DELETE FROM ContactMessage m WHERE m.client.id = :clientId")
    void deleteByClientIdBulk(@Param("clientId") Long clientId);
}
