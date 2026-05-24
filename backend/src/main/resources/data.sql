DELETE FROM image;
DELETE FROM commentaire;
DELETE FROM notification;
DELETE FROM service;
DELETE FROM projet;
DELETE FROM demande;
DELETE FROM messages_contact;
DELETE FROM client;
DELETE FROM admin;
DELETE FROM utilisateur;

INSERT INTO utilisateur
(id, nom, email, mot_de_passe, role, reset_code, reset_code_expiration)
VALUES
    (1, 'Admin SOMAP', 'admin@somap.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiXkQh6eF4LwrEXsYlWc4qNi3Qm6oXm', 'ADMIN', NULL, NULL),
    (2, 'Maroc Industrie', 'contact@marocindustrie.ma', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiXkQh6eF4LwrEXsYlWc4qNi3Qm6oXm', 'CLIENT', NULL, NULL),
    (3, 'Atlas Maintenance', 'atlas.maintenance@gmail.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiXkQh6eF4LwrEXsYlWc4qNi3Qm6oXm', 'CLIENT', NULL, NULL),
    (4, 'Casa Métal', 'contact@casametal.ma', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiXkQh6eF4LwrEXsYlWc4qNi3Qm6oXm', 'CLIENT', NULL, NULL),
    (5, 'OCP Souss', 'maintenance@ocp-souss.ma', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiXkQh6eF4LwrEXsYlWc4qNi3Qm6oXm', 'CLIENT', NULL, NULL);

UPDATE utilisateur
SET mot_de_passe = '$2a$10$aFO97TVC2M23es3h15lQFekrt1N/TGM25DsTw2GqI85ZvL31okHeq';

INSERT INTO admin
(id)
VALUES
    (1);

INSERT INTO client
(id, telephone, adresse)
VALUES
    (2, '0522441100', 'Casablanca'),
    (3, '0537662200', 'Rabat'),
    (4, '0522357744', 'Mohammedia'),
    (5, '0528829911', 'Agadir');

INSERT INTO service (id, titre, description)
VALUES
    (1,
     'Sablage industriel',
     'Le sablage est une technique industrielle de préparation et de nettoyage des surfaces consistant à projeter un abrasif à grande vitesse afin d’éliminer les impuretés, la rouille, les anciennes couches de peinture et les résidus industriels. Ce procédé permet d’obtenir une surface propre et uniforme, idéale pour les traitements anticorrosion et l’application de nouvelles couches de protection. SOMAP & SERVICE met à disposition une expertise professionnelle et des équipements performants afin de garantir des résultats fiables, durables et conformes aux exigences industrielles.'
    ),

    (2,
     'Métallisation / Shoopage',
     'La métallisation, également appelée shoopage, est une solution anticorrosion avancée qui consiste à appliquer une ou plusieurs couches métalliques sur une surface afin de la protéger contre l’usure et les agressions extérieures. Ce procédé offre une excellente résistance dans les environnements industriels exigeants tels que les zones maritimes, chimiques ou fortement humides. Grâce à son savoir-faire et à ses techniques de pointe, SOMAP & SERVICE assure des traitements de haute qualité garantissant longévité, protection et performance des structures métalliques.'
    ),

    (3,
     'Peinture industrielle',
     'SOMAP & SERVICE propose des solutions complètes de peinture industrielle et bâtiment adaptées aux besoins des professionnels et des infrastructures industrielles. Nos prestations couvrent la préparation des surfaces, l’application de peintures techniques et les finitions de protection destinées à améliorer la résistance, l’esthétique et la durabilité des équipements et structures. Nous utilisons des produits de haute qualité répondant aux normes industrielles afin de garantir un rendu optimal et une protection durable contre la corrosion et les conditions environnementales.'
    ),

    (4,
     'Installation et équipements industriels',
     'Spécialisée dans les solutions industrielles intégrées, SOMAP & SERVICE assure l’installation et la mise en œuvre d’équipements liés aux traitements de surface et au traitement des eaux industrielles. Nos interventions comprennent l’installation de caillebotis, gaines, garde-corps, chéneaux et autres équipements techniques adaptés aux environnements industriels. Grâce à une expertise multidisciplinaire et une approche personnalisée, nous proposons des installations fiables, performantes et conformes aux standards de sécurité et de qualité.'
    ),

    (5,
     'Produits chimiques industriels',
     'SOMAP & SERVICE met à disposition une large gamme de produits chimiques destinés aux secteurs industriels et aux activités de traitement de surface. Nous sélectionnons des produits de qualité répondant aux normes de sécurité et de performance afin de satisfaire les besoins spécifiques de nos clients. Notre équipe accompagne également les entreprises dans le choix des solutions adaptées à leurs activités tout en garantissant un service fiable, rapide et professionnel.'
    ),

    (6,
     'Traitement de surface',
     'Le traitement de surface regroupe un ensemble de techniques destinées à préparer, protéger et améliorer les propriétés des matériaux industriels. SOMAP & SERVICE propose des solutions complètes incluant le sablage, la métallisation, les traitements anticorrosion et les revêtements de protection. Nos prestations permettent d’augmenter la durabilité des structures métalliques, d’améliorer leur résistance aux conditions extrêmes et d’assurer une finition de haute qualité adaptée aux exigences des secteurs industriels.'
    ),

    (7,
     'Travaux polyester renforcé',
     'SOMAP & SERVICE réalise des travaux spécialisés en polyester renforcé de fibres de verre pour la fabrication, la réparation et le revêtement de différentes structures industrielles telles que les cuves, réservoirs, carénages et équipements techniques. Grâce aux propriétés mécaniques et chimiques du polyester, nos solutions offrent une excellente résistance à la corrosion, à l’humidité et aux environnements agressifs. Nous garantissons des réalisations fiables, durables et adaptées aux besoins spécifiques de chaque projet industriel.'
    );

INSERT INTO demande
(id, objet, description, statut, date_creation, client_id, service_id, urgence)
VALUES
    (1, 'Traitement anticorrosion charpente', 'Nous souhaitons protéger une charpente métallique exposée à l’humidité et aux projections salines.', 'VALIDEE', '2026-05-01 09:15:00', 2, 1, 'URGENT'),
    (2, 'Sablage de pièces industrielles', 'Préparation de plusieurs pièces métalliques avant application de peinture industrielle.', 'VALIDEE', '2026-05-03 11:40:00', 3, 2, 'NORMAL'),
    (3, 'Métallisation de structures acier', 'Besoin d’une protection longue durée par métallisation pour des supports acier.', 'EN_ATTENTE', '2026-05-07 14:20:00', 4, 3, 'URGENT'),
    (4, 'Peinture industrielle équipements', 'Application d’un système de peinture industrielle sur équipements de production.', 'VALIDEE', '2026-05-10 10:00:00', 2, 4, 'NORMAL'),
    (5, 'Traitement des eaux industrielles', 'Étude et intervention pour améliorer la qualité des eaux utilisées dans notre atelier.', 'EN_ATTENTE', '2026-05-12 16:30:00', 5, 5, 'FAIBLE'),
    (6, 'Fourniture produits chimiques', 'Demande de produits chimiques adaptés au nettoyage et traitement industriel.', 'REJETEE', '2026-05-14 08:50:00', 3, 6, 'NORMAL'),
    (7, 'Réparation polyester bassin', 'Réparation et renforcement polyester sur un bassin de stockage.', 'VALIDEE', '2026-05-16 13:10:00', 5, 7, 'URGENT');


INSERT INTO projet
(id, titre, description, statut, date_debut, date_fin, client_id, demande_id)
VALUES
    (1, 'Protection anticorrosion charpente Casablanca', 'Préparation, traitement de surface et application d’un système anticorrosion complet.', 'EN_COURS', '2026-05-02 08:00:00', NULL, 2, 1),
    (2, 'Sablage pièces mécaniques Rabat', 'Sablage industriel de pièces métalliques avec contrôle de rugosité.', 'TERMINE', '2026-05-04 08:30:00', '2026-05-08 17:00:00', 3, 2),
    (3, 'Peinture équipements de production', 'Application peinture industrielle sur équipements et châssis métalliques.', 'EN_COURS', '2026-05-11 09:00:00', NULL, 2, 4),
    (4, 'Réparation polyester bassin Agadir', 'Travaux polyester pour réparation, étanchéité et protection du bassin.', 'SUSPENDU', '2026-05-17 08:00:00', NULL, 5, 7);

INSERT INTO commentaire
(id, contenu, date_commentaire, client_id, service_id, parent_id)
VALUES
    (1, 'Très bon accompagnement pour le traitement anticorrosion. L’équipe a bien expliqué les étapes.', '2026-05-05 12:10:00', 2, 1, NULL),
    (2, 'Le sablage était propre et livré dans les délais.', '2026-05-09 18:30:00', 3, 2, NULL),
    (3, 'Merci pour votre retour. Nous restons disponibles pour les prochaines pièces.', '2026-05-09 19:00:00', 3, 2, 2),
    (4, 'Bonne qualité de finition sur la peinture industrielle.', '2026-05-15 15:45:00', 2, 4, NULL),
    (5, 'Intervention polyester efficace, le bassin est de nouveau opérationnel.', '2026-05-20 10:20:00', 5, 7, NULL);

INSERT INTO image
(id, image_url, service_id, demande_id, commentaire_id)
VALUES
    (1, '/images/traitement-surface.jpg', 1, 1, 1),
    (2, '/images/sablage.jpg', 2, 2, 2),
    (3, '/images/metallisation.jpg', 3, 3, NULL),
    (4, '/images/peinture.jpg', 4, 4, 4),
    (5, '/images/eaux.jpg', 5, 5, NULL),
    (6, '/images/chimique.jpg', 6, 6, NULL),
    (7, '/images/polyester.png', 7, 7, 5),
    (8, '/images/traitement1.jpg', 1, NULL, NULL),
    (9, '/images/sablage1.jpg', 2, NULL, NULL),
    (10, '/images/metallisation1.jpg', 3, NULL, NULL),
    (11, '/images/peinture1.jpg', 4, NULL, NULL),
    (12, '/images/eaux1.jpg', 5, NULL, NULL),
    (13, '/images/chimique1.jpg', 6, NULL, NULL),
    (14, '/images/polyester1.jpg', 7, NULL, NULL);

INSERT INTO notification
(id, titre, message, date_envoi, lu, type, utilisateur_id)
VALUES
    (1, 'Nouvelle demande validée', 'Votre demande de traitement anticorrosion a été validée.', '2026-05-01 10:00:00', false, 'DEMANDE', 2),
    (2, 'Projet démarré', 'Le projet Protection anticorrosion charpente Casablanca est en cours.', '2026-05-02 08:15:00', false, 'PROJET', 2),
    (3, 'Demande reçue', 'Votre demande de métallisation est en attente de traitement.', '2026-05-07 14:25:00', true, 'DEMANDE', 4),
    (4, 'Projet terminé', 'Le projet Sablage pièces mécaniques Rabat est terminé.', '2026-05-08 17:20:00', false, 'PROJET', 3),
    (5, 'Nouvelle demande client', 'Une nouvelle demande urgente a été créée.', '2026-05-16 13:15:00', false, 'DEMANDE', 1),
    (6, 'Information système', 'Bienvenue sur la plateforme SOMAP & SERVICE.', '2026-05-18 09:00:00', true, 'SYSTEME', 5);


INSERT INTO messages_contact
(id, nom, email, sujet, message, utilisateur_id, date_creation, statut, reponse_admin)
VALUES
    (1, 'Maroc Industrie', 'contact@marocindustrie.ma', 'Suivi projet', 'Bonjour, nous souhaitons avoir une mise à jour sur notre projet anticorrosion.', 2, '2026-05-06 09:45:00', 'REPLIED', 'Bonjour, votre projet est en cours selon le planning prévu.'),
    (2, 'Atlas Maintenance', 'atlas.maintenance@gmail.com', 'Demande facture', 'Merci de nous transmettre la facture du sablage réalisé.', 3, '2026-05-10 11:30:00', 'READ', NULL),
    (3, 'Casa Métal', 'contact@casametal.ma', 'Métallisation', 'Pouvez-vous nous confirmer le délai estimé pour notre demande de métallisation ?', 4, '2026-05-13 15:05:00', 'PENDING', NULL),
    (4, 'OCP Souss', 'maintenance@ocp-souss.ma', 'Travaux polyester', 'Nous avons besoin de détails sur la reprise des travaux polyester.', 5, '2026-05-19 10:10:00', 'PENDING', NULL);





