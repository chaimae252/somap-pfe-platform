-- ==========================================
-- SOMAP & SERVICE - Database Seed Data (PostgreSQL)
-- Final Year Project (PFE)
-- ==========================================

-- 1. Insert Default Administrator User (Password: 123456)
INSERT INTO utilisateur (nom, email, mot_de_passe, role)
VALUES ('Admin SOMAP', 'admin@somap.com', '$2a$10$aFO97TVC2M23es3h15lQFekrt1N/TGM25DsTw2GqI85ZvL31okHeq', 'ADMIN');

-- Link User ID 1 into Admin table
INSERT INTO admin (id)
VALUES (1);

-- 2. Insert Default Industrial Catalog Services
INSERT INTO service (titre, description, admin_id)
VALUES 
('Sablage', 'Le sablage est une technique industrielle de nettoyage des surfaces en projetant un abrasif à grande vitesse sur la pièce à traiter, permettant de décaper et de préparer la surface pour les revêtements.', 1),

('Métallisation (Shoopage)', 'La métallisation ou shoopage consiste à projeter du zinc ou de l’aluminium fondu sur une surface métallique préalablement sablée afin de lui offrir une protection anticorrosion active et durable.', 1),

('Peinture Industrielle', 'Application de peintures techniques de protection et de finition sur tous types de structures métalliques (époxy, polyuréthane) pour résister aux agressions chimiques, physiques et climatiques.', 1),

('Thermolaquage', 'Le thermolaquage est un procédé de revêtement organique consistant à appliquer une peinture en poudre chargée électrostatiquement sur des pièces métalliques, suivi d''une cuisson au four à 200°C.', 1),

('Traitement Anti-corrosion', 'Solutions globales d''analyse de la corrosion et d''application de revêtements de protection à haute efficacité pour préserver les équipements industriels des attaques extérieures et de l''oxydation.', 1);
