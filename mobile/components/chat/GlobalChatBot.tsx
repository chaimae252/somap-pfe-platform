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
import { LinearGradient } from "expo-linear-gradient";
import { useSegments } from "expo-router";

const { colors, fonts } = Theme;
const { width, height } = Dimensions.get("window");

interface Message {
    id: string;
    text: string;
    sender: "user" | "ai";
    time: string;
}

const QUICK_PROMPTS = [
    { text: "Qu'est-ce que le sablage ?", icon: "speedometer-outline" },
    { text: "C'est quoi la métallisation ?", icon: "shield-checkmark-outline" },
    { text: "Peinture industrielle", icon: "color-fill-outline" },
    { text: "Travaux en polyester", icon: "layers-outline" },
    { text: "Comment créer une demande ?", icon: "add-circle-outline" },
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
    const segments = useSegments() as string[];
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

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

    // Tooltip timer
    useEffect(() => {
        if (!user?.id) {
            setShowTooltip(false);
            return;
        }

        let timer: NodeJS.Timeout;
        let autoHideTimer: NodeJS.Timeout;

        const checkTooltip = async () => {
            try {
                const shown = await AsyncStorage.getItem(`@somap_chatbot_tooltip_shown_${user.id}`);
                if (!shown) {
                    // Show tooltip after 1.5s delay
                    timer = setTimeout(() => {
                        setShowTooltip(true);
                    }, 1500);

                    // Auto-hide after 8 seconds
                    autoHideTimer = setTimeout(() => {
                        setShowTooltip(false);
                    }, 9500);
                }
            } catch (err) {
                console.log("Error checking tooltip state:", err);
            }
        };

        checkTooltip();

        return () => {
            if (timer) clearTimeout(timer);
            if (autoHideTimer) clearTimeout(autoHideTimer);
        };
    }, [user?.id]);

    const handleDismissTooltip = async () => {
        setShowTooltip(false);
        if (user?.id) {
            try {
                await AsyncStorage.setItem(`@somap_chatbot_tooltip_shown_${user.id}`, "true");
            } catch (err) {
                console.log("Error saving tooltip state:", err);
            }
        }
    };

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

    // Only render if user is authenticated and not on splash/auth/onboarding routes
    const isAuthOrSplash = 
        segments.includes("(auth)") || 
        segments.includes("onboarding") || 
        segments.includes("splash") || 
        segments.includes("index") ||
        segments.length === 0;

    if (!token || isAuthOrSplash) {
        return null;
    }

    const handleOpen = () => {
        handleDismissTooltip();
        Animated.sequence([
            Animated.timing(floatAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.timing(floatAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => setVisible(true));
    };

    const handleClearHistory = () => {
        setMessages([defaultGreeting(user?.nom || user?.username)]);
        if (user?.id) {
            AsyncStorage.removeItem(`@somap_chat_history_${user.id}`)
                .catch((err) => console.log("Failed to clear chat history:", err));
        }
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
                {/* Onboarding Tooltip Bubble */}
                {showTooltip && (
                    <View style={styles.tooltipBubble}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleOpen}
                            style={styles.tooltipContent}
                        >
                            <Text style={styles.tooltipText}>
                                Besoin d'aide ? Posez toutes vos questions à l'assistant ! 🤖
                            </Text>
                            <TouchableOpacity
                                onPress={handleDismissTooltip}
                                style={styles.tooltipCloseButton}
                            >
                                <Ionicons name="close" size={16} color="#ffffff" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                        {/* Little triangle arrow pointing down */}
                        <View style={styles.tooltipArrow} />
                    </View>
                )}

                <Animated.View style={{ transform: [{ scale: Animated.multiply(floatAnim, pulseAnim) }] }}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleOpen}
                    >
                        <LinearGradient
                            colors={['#1271b8', '#7EC933']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.floatingButton}
                        >
                            <Ionicons name="chatbubble-ellipses" size={28} color="#ffffff" />
                        </LinearGradient>
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
                            <LinearGradient
                                colors={['#0d2d5e', '#8FBD69']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.header}
                            >
                                <View style={styles.headerInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Ionicons name="hardware-chip" size={22} color="#ffffff" />
                                    </View>
                                    <View>
                                        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>SOMAP Assistant AI</Text>
                                        <View style={styles.statusRow}>
                                            <View style={styles.statusDot} />
                                            <Text style={[styles.statusText, { color: 'rgba(255, 255, 255, 0.85)' }]}>En ligne</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.headerRight}>
                                    <TouchableOpacity
                                        onPress={handleClearHistory}
                                        style={styles.headerActionButton}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="rgba(255, 255, 255, 0.8)" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Ionicons name="close-circle" size={32} color="rgba(255, 255, 255, 0.8)" />
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>

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
                                            <LinearGradient
                                                colors={['#1271b8', '#8FBD69']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.messageAvatar}
                                            >
                                                <Ionicons name="hardware-chip" size={13} color="#ffffff" />
                                            </LinearGradient>
                                        )}
                                        {item.sender === "user" ? (
                                            <LinearGradient
                                                colors={['#1271b8', '#13ACD5']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={[styles.messageBubble, styles.userBubble]}
                                            >
                                                {renderFormattedText(item.text, true)}
                                                <Text style={[styles.messageTime, styles.userTime]}>
                                                    {item.time}
                                                </Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={[styles.messageBubble, styles.aiBubble]}>
                                                {renderFormattedText(item.text, false)}
                                                <Text style={[styles.messageTime, styles.aiTime]}>
                                                    {item.time}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                                ListFooterComponent={
                                    isTyping ? (
                                        <View style={[styles.messageBubbleWrapper, styles.aiWrapper, { marginBottom: 12 }]}>
                                            <LinearGradient
                                                colors={['#1271b8', '#8FBD69']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.messageAvatar}
                                            >
                                                <Ionicons name="hardware-chip" size={13} color="#ffffff" />
                                            </LinearGradient>
                                            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                                                <ActivityIndicator size="small" color={colors.blue} />
                                                <Text style={[styles.messageText, styles.aiMessageText, { marginLeft: 8, fontStyle: "italic", color: colors.textSecondary }]}>
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
                                    keyExtractor={(item) => item.text}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.quickPromptsList}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.promptCapsule}
                                            onPress={() => handleSend(item.text)}
                                        >
                                            <Ionicons name={item.icon as any} size={14} color={colors.greenDark} style={{ marginRight: 6 }} />
                                            <Text style={styles.promptText}>{item.text}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>

                            {/* Footer Input Bar */}
                            <View style={styles.inputBar}>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Écrivez un message (ex: sablage)..."
                                        placeholderTextColor={colors.textHint}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        onSubmitEditing={() => handleSend(inputText)}
                                    />
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        disabled={!inputText.trim()}
                                        onPress={() => handleSend(inputText)}
                                    >
                                        <LinearGradient
                                            colors={inputText.trim() ? ['#8FBD69', '#6a9e3a'] : ['#e2e8f0', '#e2e8f0']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.sendButton}
                                        >
                                            <Ionicons name="send" size={16} color="#ffffff" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
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
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.45)",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(13, 27, 56, 0.65)", // Luxurious tinted dark backdrop
        justifyContent: "flex-end",
    },
    safeArea: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: colors.bgScreen,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: 70, // Gives a clean bottom card sheet layout
        overflow: "hidden",
        shadowColor: "#0d2d5e",
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 24,
    },
    header: {
        height: 72,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        borderBottomWidth: 1.5,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    headerInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerActionButton: {
        padding: 8,
        marginRight: 6,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    headerTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 16,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#22C55E",
        marginRight: 6,
        borderWidth: 1.5,
        borderColor: "#ffffff",
    },
    statusText: {
        fontFamily: fonts.body,
        fontSize: 12,
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
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        alignSelf: "flex-end",
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    messageBubble: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: "#0d2d5e",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    userBubble: {
        borderBottomRightRadius: 4,
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    aiBubble: {
        backgroundColor: "rgba(143, 189, 105, 0.07)",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(143, 189, 105, 0.2)",
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
        marginTop: 6,
        alignSelf: "flex-end",
    },
    userTime: {
        color: "rgba(255, 255, 255, 0.75)",
    },
    aiTime: {
        color: colors.textMuted,
    },
    quickPromptsWrapper: {
        backgroundColor: "transparent",
        paddingVertical: 12,
    },
    quickPromptsList: {
        paddingHorizontal: 16,
    },
    promptCapsule: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: "rgba(143, 189, 105, 0.08)",
        marginRight: 10,
        borderWidth: 1,
        borderColor: "rgba(143, 189, 105, 0.22)",
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    promptText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
        color: colors.greenDark,
    },
    inputBar: {
        backgroundColor: colors.bgCard,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingBottom: Platform.OS === "ios" ? 28 : 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgScreen,
        borderRadius: 26,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    textInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 12,
        fontSize: 15,
        color: colors.textPrimary,
        fontFamily: fonts.body,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    tooltipBubble: {
        position: "absolute",
        bottom: 72,
        right: 0,
        width: 220,
        backgroundColor: colors.blue,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10000,
    },
    tooltipContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tooltipText: {
        flex: 1,
        fontFamily: fonts.bodyMedium,
        fontSize: 12,
        color: "#ffffff",
        lineHeight: 16,
        paddingRight: 6,
    },
    tooltipCloseButton: {
        padding: 2,
    },
    tooltipArrow: {
        position: "absolute",
        bottom: -5,
        right: 23, // Centered above the 58px button
        width: 10,
        height: 10,
        backgroundColor: colors.blue,
        transform: [{ rotate: "45deg" }],
    },
});
