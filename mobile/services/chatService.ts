import api from "./api";

export interface ChatMessage {
    sender: "user" | "ai";
    text: string;
}

export interface ChatResponse {
    message: string;
}

export const sendChatMessage = async (
    message: string,
    history: ChatMessage[]
): Promise<ChatResponse> => {
    // Map history senders from local representation to backend representation
    const mappedHistory = history.map((msg) => ({
        sender: msg.sender === "ai" ? "model" : "user",
        text: msg.text,
    }));

    const response = await api.post<ChatResponse>("/chat", {
        message,
        history: mappedHistory,
    });

    return response.data;
};
