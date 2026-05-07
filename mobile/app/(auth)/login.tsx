import { login } from "@/services/authService";
import {
  saveToken,
  saveUser,
} from "@/utils/storage";
import { useAuthStore } from "@/store/authStore";
import {
  validateEmail,
  validateLoginPassword,
} from "@/utils/validators";

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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function LoginScreen() {

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [pressed, setPressed] = useState(false);

  /* ================= VALIDATION ================= */

  const isEmailValid = validateEmail(email);
  const isPasswordValid = validateLoginPassword(password);

  const isFormValid = isEmailValid && isPasswordValid;

  const markTouched = (field: keyof typeof touched) => {
  setTouched((prev) => ({ ...prev, [field]: true }));
};

  const handleLogin = async () => {

    if (!isFormValid) {
      Alert.alert(
          "Erreur",
          "Veuillez vérifier vos informations."
      );
      return;
    }

    try {

      const data = await login({
        email,
        motDePasse: password,
      });

      // Save token
      await saveToken(data.token);

      // Save user
      await saveUser(data);

      // Update global store
      setAuth(data.token, data);

      Alert.alert(
          "Succès",
          "Connexion réussie !"
      );

      router.replace("/home");

    } catch (error: any) {

      console.log(error?.response?.data);

      Alert.alert(
          "Erreur",
          "Email ou mot de passe incorrect"
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.container}>

          {/* BACK BUTTON */}
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/onboarding")} // or router.back()
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

            {/* IMAGE + TITLE */}
            <View style={styles.cardHeader}>
              <Image
                source={require("@/assets/images/accessm.png")}
                style={styles.topImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Connexion</Text>
            </View>

            {/* EMAIL */}
            <TextInput
              placeholder="Adresse email"
              placeholderTextColor="#8e9aaf"
              style={[
                styles.input,
                !isEmailValid && touched.email && styles.inputError,
              ]}
              value={email}
              onChangeText={setEmail}
              onBlur={() => markTouched("email")}
            />
            <Text style={styles.error}>
              {!isEmailValid && touched.email ? "Email invalide" : " "}
            </Text>

            {/* PASSWORD */}
            <TextInput
              placeholder="Mot de passe (min 6 caractères)"
              placeholderTextColor="#8e9aaf"
              style={[
                styles.input,
                !isPasswordValid &&
                  touched.password &&
                  styles.inputError,
              ]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onBlur={() => markTouched("password")}
            />
            <Text style={styles.error}>
              {!isPasswordValid && touched.password
                ? "Mot de passe trop court"
                : " "}
            </Text>

            {/* OPTIONS */}
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setRemember(!remember)}>
                <Text style={styles.remember}>
                  {remember ? "☑" : "☐"} Se souvenir de moi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/VerifyScreen")}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f5fc",
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  backButton: {
    position: "absolute",
    top: 20,
    left: 15,
    zIndex: 10,
    padding: 8,
    marginTop: 5,
  },

  header: {
    alignItems: "center",
    paddingTop: 20,
  },

  logo: {
    width: 250,
    height: 110,
    marginTop: 5,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 32,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
  },

  cardHeader: {
    alignItems: "center",
    marginBottom: 18,
  },

  topImage: {
    width: 150,
    height: 150,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  input: {
  backgroundColor: "#f8fafd",
  borderRadius: 18,
  padding: 12,
  borderWidth: 1,
  borderColor: "#8cd1b2",
  marginTop: 10,
},

  inputError: {
    borderColor: "#e04f5f",
    backgroundColor: "#fff8f8",
  },

  error: {
    color: "#e04f5f",
    fontSize: 12,
    minHeight: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },

  remember: {
    fontSize: 13,
    color: "#6a7c94",
  },

  forgot: {
    fontSize: 13,
    color: "#1564c0",
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#1564c0",
    padding: 14,
    borderRadius: 40,
    alignItems: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  bottomText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#6a7c94",
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: "#1564c0",
    padding: 14,
    borderRadius: 40,
    alignItems: "center",
  },

  outlineButtonText: {
    color: "#1564c0",
    fontWeight: "700",
  },
});