package com.somap.backend.config;

import com.somap.backend.entity.*;
import com.somap.backend.enums.DemandeStatus;
import com.somap.backend.enums.ProjetStatus;
import com.somap.backend.enums.Role;
import com.somap.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            UtilisateurRepository utilisateurRepo,
            AdminRepository adminRepo,
            ClientRepository clientRepo,
            ServiceRepository serviceRepo,
            DemandeRepository demandeRepo,
            ProjetRepository projetRepo,
            CommentaireRepository commentaireRepo,
            NotificationRepository notificationRepo,
            ImageRepository imageRepo
    ) {

        return args -> {

            // 🛑 prevent duplicate seeding
            if (serviceRepo.count() > 0) {
                return;
            }

            // =========================
            // 👤 USERS
            // =========================

            Admin admin = new Admin();
            admin.setNom("Admin SOMAP");
            admin.setEmail("admin@somap.com");
            admin.setMotDePasse("1234");
            admin.setRole(Role.ADMIN);
            adminRepo.save(admin);

            Client client = new Client();
            client.setNom("Client Test");
            client.setEmail("client@somap.com");
            client.setMotDePasse("1234");
            client.setTelephone("0611111111");
            client.setAdresse("Rabat");
            client.setRole(Role.CLIENT);
            clientRepo.save(client);

            // =========================
            // 🛠 SERVICES
            // =========================

            Service s1 = new Service();
            s1.setTitre("Sablage industriel");
            s1.setDescription("Nettoyage et préparation des surfaces métalliques");

            Service s2 = new Service();
            s2.setTitre("Peinture industrielle");
            s2.setDescription("Protection anticorrosion des structures");

            serviceRepo.save(s1);
            serviceRepo.save(s2);

            // =========================
            // 📩 DEMANDE
            // =========================

            Demande d1 = new Demande();
            d1.setDescription("Besoin de sablage pour structure métallique");
            d1.setDateCreation(LocalDateTime.now());
            d1.setStatut(DemandeStatus.EN_ATTENTE);
            d1.setClient(client);
            d1.setService(s1);

            demandeRepo.save(d1);

            // =========================
            // 🏗 PROJET
            // =========================

            Projet p1 = new Projet();
            p1.setTitre("Projet Sablage - Casa Tram");
            p1.setDescription("Traitement de surface des pièces métalliques");
            p1.setDateDebut(LocalDateTime.now());
            p1.setStatut(ProjetStatus.EN_COURS);
            p1.setClient(client);
            p1.setDemande(d1);

            projetRepo.save(p1);

            // =========================
            // 💬 COMMENTAIRE
            // =========================

            Commentaire c1 = new Commentaire();
            c1.setContenu("Très bon service, travail propre !");
            c1.setDateCommentaire(LocalDateTime.now());
            c1.setClient(client);
            c1.setService(s1);

            commentaireRepo.save(c1);

            // =========================
            // 🖼 IMAGE (linked to comment + service + demande)
            // =========================

            Image img1 = new Image();
            img1.setImageUrl("https://example.com/image1.jpg");
            img1.setCommentaire(c1);
            img1.setService(s1);
            img1.setDemande(d1);

            imageRepo.save(img1);

            // =========================
            // 🔔 NOTIFICATION
            // =========================

            Notification n1 = new Notification();
            n1.setTitre("Nouvelle demande");
            n1.setMessage("Votre demande a été enregistrée");
            n1.setDateEnvoi(LocalDateTime.now());
            n1.setLu(false);
            n1.setUtilisateur(client);

            notificationRepo.save(n1);

            Notification n2 = new Notification();
            n2.setTitre("Admin info");
            n2.setMessage("Nouvelle demande reçue");
            n2.setDateEnvoi(LocalDateTime.now());
            n2.setLu(false);
            n2.setUtilisateur(admin);

            notificationRepo.save(n2);

        };
    }
}