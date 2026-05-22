

// GET comments by service
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getCommentairesByService = async (serviceId: number) => {
    const res = await api.get(`/commentaires/service/${serviceId}`);
    return res.data;
};

// CREATE comment
export const addCommentaire = async (
    serviceId: number,
    contenu: string,
    clientId: number,
    parentId: number | null = null
) => {
    const body: any = {
        serviceId,
        contenu,
        clientId,
    };

    if (parentId) {
        body.parentId = parentId;
    }

    const res = await api.post(`/commentaires`, body);

    return res.data;
};

export const uploadCommentaireImage = async (
    commentaireId: number,
    image: { uri: string; name: string; type: string }
) => {
    const formData = new FormData();

    formData.append("file", {
        uri: image.uri,
        name: image.name,
        type: image.type,
    } as any);
    formData.append("commentaireId", String(commentaireId));

    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("Missing token for image upload");
    }

    const res = await api.post("/images/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const deleteCommentaire = async (commentaireId: number) => {
    const res = await api.delete(`/commentaires/${commentaireId}`);
    return res.data;
};

export const updateCommentaire = async (
    commentaireId: number,
    contenu: string
) => {
    const res = await api.put(`/commentaires/${commentaireId}`, { contenu });
    return res.data;
};
