import React, { useCallback, useMemo, useState, useEffect, forwardRef } from "react";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
} from "react-native";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetFlatList,
    BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

import CommentCard from "./CommentCard";
import AddCommentInput from "./AddCommentInput";

import {
    getCommentairesByService,
    addCommentaire,
    uploadCommentaireImage,
    deleteCommentaire,
    updateCommentaire,
} from "../../services/commentaireService";
import { isAxiosError } from "axios";

function CommentsBackdrop(props: any) {
    return (
        <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.28}
            pressBehavior="close"
        />
    );
}

export default forwardRef(function CommentsSheet(
    { serviceId, clientId, onClose }: any,
    ref: any
) {
    const snapPoints = useMemo(() => ["62%", "92%"], []);
    const [comments, setComments] = useState<any[]>([]);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(true);

    const loadComments = useCallback(async () => {
        try {
            setCommentsLoading(true);
            const data = await getCommentairesByService(serviceId);
            setComments(data);
        } catch (e) {
            console.log("ERROR COMMENTS:", e);
        } finally {
            setCommentsLoading(false);
        }
    }, [serviceId]);

    useEffect(() => {
        if (serviceId) loadComments();
    }, [serviceId, loadComments]);

    const handleSend = useCallback(async (
        text: string,
        images: { uri: string; name: string; type: string }[]
    ) => {
        if (!clientId) {
            throw new Error("Missing clientId");
        }

        const replyName = replyTo?.clientNom || replyTo?.client?.nom;
        const content = replyName ? `@${replyName} ${text}` : text;
        const resolvedParentId = replyTo?.id ?? null;

        const comment = await addCommentaire(
            serviceId,
            content,
            clientId,
            resolvedParentId
        );

        if (comment?.id && images.length > 0) {
            try {
                console.log("COMMENT IMAGE UPLOAD START:", {
                    commentaireId: comment.id,
                    count: images.length,
                });

                for (const image of images) {
                    await uploadCommentaireImage(comment.id, image);
                }
            } catch (e) {
                await deleteCommentaire(comment.id);
                await loadComments();
                throw e;
            }
        }

        await loadComments();
        setReplyTo(null);
    }, [clientId, loadComments, replyTo, serviceId]);

    const handleSendError = useCallback((e: unknown) => {
        if (isAxiosError(e)) {
            console.log("SEND ERROR:", {
                status: e.response?.status,
                data: e.response?.data,
                url: e.config?.url,
                method: e.config?.method,
            });
        } else {
            console.log("SEND ERROR:", e);
        }
    }, []);

    const handleDelete = useCallback(async (commentId: number) => {
        await deleteCommentaire(commentId);
        await loadComments();
    }, [loadComments]);

    const handleEdit = useCallback(async (commentId: number, content: string) => {
        await updateCommentaire(commentId, content);
        await loadComments();
    }, [loadComments]);

    const renderFooter = useCallback(
        (props: any) => {
            if (isEditingComment) return null;

            return (
                <BottomSheetFooter {...props} bottomInset={0} style={styles.footer}>
                    <AddCommentInput
                        onSend={handleSend}
                        onSendError={handleSendError}
                        replyTo={replyTo}
                        onCancelReply={() => setReplyTo(null)}
                    />
                </BottomSheetFooter>
            );
        },
        [handleSend, handleSendError, isEditingComment, replyTo]
    );

    return (
        <BottomSheet
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            backdropComponent={CommentsBackdrop}
            footerComponent={renderFooter}
            onClose={onClose}
            style={styles.sheet}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1271b8" />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Commentaires</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{comments.length}</Text>
                    </View>
                </View>

                <BottomSheetFlatList
                    data={comments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <CommentCard
                            item={item}
                            currentClientId={clientId}
                            onReply={(comment: any) => setReplyTo(comment)}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onEditingChange={setIsEditingComment}
                        />
                    )}
                    style={styles.list}
                    contentContainerStyle={[
                        styles.listContent,
                        isEditingComment && styles.listContentEditing,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        commentsLoading ? (
                            <View style={styles.emptyState}>
                                <ActivityIndicator size="small" color="#1271b8" />
                                <Text style={styles.loadingText}>Chargement des commentaires...</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="chatbox-outline" size={24} color="#5BAF97" />
                                </View>
                                <Text style={styles.emptyTitle}>Aucun commentaire</Text>
                                <Text style={styles.emptyText}>
                                    Soyez le premier a lancer la discussion.
                                </Text>
                            </View>
                        )
                    }
                />

            </View>
        </BottomSheet>
    );
});

const styles = StyleSheet.create({
    sheet: {
        zIndex: 100,
        elevation: 100,
        shadowColor: "#0d2d5e",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.10,
        shadowRadius: 18,
    },
    sheetBackground: {
        backgroundColor: "#F8FBFF",
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
    },
    handleIndicator: { backgroundColor: "#A8C8E5", width: 48, height: 5 },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingBottom: 14,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#E2EBF4",
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: "#EAF2FB",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.18)",
    },
    headerText: { flex: 1 },
    list: { flex: 1 },
    listContent: { paddingTop: 12, paddingBottom: 112, flexGrow: 1 },
    listContentEditing: { paddingBottom: 360 },
    footer: {
        paddingHorizontal: 16,
        backgroundColor: "#F8FBFF",
    },
    title: {
        fontSize: 19,
        fontWeight: "800",
        color: "#1a2e4a",
    },
    subtitle: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: "600",
        color: "#7a8fa6",
    },
    countBadge: {
        minWidth: 34,
        height: 30,
        borderRadius: 15,
        paddingHorizontal: 10,
        backgroundColor: "#DDF4EC",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#8FD5BE",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
        elevation: 3,
    },
    countText: {
        color: "#2F7D68",
        fontSize: 13,
        fontWeight: "800",
    },
    emptyState: {
        flex: 1,
        minHeight: 260,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
    },
    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: "#F0FBF7",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(91,175,151,0.20)",
    },
    emptyTitle: {
        color: "#1a2e4a",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },
    emptyText: {
        color: "#7a8fa6",
        fontSize: 13,
        lineHeight: 19,
        textAlign: "center",
    },
    loadingText: {
        marginTop: 10,
        color: "#7a8fa6",
        fontSize: 13,
        fontWeight: "700",
    },
});
