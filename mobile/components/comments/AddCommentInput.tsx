import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Keyboard,
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

type SelectedImage = {
    uri: string;
    name: string;
    type: string;
};

const getReplyName = (replyTo: any) =>
    replyTo?.clientNom || replyTo?.client?.nom || "Client";

export default function AddCommentInput({ onSend, onSendError, replyTo, onCancelReply }: any) {
    const [text, setText] = useState("");
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (event) => {
            setKeyboardHeight(event.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const pickImage = async () => {
        if (isSending) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.55,
        });

        if (!result.canceled) {
            const selected = result.assets.map((asset) => ({
                uri: asset.uri,
                name: asset.fileName || `comment_${Date.now()}.jpg`,
                type: asset.mimeType || "image/jpeg",
            }));
            setImages((prev) => [...prev, ...selected]);
        }
    };

    const handleSend = async () => {
        if (isSending || (!text.trim() && images.length === 0)) return;

        try {
            setIsSending(true);
            await onSend(text, images);
            setText("");
            setImages([]);
        } catch (e) {
            onSendError?.(e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.wrapper}>
            {replyTo && (
                <View style={styles.replyPreview}>
                    <Ionicons name="return-down-forward-outline" size={16} color="#5BAF97" />
                    <Text style={styles.replyPreviewText}>
                        Reponse a {getReplyName(replyTo)}
                    </Text>
                    <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyBtn}>
                        <Ionicons name="close" size={14} color="#6B7A90" />
                    </TouchableOpacity>
                </View>
            )}

            {images.length > 0 && (
                <View style={styles.previewRow}>
                    {images.map((image, index) => (
                        <View key={`${image.uri}-${index}`} style={styles.previewWrap}>
                            <Image source={{ uri: image.uri }} style={styles.preview} />
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() =>
                                    setImages((prev) => prev.filter((_, i) => i !== index))
                                }
                            >
                                <Ionicons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.imageBtn, isSending && styles.disabledButton]}
                    onPress={pickImage}
                    disabled={isSending}
                >
                    <Ionicons name="image-outline" size={20} color="#1271b8" />
                    {images.length > 0 && (
                        <Text style={styles.imageCount}>{images.length}</Text>
                    )}
                </TouchableOpacity>

                <BottomSheetTextInput
                    value={text}
                    onChangeText={setText}
                    placeholder={
                        replyTo ? "Ecrire une reponse..." : "Ajouter un commentaire..."
                    }
                    placeholderTextColor="#9AABBD"
                    style={styles.input}
                    multiline
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                    editable={!isSending}
                />

                <TouchableOpacity
                    style={[styles.btn, isSending && styles.btnLoading]}
                    onPress={handleSend}
                    disabled={isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            {Platform.OS === "android" && <View style={{ height: 8 }} />}
            {keyboardHeight > 0 && (
                <View style={{ height: Math.max(0, keyboardHeight + 28) }} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderTopWidth: 1,
        borderTopColor: "#E2EBF4",
        backgroundColor: "#F8FBFF",
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 24 : 12,
    },
    replyPreview: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: "#F0FBF7",
        borderRadius: 14,
        paddingHorizontal: 11,
        paddingVertical: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(91,175,151,0.20)",
    },
    replyPreviewText: {
        flex: 1,
        color: "#1a2e4a",
        fontSize: 12,
        fontWeight: "700",
    },
    cancelReplyBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-end",
    },
    previewRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
        maxHeight: 58,
    },
    previewWrap: {
        position: "relative",
    },
    preview: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: "#E8EEF5",
        borderWidth: 1,
        borderColor: "#E2EBF4",
    },
    removeBtn: {
        position: "absolute",
        top: -5,
        right: -5,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#EB5757",
        alignItems: "center",
        justifyContent: "center",
    },
    imageBtn: {
        width: 48,
        height: 50,
        backgroundColor: "#EAF2FB",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.14)",
    },
    imageCount: {
        position: "absolute",
        top: 5,
        right: 6,
        minWidth: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: "#DDF4EC",
        color: "#fff",
        fontSize: 9,
        textAlign: "center",
        overflow: "hidden",
    },
    input: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 50,
        maxHeight: 120,
        fontSize: 14,
        color: "#1a2e4a",
        borderWidth: 1,
        borderColor: "#DDE9F5",
    },
    btn: {
        width: 50,
        height: 50,
        backgroundColor: "#5BAF97",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#8FD5BE",
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    btnLoading: {
        backgroundColor: "#7BC4AE",
    },
    disabledButton: {
        opacity: 0.62,
    },
});
