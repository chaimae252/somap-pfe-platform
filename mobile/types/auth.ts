export interface LoginRequest {
    email: string;
    motDePasse: string;
}

export interface LoginResponse {
    token: string;
    id: number;
    nom: string;
    email: string;
    role: string;
}