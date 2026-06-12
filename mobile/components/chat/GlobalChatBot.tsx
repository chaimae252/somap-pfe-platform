import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import Theme from "@/constants/theme";
import { sendChatMessage } from "@/services/chatService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { colors, fonts } = Theme;
const { width, height } = Dimensions.get("window");

interface Message {
    id: string;
    text: string;
    sender: "user" | "ai";
    time: string;
}

const QUICK_PROMPTS = [
    "Qu'est-ce que le sablage ?",
    "C'est quoi la métallisation ?",
    "Peinture industrielle",
    "Travaux en polyester",
    "Comment créer une demande ?",
];

const MOCK_ANSWERS: Record<string, string> = {
    sablage: "Le Sablage Industriel est une technique de préparation consistant à projeter un abrasif à grande vitesse pour éliminer la rouille, la calamine et les anciennes peintures (standard SA 2.5). Cela prépare la surface à recevoir la protection anticorrosion.",
    metallisation: "La Métallisation (ou Shoopage) consiste à projeter du zinc ou de l'aluminium fondu sur l'acier préalablement sablé. Cela offre une protection anticorrosion active et durable de plus de 20 ans, idéale en milieu marin ou humide.",
    shoopage: "La Métallisation (ou Shoopage) consiste à projeter du zinc ou de l'aluminium fondu sur l'acier préalablement sablé. Cela offre une protection anticorrosion active et durable de plus de 20 ans, idéale en milieu marin ou humide.",
    peinture: "Notre service de Peinture Industrielle comprend l'application de systèmes de revêtements techniques (époxy, polyuréthane) adaptés aux contraintes chimiques, thermiques ou climatiques de vos équipements.",
    polyester: "Les Travaux en Polyester renforcé de fibres de verre permettent de fabriquer, réparer et étanchéifier des cuves, bassins, citernes et réservoirs contenant des produits chimiques ou de l'eau.",
    demande: "Pour créer une nouvelle demande de travaux, rendez-vous sur l'onglet 'Demandes' en bas, puis cliquez sur le bouton de création (+) en haut à droite. Vous pourrez y décrire votre besoin, y associer des photos et définir la priorité.",
    projet: "Vous pouvez suivre l'avancement de vos projets en cours dans l'onglet 'Projets'. Chaque projet validé y est listé avec son statut actuel (En cours, Terminé, Suspendu) et l'administrateur responsable.",
};

export default function GlobalChatBot() {
    const { token, user } = useAuthStore();
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const defaultGreeting = (userName?: string): Message => ({
        id: "1",
        text: `Bonjour${userName ? " " + userName : ""} ! Je suis l'assistant virtuel SOMAP AI. Comment puis-je vous aider aujourd'hui ? Posez-moi des questions sur le sablage, la métallisation, la peinture ou vos projets.`,
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    // Load history when user changes
    useEffect(() => {
        if (!user?.id) {
            setMessages([]);
            return;
        }

        const loadChatHistory = async () => {
            try {
                const historyStr = await AsyncStorage.getItem(`@somap_chat_history_${user.id}`);
                if (historyStr) {
                    const parsed = JSON.parse(historyStr);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                        return;
                    }
                }
                setMessages([defaultGreeting(user.nom || user.username)]);
            } catch (err) {
                console.log("Failed to load chat history:", err);
                setMessages([defaultGreeting(user.nom || user.username)]);
            }
        };

        loadChatHistory();
    }, [user?.id]);

    // Save history when messages change
    useEffect(() => {
        if (user?.id && messages.length > 0) {
            AsyncStorage.setItem(`@somap_chat_history_${user.id}`, JSON.stringify(messages))
                .catch((err) => console.log("Failed to save chat history:", err));
        }
    }, [messages, user?.id]);

    // Parse and render basic markdown bold/lists
    const renderFormattedText = (text: string, isUser: boolean) => {
        if (!text) return null;
        
        const lines = text.split("\n");
        const formattedElements: React.ReactNode[] = [];

        lines.forEach((line, lineIndex) => {
            let isBullet = false;
            let cleanLine = line;

            // Check if the line starts with a list bullet
            const bulletMatch = line.match(/^(\s*[\*\-]\s+)/);
            if (bulletMatch) {
                isBullet = true;
                cleanLine = line.substring(bulletMatch[0].length);
            }

            // Check if the line is a header (starts with #)
            let isHeader = false;
            if (cleanLine.trim().startsWith("#")) {
                const headerMatch = cleanLine.trim().match(/^#+\s+/);
                if (headerMatch) {
                    isHeader = true;
                    cleanLine = cleanLine.trim().substring(headerMatch[0].length);
                }
            }

            // Split the line by ** or *** to find bold text
            const parts = cleanLine.split(/\*\*+/);
            const textParts = parts.map((part, partIndex) => {
                const isBold = partIndex % 2 !== 0;
                return (
                    <Text
                        key={`${lineIndex}-${partIndex}`}
                        style={[
                            isBold ? styles.boldText : null,
                            isHeader ? styles.headerText : null,
                            isUser ? styles.userMessageText : styles.aiMessageText,
                        ]}
                    >
                        {part}
                    </Text>
                );
            });

            // If it's a bullet, prepend a bullet point
            if (isBullet) {
                formattedElements.push(
                    <Text 
                        key={`bullet-${lineIndex}`} 
                        style={[
                            styles.bulletPoint, 
                            isUser ? styles.userMessageText : styles.aiMessageText
                        ]}
                    >
                        {"  • "}
                    </Text>
                );
            }

            // Push the text parts
            formattedElements.push(...textParts);

            // Add newline after each line except the last one
            if (lineIndex < lines.length - 1) {
                formattedElements.push(<Text key={`nl-${lineIndex}`}>{"\n"}</Text>);
            }
        });

        return (
            <Text
                style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.aiMessageText,
                ]}
            >
                {formattedElements}
            </Text>
        );
    };

    // Animations
    const floatAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flatListRef = useRef<FlatList>(null);

    // Floating Button Pulsing Animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Only render if user is authenticated
    if (!token) {
        return null;
    }

    const handleOpen = () => {
        Animated.sequence([
            Animated.timing(floatAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.timing(floatAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => setVisible(true));
    };

    const handleSend = (textToSend: string) => {
        if (!textToSend.trim()) return;

        const newUserMessage: Message = {
            id: Math.random().toString(),
            text: textToSend.trim(),
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setInputText("");
        setIsTyping(true);

        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Call live backend API, with fallback to local mock on failure
        sendChatMessage(
            textToSend.trim(),
            messages.map((m) => ({ sender: m.sender, text: m.text }))
        )
            .then((response) => {
                const newAiMessage: Message = {
                    id: Math.random().toString(),
                    text: response.message,
                    sender: "ai",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                };
                setMessages((prev) => [...prev, newAiMessage]);
                setIsTyping(false);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            })
            .catch((error) => {
                console.log("Chatbot API error, using local mock responder:", error);
                
                const query = textToSend.toLowerCase();
                let aiText = "Je ne suis pas sûr de comprendre votre demande. Je peux vous renseigner sur nos services de Sablage, Métallisation, Peinture, Polyester, ou sur la création de Demandes et Projets. Essayez d'écrire l'un de ces mots-clés !";

                // Keyword match
                for (const key in MOCK_ANSWERS) {
                    if (query.includes(key)) {
                        aiText = MOCK_ANSWERS[key];
                        break;
                    }
                }

                const newAiMessage: Message = {
                    id: Math.random().toString(),
                    text: aiText,
                    sender: "ai",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                };

                setMessages((prev) => [...prev, newAiMessage]);
                setIsTyping(false);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            });
    };

    return (
        <>
            {/* Global Floating Trigger Button */}
            <View style={styles.floatingContainer}>
                <Animated.View style={{ transform: [{ scale: Animated.multiply(floatAnim, pulseAnim) }] }}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleOpen}
                        style={styles.floatingButton}
                    >
                        <Ionicons name="chatbubble-ellipses" size={28} color="#ffffff" />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Chatbot Overlay Screen */}
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.safeArea}>
                        <KeyboardAvoidingView
                            behavior="padding"
                            style={styles.chatContainer}
                            keyboardVerticalOffset={0}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Ionicons name="hardware-chip" size={22} color={colors.blue} />
                                    </View>
                                    <View>
                                        <Text style={styles.headerTitle}>SOMAP Assistant AI</Text>
                                        <View style={styles.statusRow}>
                                            <View style={styles.statusDot} />
                                            <Text style={styles.statusText}>En ligne</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Chat Thread */}
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.messagesList}
                                renderItem={({ item }) => (
                                    <View
                                        style={[
                                            styles.messageBubbleWrapper,
                                            item.sender === "user" ? styles.userWrapper : styles.aiWrapper,
                                        ]}
                                    >
                                        {item.sender === "ai" && (
                                            <View style={styles.messageAvatar}>
                                                <Ionicons name="logo-android" size={14} color="#ffffff" />
                                            </View>
                                        )}
                                        <View
                                            style={[
                                                styles.messageBubble,
                                                item.sender === "user" ? styles.userBubble : styles.aiBubble,
                                            ]}
                                        >
                                            {renderFormattedText(item.text, item.sender === "user")}
                                            <Text
                                                style={[
                                                    styles.messageTime,
                                                    item.sender === "user" ? styles.userTime : styles.aiTime,
                                                ]}
                                            >
                                                {item.time}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                ListFooterComponent={
                                    isTyping ? (
                                        <View style={[styles.messageBubbleWrapper, styles.aiWrapper, { marginBottom: 12 }]}>
                                            <View style={styles.messageAvatar}>
                                                <Ionicons name="logo-android" size={14} color="#ffffff" />
                                            </View>
                                            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                                                <ActivityIndicator size="small" color={colors.blue} />
                                                <Text style={[styles.messageText, styles.aiMessageText, { marginLeft: 8, fontStyle: "italic" }]}>
                                                    SOMAP écrit...
                                                </Text>
                                            </View>
                                        </View>
                                    ) : null
                                }
                            />

                            {/* Suggested Questions */}
                            <View style={styles.quickPromptsWrapper}>
                                <FlatList
                                    horizontal
                                    data={QUICK_PROMPTS}
                                    keyExtractor={(item) => item}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.quickPromptsList}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.promptCapsule}
                                            onPress={() => handleSend(item)}
                                        >
                                            <Text style={styles.promptText}>{item}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>

                            {/* Footer Input Bar */}
                            <View style={styles.inputBar}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Écrivez un message (ex: sablage)..."
                                    placeholderTextColor={colors.textHint}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onSubmitEditing={() => handleSend(inputText)}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        { backgroundColor: inputText.trim() ? colors.blue : colors.textHint },
                                    ]}
                                    disabled={!inputText.trim()}
                                    onPress={() => handleSend(inputText)}
                                >
                                    <Ionicons name="send" size={18} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    floatingContainer: {
        position: "absolute",
        bottom: 106, // Neatly positioned above the 68px bottom tab bar
        right: 20,
        zIndex: 9999,
        // High visibility shadow
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 12,
    },
    floatingButton: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.blue,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.4)",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(13, 45, 94, 0.45)", // Tinted navy backdrop
        justifyContent: "flex-end",
    },
    safeArea: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: colors.bgScreen, // matching app body color
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: 60, // Gives a clean card drawer layout
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 24,
    },
    header: {
        height: 70,
        backgroundColor: colors.bgCard,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgIconWell,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    headerTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.greenStatus,
        marginRight: 6,
    },
    statusText: {
        fontFamily: fonts.body,
        fontSize: 12,
        color: colors.textSecondary,
    },
    closeButton: {
        padding: 4,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 24,
    },
    messageBubbleWrapper: {
        flexDirection: "row",
        marginBottom: 16,
        maxWidth: "80%",
    },
    userWrapper: {
        alignSelf: "flex-end",
        justifyContent: "flex-end",
    },
    aiWrapper: {
        alignSelf: "flex-start",
        justifyContent: "flex-start",
    },
    messageAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.blue,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        alignSelf: "flex-end",
    },
    messageBubble: {
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: colors.blue,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: colors.bgCard,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
    },
    messageText: {
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 20,
    },
    boldText: {
        fontFamily: fonts.bodySemiBold,
        fontWeight: "bold",
    },
    headerText: {
        fontFamily: fonts.bodySemiBold,
        fontWeight: "bold",
        fontSize: 16,
        marginTop: 6,
        marginBottom: 2,
    },
    lineWrapper: {
        flexDirection: "row",
        alignItems: "flex-start",
        width: "100%",
    },
    bulletLine: {
        paddingLeft: 12,
    },
    bulletPoint: {
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 22,
    },
    lineText: {
        flex: 1,
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 22,
    },
    paragraphGap: {
        height: 8,
    },
    userMessageText: {
        color: "#ffffff",
    },
    aiMessageText: {
        color: colors.textPrimary,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: "flex-end",
    },
    userTime: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    aiTime: {
        color: colors.textMuted,
    },
    quickPromptsWrapper: {
        backgroundColor: "transparent",
        paddingVertical: 8,
    },
    quickPromptsList: {
        paddingHorizontal: 16,
    },
    promptCapsule: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.bgCard,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    promptText: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.blue,
    },
    inputBar: {
        backgroundColor: colors.bgCard,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingBottom: Platform.OS === "ios" ? 24 : 12,
    },
    textInput: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.bgScreen,
        paddingHorizontal: 16,
        fontSize: 15,
        color: colors.textPrimary,
        fontFamily: fonts.body,
        marginRight: 10,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
    },
});
