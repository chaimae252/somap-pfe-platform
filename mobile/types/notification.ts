export type NotificationType =
    | "DEMANDE"
    | "PROJET"
    | "COMMENTAIRE"
    | "SYSTEME"
    | "ADMIN_MESSAGE";

export interface Notification {
    id: number;
    titre: string;
    message: string;
    date_envoi: string;
    lu: boolean;
    type: NotificationType;
    targetType?: string;
    targetId?: number;
}
