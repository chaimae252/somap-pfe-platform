import {
  validateEmail, validateName, validatePhone,
  validateRegisterPassword,
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
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { register } from "@/services/authService";

export default function RegisterScreen() {

  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });

  const [pressed, setPressed] = useState(false);

  /* ================= VALIDATION ================= */

  const isNameValid = validateName(fullName);
  const isEmailValid = validateEmail(email);
  const isPhoneValid = validatePhone(phone);
  const isPasswordValid = validateRegisterPassword(password);

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  /* ================= REGISTER ================= */

  const handleRegister = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validateRegisterPassword(password);
    const nameValid = validateName(fullName);
    const phoneValid = validatePhone(phone);

    if (!emailValid || !passwordValid || !nameValid || !phoneValid) {
      Alert.alert("Erreur", "Vérifie tes champs");
      return;
    }

    if (!agree) {
      Alert.alert("Erreur", "Accepte les conditions");
      return;
    }

    try {
      const data = await register({
        nom: fullName,
        email,
        motDePasse: password,
        telephone: phone,
        adresse: "",
      });

      console.log("REGISTER RESPONSE 👉", data);

      // ⚡ AUTO LOGIN SAFE VERSION
      if (data?.token) {
        await saveToken(data.token);
      }

      if (data?.user) {
        await saveUser(data.user);
      } else {
        await saveUser(data);
      }

      Alert.alert("Succès", "Compte créé 🎉");

      router.replace("/home");

    } catch (error: any) {
      console.log("REGISTER ERROR 👉", error?.response?.data || error);

      Alert.alert(
          "Erreur",
          error?.response?.data?.message || "Impossible de créer le compte"
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

            {/* BACK */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/login")}
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
                <Image
                    source={require("@/assets/images/regi.png")}
                    style={styles.topImage}
                    resizeMode="contain"
                />

                <Text style={styles.title}>Créer un compte</Text>
              </View>

              {/* FULL NAME */}
              <TextInput
                  placeholder="Nom complet"
                  placeholderTextColor="#8e9aaf"
                  style={[
                    styles.input,
                    !isNameValid && touched.name && styles.inputError,
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  onBlur={() => markTouched("name")}
              />

              <Text style={styles.error}>
                {!isNameValid && touched.name ? "Nom requis" : " "}
              </Text>

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

              {/* PHONE */}
              <TextInput
                  placeholder="Numéro de téléphone"
                  placeholderTextColor="#8e9aaf"
                  style={[
                    styles.input,
                    !isPhoneValid && touched.phone && styles.inputError,
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  onBlur={() => markTouched("phone")}
              />

              <Text style={styles.error}>
                {!isPhoneValid && touched.phone ? "Numéro invalide" : " "}
              </Text>

              {/* PASSWORD */}
              <TextInput
                  placeholder="Mot de passe (min 6 caractères)"
                  placeholderTextColor="#8e9aaf"
                  style={[
                    styles.input,
                    !isPasswordValid && touched.password && styles.inputError,
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

              {/* TERMS */}
              <TouchableOpacity
                  style={styles.row}
                  onPress={() => setAgree(!agree)}
              >
                <Text style={styles.checkbox}>
                  {agree ? "☑" : "☐"}
                </Text>

                <Text style={styles.terms}>
                  J’accepte les conditions d’utilisation
                </Text>
              </TouchableOpacity>

              {/* BUTTON */}
              <TouchableOpacity
                  style={[
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleRegister}
                  onPressIn={() => setPressed(true)}
                  onPressOut={() => setPressed(false)}
              >
                <Text style={styles.buttonText}>
                  Créer le compte
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
    width: 140,
    height: 140,
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
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  checkbox: {
    marginRight: 8,
    color: "#1564c0",
  },

  terms: {
    fontSize: 13,
    color: "#6a7c94",
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
});