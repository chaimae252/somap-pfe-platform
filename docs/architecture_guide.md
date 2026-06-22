# SOMAP & SERVICE - Technical Architecture Guide

This document provides a technical overview of the platform's architecture, database models, external integrations, and key lifecycle flows.

---

## 🏗️ 1. Technical Stack & Decoupled Design

The platform uses a decoupled three-tier architectural layout:

* **Backend REST API**: Spring Boot 3.x (Java 17), JPA/Hibernate, Spring Security.
* **Web Admin Dashboard**: React 18, Vite, Material-UI Icons, Vanilla CSS.
* **Client Mobile Application**: React Native (Expo), Zustand (State Management).
* **Database & Cloud Services**: PostgreSQL (hosted on Railway), Cloudinary (Media storage), Expo Push Server, Google Gemini 2.5 Flash API, Brevo HTTPS API.

---

## 🗄️ 2. Data Models & Entity Relations

The database schema is centered around a joined-inheritance class hierarchy:

```
                ┌──────────────────────────────┐
                │          Utilisateur         │ (InheritanceType.JOINED)
                │ (id, nom, email, password...)│
                └──────────────┬───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
  ┌─────────▼─────────┐                 ┌─────────▼─────────┐
  │      Client       │                 │       Admin       │
  │ (telephone, adr)  │                 │    (adminId)      │
  └─────────┬─────────┘                 └─────────┬─────────┘
            │ 1                                   │ 1
            ├───► Demandes (1:N)                  ├───► Services (1:N)
            │                                     │
            ├───► Projets (1:N)                   ├───► Message Replies (1:N)
            │                                     │
            └───► Comments (1:N)                  └───► Managed Projects (1:N)
```

### Key Relationships
* **Client / Admin Base**: Extends `Utilisateur` using `InheritanceType.JOINED` strategy, generating separate tables (`client`, `admin`) linked to the base `utilisateur` table via foreign keys.
* **Demande ⇄ Projet**: Approving a request (`Demande`) automatically generates a related `Projet` entity, linking them via a `@OneToOne` mapping.
* **Commentaire ⇄ Threading**: Comments are nested in a parent-child hierarchy using a self-referencing relationship (`parent_id` column pointing to `commentaire(id)`).
* **Cascading & Constraints**: Client deletion cascades cleanly down to delete their demands, projects, notifications, refresh tokens, contact messages, comments, and replies without constraint violations.

---

## 🔌 3. External Services Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Spring Boot Backend                              │
└──────┬──────────────────────┬───────────────────────┬───────────────────────┘
       │                      │                       │
       ▼                      ▼                       ▼
┌──────────────┐      ┌──────────────┐        ┌──────────────┐
│  Brevo API   │      │ Cloudinary   │        │ Google AI    │
│ (HTTPS Mail) │      │ (Image CDN)  │        │ (Gemini API) │
└──────────────┘      └──────────────┘        └──────────────┘
```

### 🤖 Google Gemini Chatbot
* **Model**: `gemini-2.5-flash` via HTTP Rest Template.
* **Context injection**: Leverages Gemini's official `systemInstruction` payload field to supply active catalog services descriptions and tab navigation guidelines in French.
* **Failover**: Gracefully fallback to a local mock FAQ matcher in the mobile client if the backend is unreachable or missing configurations.

### 🔔 Expo Push Notification Engine
* **Integration**: Utilizes HTTP requests directed to Expo's Push service (`https://exp.host/--/api/v2/push/send`).
* **Deep-linking**: Automatically transmits custom data parameters (`targetType` and `targetId`). Tapping background alerts instantly triggers app-level router redirection to the relevant page (Details of service, demande, or project).

### 📧 Brevo HTTPS Mail
* Bypasses port 25/465 cloud hosting blocks by issuing secure POST requests to Brevo's mail transmission API (`https://api.brevo.com/v3/smtp/email`).

---

## 🔄 4. Security & Authentication Flows

### Stateless JWT & Refresh Token Rotation (RTR)
* **JWT Access Token**: Short-lived access lifetime (15 minutes).
* **Refresh Token**: Long-lived lifetime (7 days) saved in the database.
* **Token Rotation**: Requesting a refresh automatically invalidates the old token and returns a newly rotated token. If concurrent requests access `/refresh` simultaneously, a serialized database upsert handles updates safely to prevent race condition errors.
