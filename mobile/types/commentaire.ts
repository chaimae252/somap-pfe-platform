export interface Commentaire {
    id: number;
    contenu: string;
    date_commentaire: string;

    client: {
        id: number;
        nom: string;
    };

    images?: {
        id: number;
        imageUrl: string;
    }[];
}