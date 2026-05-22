export type NotificationType =
    | "DEMANDE"
    | "PROJET"
    | "SYSTEME";

export interface Notification {
    id: number;
    titre: string;
    message: string;
    date_envoi: string;
    lu: boolean;
    type: NotificationType;
}