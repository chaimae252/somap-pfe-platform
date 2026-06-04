import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_ORIGIN } from "../../services/api";

const normalize = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_ORIGIN}${url}`;
};

const getClientName = (item: any) =>
    item.clientNom || item.client?.nom || "Client";

const getInitial = (name: string) =>
    name.trim().charAt(0).toUpperCase() || "C";

const parseSafeDate = (value?: string | null) => {
    if (!value) return null;
    if (typeof value === "string") {
        const formatted = value.trim().replace(/\s+/, "T");
        const date = new Date(formatted);
        if (!Number.isNaN(date.getTime())) return date;
    }
    const fallback = new Date(value);
    if (!Number.isNaN(fallback.getTime())) return fallback;
    return null;
};

const formatDate = (value?: string) => {
    const date = parseSafeDate(value);
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function DeleteConfirmDialog({
    visible,
    title,
    message,
    onCancel,
    onConfirm,
    loading = false,
}: {
    visible: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    loading?: boolean;
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable style={styles.confirmBackdrop} onPress={onCancel}>
                <Pressable style={styles.confirmCard} onPress={(event) => event.stopPropagation()}>
                    <LinearGradient
                        colors={["#FFFFFF", "#F8FBFF"] as const}
                        style={styles.confirmGradient}
                    >
                        <View style={styles.confirmIconWrap}>
                            <LinearGradient
                                colors={["#FFE8E8", "#FFF5F2"] as const}
                                style={styles.confirmIconBg}
                            >
                                <Ionicons name="trash-outline" size={24} color="#D9534F" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.confirmTitle}>{title}</Text>
                        <Text style={styles.confirmMessage}>{message}</Text>

                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={[styles.cancelButton, loading && styles.disabledButton]}
                                activeOpacity={0.8}
                                onPress={onCancel}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.confirmDeleteButton, loading && styles.disabledButton]}
                                activeOpacity={0.86}
                                onPress={onConfirm}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={["#EB5757", "#C0392B"] as const}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.confirmDeleteGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                                            <Text style={styles.confirmDeleteText}>Supprimer</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function ReplyCard({
    item,
    onReply,
    onImagePress,
    currentClientId,
    onDelete,
    onEdit,
    onEditingChange,
}: any) {
    const clientName = getClientName(item);
    const canManage = Number(item.clientId || item.client?.id) === Number(currentClientId);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.contenu || "");
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setDeleteVisible(true);
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);
            await onDelete?.(item.id);
            setDeleteVisible(false);
            onEditingChange?.(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        const content = editText.trim();
        if (!content || isSaving) return;
        try {
            setIsSaving(true);
            await onEdit?.(item.id, content);
            setIsEditing(false);
            onEditingChange?.(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={replyStyles.card}>
            <View style={styles.header}>
                <View style={[styles.avatar, replyStyles.avatar]}>
                    <Text style={[styles.avatarText, replyStyles.avatarText]}>
                        {getInitial(clientName)}
                    </Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.name}>{clientName}</Text>
                    <Text style={styles.date}>
                        {formatDate(item.dateCommentaire || item.date_commentaire)}
                    </Text>
                </View>
            </View>

            {isEditing ? (
                <BottomSheetTextInput
                    value={editText}
                    onChangeText={setEditText}
                    style={[styles.editInput, replyStyles.editInput]}
                    multiline
                    autoFocus
                />
            ) : (
                <Text style={styles.text}>{item.contenu}</Text>
            )}

            {item.images?.length > 0 && (
                <View style={styles.imagesRow}>
                    {item.images.map((image: any) => {
                        const uri = normalize(image.imageUrl);
                        if (!uri) return null;
                        return (
                            <TouchableOpacity
                                key={image.id || image.imageUrl}
                                activeOpacity={0.85}
                                onPress={() => onImagePress(uri)}
                            >
                                <Image
                                    source={{ uri }}
                                    style={[styles.image, replyStyles.image]}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            <View style={styles.actionsRow}>
                {isEditing ? (
                    <>
                        <TouchableOpacity
                            style={[styles.replyButton, isSaving && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#1271b8" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-outline" size={13} color="#1271b8" />
                                    <Text style={styles.replyText}>Enregistrer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.ghostButton, isSaving && styles.disabledButton]}
                            disabled={isSaving}
                            onPress={() => {
                                setEditText(item.contenu || "");
                                setIsEditing(false);
                                onEditingChange?.(false);
                            }}
                        >
                            <Text style={styles.ghostText}>Annuler</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.replyButton, replyStyles.replyButton]}
                            activeOpacity={0.75}
                            onPress={() => onReply?.(item)}
                        >
                            <Ionicons name="return-down-forward-outline" size={13} color="#1271b8" />
                            <Text style={styles.replyText}>Repondre</Text>
                        </TouchableOpacity>
                        {canManage && (
                            <>
                                <TouchableOpacity
                                    style={styles.textAction}
                                    onPress={() => {
                                        setIsEditing(true);
                                        onEditingChange?.(true);
                                    }}
                                >
                                    <Text style={styles.textActionLabel}>Modifier</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.textActionDanger} onPress={handleDelete}>
                                    <Text style={styles.textActionDangerLabel}>Supprimer</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}
            </View>

            <DeleteConfirmDialog
                visible={deleteVisible}
                title="Supprimer la réponse ?"
                message="Cette action retirera définitivement cette réponse de la discussion."
                onCancel={() => setDeleteVisible(false)}
                onConfirm={confirmDelete}
                loading={isDeleting}
            />
        </View>
    );
}

const flattenReplies = (replies: any[]): any[] => {
    if (!replies || replies.length === 0) return [];
    let flat: any[] = [];
    replies.forEach((reply) => {
        flat.push(reply);
        if (reply.replies && reply.replies.length > 0) {
            flat = flat.concat(flattenReplies(reply.replies));
        }
    });
    return flat.sort((a, b) => {
        const dateA = parseSafeDate(a.dateCommentaire || a.date_commentaire)?.getTime() || 0;
        const dateB = parseSafeDate(b.dateCommentaire || b.date_commentaire)?.getTime() || 0;
        return dateA - dateB;
    });
};

export default function CommentCard({
    item,
    currentClientId,
    onReply,
    onDelete,
    onEdit,
    onEditingChange,
}: any) {
    const clientName = getClientName(item);
    const flatReplies = flattenReplies(item.replies);
    const hasReplies = flatReplies.length > 0;
    const [showReplies, setShowReplies] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.contenu || "");
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const canManage = Number(item.clientId || item.client?.id) === Number(currentClientId);

    const handleDelete = () => {
        setDeleteVisible(true);
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);
            await onDelete?.(item.id);
            setDeleteVisible(false);
            onEditingChange?.(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        const content = editText.trim();
        if (!content || isSaving) return;
        try {
            setIsSaving(true);
            await onEdit?.(item.id, content);
            setIsEditing(false);
            onEditingChange?.(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitial(clientName)}</Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.name}>{clientName}</Text>
                    <Text style={styles.date}>
                        {formatDate(item.dateCommentaire || item.date_commentaire)}
                    </Text>
                </View>
            </View>

            {isEditing ? (
                <BottomSheetTextInput
                    value={editText}
                    onChangeText={setEditText}
                    style={styles.editInput}
                    multiline
                    autoFocus
                />
            ) : (
                <Text style={styles.text}>{item.contenu}</Text>
            )}

            {item.images?.length > 0 && (
                <View style={styles.imagesRow}>
                    {item.images.map((image: any) => {
                        const uri = normalize(image.imageUrl);
                        if (!uri) return null;
                        return (
                            <TouchableOpacity
                                key={image.id || image.imageUrl}
                                activeOpacity={0.85}
                                onPress={() => setSelectedImage(uri)}
                            >
                                <Image
                                    source={{ uri }}
                                    style={styles.image}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            <View style={styles.actionsRow}>
                {isEditing ? (
                    <>
                        <TouchableOpacity
                            style={[styles.replyButton, isSaving && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#1271b8" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-outline" size={15} color="#1271b8" />
                                    <Text style={styles.replyText}>Enregistrer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.ghostButton, isSaving && styles.disabledButton]}
                            disabled={isSaving}
                            onPress={() => {
                                setEditText(item.contenu || "");
                                setIsEditing(false);
                                onEditingChange?.(false);
                            }}
                        >
                            <Text style={styles.ghostText}>Annuler</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.replyButton}
                            activeOpacity={0.75}
                            onPress={() => onReply?.(item)}
                        >
                            <Ionicons name="return-down-forward-outline" size={15} color="#1271b8" />
                            <Text style={styles.replyText}>Repondre</Text>
                        </TouchableOpacity>
                        {canManage && (
                            <>
                                <TouchableOpacity
                                    style={styles.textAction}
                                    onPress={() => {
                                        setIsEditing(true);
                                        onEditingChange?.(true);
                                    }}
                                >
                                    <Text style={styles.textActionLabel}>Modifier</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.textActionDanger} onPress={handleDelete}>
                                    <Text style={styles.textActionDangerLabel}>Supprimer</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}

                {hasReplies && (
                    <TouchableOpacity
                        style={styles.toggleRepliesButton}
                        activeOpacity={0.75}
                        onPress={() => setShowReplies((v) => !v)}
                    >
                        <Ionicons
                            name={showReplies ? "chevron-up-outline" : "chevron-down-outline"}
                            size={13}
                            color="#5BAF97"
                        />
                        <Text style={styles.replyText}>
                            {showReplies
                                ? "Masquer les reponses"
                                : `Voir ${flatReplies.length} reponse${flatReplies.length > 1 ? "s" : ""}`}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {showReplies && hasReplies && (
                <View style={styles.repliesContainer}>
                    <View style={styles.threadLine} />
                    <View style={styles.repliesList}>
                        {flatReplies.map((reply: any) => (
                            <ReplyCard
                                key={reply.id}
                                item={reply}
                                onReply={onReply}
                                onImagePress={setSelectedImage}
                                currentClientId={currentClientId}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onEditingChange={onEditingChange}
                            />
                        ))}
                    </View>
                </View>
            )}

            <Modal
                visible={!!selectedImage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <Pressable
                    style={styles.imageModalBackdrop}
                    onPress={() => setSelectedImage(null)}
                >
                    <View style={styles.imageModalHeader}>
                        <TouchableOpacity
                            style={styles.closePreviewButton}
                            onPress={() => setSelectedImage(null)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.previewImage}
                            resizeMode="contain"
                        />
                    )}
                </Pressable>
            </Modal>

            <DeleteConfirmDialog
                visible={deleteVisible}
                title="Supprimer le commentaire ?"
                message="Cette action supprimera le commentaire et ses réponses de façon définitive."
                onCancel={() => setDeleteVisible(false)}
                onConfirm={confirmDelete}
                loading={isDeleting}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#DDE9F5",
        shadowColor: "#0d2d5e",
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 5,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#EAF2FB",
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.18)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    avatarText: {
        color: "#1271b8",
        fontSize: 16,
        fontWeight: "800",
    },
    headerText: { flex: 1 },
    name: { fontWeight: "700", color: "#1a2e4a", fontSize: 14 },
    date: { fontSize: 11, color: "#7a8fa6", marginTop: 2 },
    text: {
        color: "#42566f",
        marginBottom: 10,
        fontSize: 13,
        lineHeight: 20,
    },
    editInput: {
        minHeight: 72,
        maxHeight: 130,
        backgroundColor: "#F8FBFF",
        borderWidth: 1,
        borderColor: "#CFE0F0",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "#1a2e4a",
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 10,
        textAlignVertical: "top",
    },
    imagesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
        marginBottom: 8,
    },
    image: {
        width: 78,
        height: 78,
        borderRadius: 12,
        backgroundColor: "#E8EEF5",
        borderWidth: 1,
        borderColor: "#E2EBF4",
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    replyButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#EAF2FB",
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.12)",
    },
    toggleRepliesButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#F3FAF8",
        borderWidth: 1,
        borderColor: "rgba(91,175,151,0.18)",
    },
    replyText: { color: "#3E8D78", fontSize: 12, fontWeight: "800" },
    ghostButton: {
        alignSelf: "flex-start",
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#F4F7FB",
        borderWidth: 1,
        borderColor: "#DDE9F5",
    },
    ghostText: {
        color: "#6B7A90",
        fontSize: 12,
        fontWeight: "800",
    },
    textAction: {
        alignSelf: "flex-start",
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#EAF2FB",
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.12)",
    },
    textActionLabel: {
        color: "#1271b8",
        fontSize: 12,
        fontWeight: "800",
    },
    textActionDanger: {
        alignSelf: "flex-start",
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#FFF1F1",
        borderWidth: 1,
        borderColor: "rgba(217,83,79,0.16)",
    },
    textActionDangerLabel: {
        color: "#D9534F",
        fontSize: 12,
        fontWeight: "800",
    },
    repliesContainer: {
        flexDirection: "row",
        marginTop: 12,
    },
    threadLine: {
        width: 2,
        borderRadius: 2,
        backgroundColor: "rgba(91,175,151,0.22)",
        marginLeft: 11,
        marginRight: 10,
    },
    repliesList: { flex: 1 },
    imageModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(7, 20, 35, 0.92)",
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
    },
    imageModalHeader: {
        position: "absolute",
        top: 48,
        right: 18,
        zIndex: 2,
    },
    closePreviewButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.22)",
    },
    previewImage: {
        width: "100%",
        height: "82%",
        borderRadius: 16,
    },
    confirmBackdrop: {
        flex: 1,
        backgroundColor: "rgba(7, 20, 35, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 22,
    },
    confirmCard: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#0d2d5e",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
        elevation: 12,
    },
    confirmGradient: {
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 18,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(221,233,245,0.9)",
        borderRadius: 24,
    },
    confirmIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        shadowColor: "#EB5757",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 5,
    },
    confirmIconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(217,83,79,0.16)",
    },
    confirmTitle: {
        color: "#1a2e4a",
        fontSize: 18,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 7,
    },
    confirmMessage: {
        color: "#6B7A90",
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
        paddingHorizontal: 6,
        marginBottom: 18,
    },
    confirmActions: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F4F7FB",
        borderWidth: 1,
        borderColor: "#DDE9F5",
    },
    cancelButtonText: {
        color: "#5F7187",
        fontSize: 14,
        fontWeight: "900",
    },
    confirmDeleteButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 15,
        overflow: "hidden",
        shadowColor: "#C0392B",
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 4,
    },
    confirmDeleteGradient: {
        flex: 1,
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingHorizontal: 12,
    },
    confirmDeleteText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },
    disabledButton: {
        opacity: 0.62,
    },
});

const replyStyles = StyleSheet.create({
    card: {
        backgroundColor: "#EAF2FB",
        padding: 11,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#CFE0F0",
        shadowColor: "#0d2d5e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(18,113,184,0.08)",
    },
    avatarText: { fontSize: 13 },
    image: { width: 64, height: 64 },
    replyButton: { backgroundColor: "#FFFFFF" },
    editInput: {
        minHeight: 58,
        backgroundColor: "#FFFFFF",
    },
});
