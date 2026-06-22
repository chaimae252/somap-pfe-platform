-- ==========================================
-- SOMAP & SERVICE - Database Schema (PostgreSQL)
-- Final Year Project (PFE)
-- ==========================================

-- 1. Table: utilisateur (Base class for Client and Admin)
CREATE TABLE utilisateur (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    reset_code VARCHAR(10),
    reset_code_expiration TIMESTAMP
);

-- 2. Table: client (Inherits utilisateur via Joined strategy)
CREATE TABLE client (
    id BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    telephone VARCHAR(50),
    adresse VARCHAR(500),
    push_token VARCHAR(255)
);

-- 3. Table: admin (Inherits utilisateur via Joined strategy)
CREATE TABLE admin (
    id BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- 4. Table: service (Catalog services managed by admins)
CREATE TABLE service (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    admin_id BIGINT REFERENCES admin(id) ON DELETE SET NULL
);

-- 5. Table: demande (Client quotation requests)
CREATE TABLE demande (
    id BIGSERIAL PRIMARY KEY,
    objet VARCHAR(255) NOT NULL,
    description TEXT,
    statut VARCHAR(50) NOT NULL DEFAULT 'EN_ATTENTE',
    urgence VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id BIGINT REFERENCES client(id) ON DELETE CASCADE,
    service_id BIGINT REFERENCES service(id) ON DELETE SET NULL,
    admin_id BIGINT REFERENCES admin(id) ON DELETE SET NULL
);

-- 6. Table: projet (Active client projects approved from demands)
CREATE TABLE projet (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    statut VARCHAR(50) NOT NULL DEFAULT 'EN_COURS',
    date_debut TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_fin TIMESTAMP,
    client_id BIGINT REFERENCES client(id) ON DELETE CASCADE,
    demande_id BIGINT REFERENCES demande(id) ON DELETE CASCADE UNIQUE,
    admin_id BIGINT REFERENCES admin(id) ON DELETE SET NULL
);

-- 7. Table: commentaire (Service reviews and comment threads)
CREATE TABLE commentaire (
    id BIGSERIAL PRIMARY KEY,
    contenu TEXT NOT NULL,
    date_commentaire TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id BIGINT REFERENCES client(id) ON DELETE CASCADE,
    service_id BIGINT REFERENCES service(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES commentaire(id) ON DELETE CASCADE
);

-- 8. Table: image (Reference photos for comments, services, or demands)
CREATE TABLE image (
    id BIGSERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    demande_id BIGINT REFERENCES demande(id) ON DELETE CASCADE,
    service_id BIGINT REFERENCES service(id) ON DELETE CASCADE,
    commentaire_id BIGINT REFERENCES commentaire(id) ON DELETE CASCADE
);

-- 9. Table: notification (App-wide notifications for users)
CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date_envoi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id BIGINT,
    utilisateur_id BIGINT REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- 10. Table: refresh_token (Active user refresh tokens for session rotation)
CREATE TABLE refresh_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    user_id BIGINT REFERENCES utilisateur(id) ON DELETE CASCADE UNIQUE
);

-- 11. Table: messages_contact (Contact inquiries submitted via the platform)
CREATE TABLE messages_contact (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    utilisateur_id BIGINT REFERENCES client(id) ON DELETE SET NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(50) NOT NULL DEFAULT 'NON_LU',
    reponse_admin VARCHAR(500),
    admin_id BIGINT REFERENCES admin(id) ON DELETE SET NULL
);

-- ==========================================
-- Indexes for Performance Tuning
-- ==========================================
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_commentaire_service ON commentaire(service_id);
CREATE INDEX idx_commentaire_parent ON commentaire(parent_id);
CREATE INDEX idx_demande_client ON demande(client_id);
CREATE INDEX idx_projet_client ON projet(client_id);
CREATE INDEX idx_notification_user ON notification(utilisateur_id);
CREATE INDEX idx_contact_client ON messages_contact(utilisateur_id);
