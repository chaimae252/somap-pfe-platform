import { login } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import {
  validateEmail,
  validateLoginPassword,
} from "@/utils/validators";
import {
  saveToken,
  saveUser,
} from "@/utils/storage";

import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
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

  const isEmailValid = validateEmail(email);
  const isPasswordValid = validateLoginPassword(password);

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleLogin = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validateLoginPassword(password);

    if (!emailValid || !passwordValid) {
      Alert.alert("Erreur", "Veuillez vérifier vos informations");
      return;
    }

    try {
      const data = await login({
        email,
        motDePasse: password,
      });

      await saveToken(data.token);
      await saveUser(data);

      Alert.alert("Succès", "Connexion réussie");

      router.replace("/home");
    } catch (error) {
      Alert.alert("Erreur", "Email ou mot de passe incorrect");
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
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>

              {/* BACK */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/onboarding")}
              >
                <MaterialIcons name="arrow-back-ios" size={20} color="#1564c0" />
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

  {/* ICON BOX (NEW) */}
  <View style={styles.iconBox}>
    <MaterialIcons name="lock-outline" size={45} color="#fff" />
  </View>

  <Text style={styles.title}>Connexion</Text>

</View>

                {/* EMAIL */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                    !isEmailValid && touched.email && styles.inputError,
                  ]}
                >
                  <MaterialIcons name="email" size={22} color="#8e9aaf" style={styles.icon} />

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
                  {!isEmailValid && touched.email ? "Email invalide" : " "}
                </Text>

                {/* PASSWORD */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "password" && styles.inputFocused,
                    !isPasswordValid && touched.password && styles.inputError,
                  ]}
                >
                  <MaterialIcons name="lock" size={22} color="#8e9aaf" style={styles.icon} />

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
                  {!isPasswordValid && touched.password ? "Mot de passe trop court" : " "}
                </Text>

                {/* OPTIONS */}
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => setRemember(!remember)}>
                    <Text style={styles.remember}>
                      {remember ? "☑" : "☐"} Se souvenir de moi
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push("/VerifyScreen")}>
                    <Text style={styles.forgot}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                </View>

                {/* BUTTON */}
                <TouchableOpacity
                  style={[styles.button, pressed && styles.buttonPressed]}
                  onPress={handleLogin}
                  onPressIn={() => setPressed(true)}
                  onPressOut={() => setPressed(false)}
                >
                  <Text style={styles.buttonText}>Se connecter</Text>
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
    top: 20,
    left: 18,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 10,
  },

  header: {
    alignItems: "center",
    paddingTop: 35,
  },

  logo: {
    width: 230,
    height: 100,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 35,
    marginHorizontal: 20,
    marginTop: 25,
    padding: 26,
  },

  cardHeader: {
    alignItems: "center",
    marginBottom: 22,
  },
  iconBox: {
  width: 85,
  height: 85,
  backgroundColor: "#1564c0",
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 15,

  shadowColor: "#1564c0",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 6,
},

  topImage: {
    width: 170,
    height: 170,
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1f2d3d",
  },

  /* FIXED INPUT */
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    borderRadius: 18,
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: "#d8e2f1",
    marginTop: 12,
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
    marginTop: 5,
    minHeight: 18,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 28,
  },

  remember: {
    fontSize: 13,
    color: "#6c7a92",
  },

  forgot: {
    fontSize: 13,
    color: "#1564c0",
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#1564c0",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  bottomText: {
    textAlign: "center",
    marginTop: 24,
    marginBottom: 14,
    color: "#6c7a92",
  },

  outlineButton: {
    borderWidth: 1.8,
    borderColor: "#1564c0",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    backgroundColor: "#f7fbff",
  },

  outlineButtonText: {
    color: "#1564c0",
    fontWeight: "800",
  },
});