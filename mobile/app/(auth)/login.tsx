import {login} from "@/services/authService";
import {useAuthStore} from "@/store/authStore";
import {validateEmail, validateLoginPassword,} from "@/utils/validators";
import {saveToken, saveUser,} from "@/utils/storage";

import React, {useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

import {MaterialIcons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {getClientById} from "@/services/clientService";
import axios from "axios";

export default function LoginScreen() {

    const {setAuth} = useAuthStore();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const [focusedInput, setFocusedInput] = useState("");

    const [touched, setTouched] = useState({
        email: false,
        password: false,
    });

    const [pressed, setPressed] = useState(false);

    // ✅ NEW STATE (ONLY ADDITION)
    const [message, setMessage] = useState({
        type: "", // "success" | "error"
        text: "",
    });

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validateLoginPassword(password);

    const markTouched = (field: keyof typeof touched) => {
        setTouched((prev) => ({...prev, [field]: true}));
    };

    /* ================= LOGIN ================= */

    const handleLogin = async () => {
        const emailValid = validateEmail(email);
        const passwordValid = validateLoginPassword(password);

        if (!emailValid || !passwordValid) {
            setMessage({type: "error", text: "Veuillez vérifier vos informations"});
            return;
        }

        try {
            const response = await login({
                email,
                motDePasse: password,
            });

            console.log("LOGIN RESPONSE =", response);

            const {token, id, nom, role} = response;

// SAVE TOKEN FIRST
            await saveToken(token);

// SET AXIOS AUTH HEADER
            axios.defaults.headers.common[
                "Authorization"
                ] = `Bearer ${token}`;

// NOW protected route works
            const fullClient = await getClientById(id);

            const user = {
                id,
                email,
                nom,
                role,
                telephone: fullClient?.telephone || "",
                adresse: fullClient?.adresse || "",
            };

            await saveToken(token);
            await AsyncStorage.setItem("userId", id.toString());
            await saveUser(user);
            setAuth(token, user);

            setMessage({type: "success", text: "Connexion réussie"});
            setTimeout(() => router.replace("/(tabs)/home"), 800);
        } catch (error) {
            console.log("LOGIN ERROR:", error);
            setMessage({type: "error", text: "Email ou mot de passe incorrect"});
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={20}
            >

                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                    <ScrollView
                        contentContainerStyle={{flexGrow: 1}}
                        keyboardShouldPersistTaps="handled"
                    >

                        <View style={styles.container}>

                            {/* ✅ MESSAGE (ONLY ADDITION) */}
                            {message.text !== "" && (
                                <View
                                    style={[
                                        styles.messageBox,
                                        message.type === "success"
                                            ? styles.messageSuccess
                                            : styles.messageError,
                                    ]}
                                >
                                    <Text style={styles.messageText}>
                                        {message.text}
                                    </Text>
                                </View>
                            )}

                            {/* BACK */}
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.replace("/onboarding")}
                            >
                                <MaterialIcons
                                    name="arrow-back-ios"
                                    size={20}
                                    color="#1564c0"
                                />
                            </TouchableOpacity>

                            {/* HEADER */}
                            <View style={styles.header}>
                                <Image
                                    source={require("@/assets/images/logomob.png")}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* CARD */}
                            <View style={styles.card}>

                                <View style={styles.cardHeader}>
                                    <Image
                                        source={require("@/assets/images/login-page.png")}
                                        style={styles.loginIcon}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.title}>Connexion</Text>
                                </View>

                                {/* EMAIL */}
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedInput === "email" &&
                                        styles.inputFocused,

                                        !isEmailValid &&
                                        touched.email &&
                                        styles.inputError,
                                    ]}
                                >

                                    <MaterialIcons
                                        name="email"
                                        size={22}
                                        color="#8e9aaf"
                                        style={styles.icon}
                                    />

                                    <TextInput
                                        placeholder="Adresse email"
                                        placeholderTextColor="#8e9aaf"
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setFocusedInput("email")}
                                        onBlur={() => {
                                            setFocusedInput("");
                                            markTouched("email");
                                        }}
                                        style={styles.textInput}
                                    />
                                </View>

                                <Text style={styles.error}>
                                    {!isEmailValid && touched.email
                                        ? "Email invalide"
                                        : " "}
                                </Text>

                                {/* PASSWORD */}
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedInput === "password" &&
                                        styles.inputFocused,

                                        !isPasswordValid &&
                                        touched.password &&
                                        styles.inputError,
                                    ]}
                                >

                                    <MaterialIcons
                                        name="lock"
                                        size={22}
                                        color="#8e9aaf"
                                        style={styles.icon}
                                    />

                                    <TextInput
                                        placeholder="Mot de passe (min 6 caractères)"
                                        placeholderTextColor="#8e9aaf"
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setFocusedInput("password")}
                                        onBlur={() => {
                                            setFocusedInput("");
                                            markTouched("password");
                                        }}
                                        style={styles.textInput}
                                    />
                                </View>

                                <Text style={styles.error}>
                                    {!isPasswordValid && touched.password
                                        ? "Mot de passe trop court"
                                        : " "}
                                </Text>

                                {/* OPTIONS */}
                                <View style={styles.row}>

                                    <TouchableOpacity
                                        onPress={() => setRemember(!remember)}
                                    >
                                        <Text style={styles.remember}>
                                            {remember ? "☑" : "☐"} Se souvenir de moi
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push("/VerifyScreen")
                                        }
                                    >
                                        <Text style={styles.forgot}>
                                            Mot de passe oublié ?
                                        </Text>
                                    </TouchableOpacity>

                                </View>

                                {/* BUTTON */}
                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={handleLogin}
                                    onPressIn={() => setPressed(true)}
                                    onPressOut={() => setPressed(false)}
                                >
                                    <Text style={styles.buttonText}>
                                        Se connecter
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.bottomText}>
                                    Vous n’avez pas de compte ?
                                </Text>

                                <TouchableOpacity
                                    style={styles.outlineButton}
                                    onPress={() => router.push("/register")}
                                >
                                    <Text style={styles.outlineButtonText}>
                                        Créer un compte
                                    </Text>
                                </TouchableOpacity>

                            </View>
                        </View>

                    </ScrollView>

                </TouchableWithoutFeedback>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#eef3fb",
    },
    keyboardView: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingBottom: 40,
    },
    backButton: {
        position: "absolute",
        top: 40,
        left: 18,
        zIndex: 10,
        padding: 4,
    },
    header: {
        alignItems: "center",
        paddingTop: 20, // reduced from 35
    },
    logo: {
        width: 230,
        height: 100,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 35,
        marginHorizontal: 15,
        marginTop: 15, // reduced from 25
        padding: 40,   // reduced from 26
    },
    cardHeader: {
        alignItems: "center",
        marginBottom: 8, // reduced from 22
    },
    loginIcon: {
        width: 200,   // bigger
        height: 240,  // bigger
        marginBottom: -13, // minimal space below image
        marginTop: -50,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1f2d3d",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f7f9fc",
        borderRadius: 18,
        paddingHorizontal: 15,
        borderWidth: 1.5,
        borderColor: "#d8e2f1",
        marginTop: 8, // reduced from 12
    },
    inputFocused: {
        borderColor: "#1564c0",
        backgroundColor: "#fff",
    },
    inputError: {
        borderColor: "#ff5a6b",
        backgroundColor: "#fff5f6",
    },
    icon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 15,
        color: "#1f2d3d",
    },
    error: {
        color: "#ff5a6b",
        fontSize: 12,
        marginTop: 2,   // reduced from 5
        minHeight: 14,  // reduced from 18
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,    // reduced from 12
        marginBottom: 20, // reduced from 28
    },
    remember: {
        fontSize: 13,
        color: "#6c7a92",
        marginTop: 10,
    },
    forgot: {
        fontSize: 13,
        color: "#1564c0",
        fontWeight: "700",
        marginTop: 10,
    },
    button: {
        backgroundColor: "#1564c0",
        paddingVertical: 14, // reduced from 16
        borderRadius: 50,
        alignItems: "center",
    },
    buttonPressed: {
        transform: [{scale: 0.97}],
    },
    buttonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 16,
    },
    bottomText: {
        textAlign: "center",
        marginTop: 16,   // reduced from 24
        marginBottom: 10, // reduced from 14
        color: "#6c7a92",
    },
    outlineButton: {
        borderWidth: 1.8,
        borderColor: "#1564c0",
        paddingVertical: 12, // reduced from 15
        borderRadius: 50,
        alignItems: "center",
        backgroundColor: "#f7fbff",
    },
    outlineButtonText: {
        color: "#1564c0",
        fontWeight: "800",
    },
    messageBox: {
        marginTop: 35,
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
        alignSelf: "center",
        width: "60%",
    },
    messageText: {
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
        width: "100%",
    },
    messageSuccess: {
        backgroundColor: "#2ecc71",
    },
    messageError: {
        backgroundColor: "#e74c3c",
    },
});