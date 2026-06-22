# SOMAP & SERVICE - API Documentation Guide

This document describes the REST API endpoints provided by the Spring Boot backend, including authentication requirements, request payloads, and typical response formats.

---

## 🔒 Base Configuration & Authentication

* **Base URL**: `http://localhost:8080/api`
* **Security Strategy**: Stateless JWT. Include the header `Authorization: Bearer <your_jwt_token>` for all protected endpoints.
* **CORS Settings**: Permitted for all local origins (`http://localhost:*`, `http://127.0.0.1:*`) and production vercel/railway domains.

---

## 🔑 Authentication Endpoints (`/api/auth/**`)

All endpoints in this group are public (do not require an Authorization header).

### 1. Register Client
* **Endpoint**: `POST /api/auth/register`
* **Request Body**:
  ```json
  {
    "nom": "Jean Client",
    "email": "jean.client@gmail.com",
    "motDePasse": "mypassword123",
    "telephone": "0612345678",
    "adresse": "Casablanca, Maroc"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ...",
    "refreshToken": "7719e7f0-51ca-4a47-9057-86ab40b89396",
    "id": 2,
    "nom": "Jean Client",
    "email": "jean.client@gmail.com",
    "role": "CLIENT"
  }
  ```

### 2. Register Admin
* **Endpoint**: `POST /api/auth/register-admin`
* **Request Body**:
  ```json
  {
    "nom": "Nouveau Admin",
    "email": "newadmin@somap.com",
    "motDePasse": "adminpass123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ...",
    "refreshToken": "ce3c74f5-3152-416f-a341-1012e00a0e4f",
    "id": 41,
    "nom": "Nouveau Admin",
    "email": "newadmin@somap.com",
    "role": "ADMIN"
  }
  ```

### 3. Login
* **Endpoint**: `POST /api/auth/login`
* **Request Body**:
  ```json
  {
    "email": "admin@somap.com",
    "motDePasse": "123456"
  }
  ```
* **Response (200 OK)**: Returns JWT, refresh token, user name, and role.
* **Error Response (401 Unauthorized)**: `{"message": "Email ou mot de passe incorrect."}`

### 4. Refresh Token Rotation
* **Endpoint**: `POST /api/auth/refresh`
* **Request Body**:
  ```json
  {
    "refreshToken": "7719e7f0-51ca-4a47-9057-86ab40b89396"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiJ...",
    "refreshToken": "06999500-8ef2-417e-afaa-41392c1846d2"
  }
  ```

### 5. Forgot Password (Temporary Password Request)
* **Endpoint**: `POST /api/auth/forgot-password-temp`
* **Request Body**:
  ```json
  {
    "email": "admin@somap.com"
  }
  ```
* **Response (200 OK)**: `"Un nouveau mot de passe temporaire a été envoyé à votre adresse email"`

---

## 👥 Clients Endpoints (`/api/clients/**`)

### 1. Get All Clients
* **Endpoint**: `GET /api/clients` (Protected - Admin only)
* **Response (200 OK)**: List of clients, including their recent activity counts.

### 2. Block / Delete Client
* **Endpoint**: `DELETE /api/clients/{id}` (Protected - Admin only)
* **Response (200 OK)**: `"Client supprimé avec succès"`
* *Note: Deleting a client safely cascades and cleans up all their comments, comment replies, received notifications, refresh tokens, contact messages, demandes, and projects.*

---

## 📋 Demandes (Requests) Endpoints (`/api/demandes/**`)

### 1. Create a Request
* **Endpoint**: `POST /api/demandes` (Protected - Client only)
* **Request Body**:
  ```json
  {
    "objet": "Sablage de Cuve",
    "description": "Demande de devis pour le sablage complet d'une cuve métallique.",
    "urgence": "URGENT",
    "serviceId": 1
  }
  ```

### 2. Update Request Status
* **Endpoint**: `PUT /api/demandes/{id}/status?status=VALIDEE` (Protected - Admin only)
* **Response (200 OK)**: Returns the updated demand entity.
* *Note: Validating a demand automatically triggers the auto-creation of a related project assigned to the validating admin.*

---

## 🤖 Virtual Assistant Chatbot (`/api/chat`)

* **Endpoint**: `POST /api/chat` (Protected - Client only)
* **Request Body**:
  ```json
  {
    "message": "Qu'est-ce que le sablage ?"
  }
  ```
* **Response (200 OK)**: Returns the virtual assistant's answer in French, built from Google Gemini 2.5 Flash context.
