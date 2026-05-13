import {
  validateEmail,
  validateName,
  validatePhone,
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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
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

  const [focusedInput, setFocusedInput] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });

  const [pressed, setPressed] = useState(false);

  const isNameValid = validateName(fullName);
  const isEmailValid = validateEmail(email);
  const isPhoneValid = validatePhone(phone);
  const isPasswordValid = validateRegisterPassword(password);

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

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

      if (data?.token) await saveToken(data.token);
      if (data?.user) await saveUser(data.user);
      else await saveUser(data);

      Alert.alert("Succès", "Compte créé 🎉");
      router.replace("/home");

    } catch (error: any) {
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

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

  <View style={styles.iconBox}>
  <MaterialIcons name="person-add-alt-1" size={45} color="#fff" />
</View>

  <Text style={styles.title}>Créer un compte</Text>

</View>

                {/* NAME */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === "name" && styles.inputFocused,
                  !isNameValid && touched.name && styles.inputError,
                ]}>
                  <MaterialIcons name="person" size={22} color="#8e9aaf" style={styles.icon} />
                  <TextInput
                    placeholder="Nom complet"
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => { setFocusedInput(""); markTouched("name"); }}
                    style={styles.textInput}
                  />
                </View>

                <Text style={styles.error}>
                  {!isNameValid && touched.name ? "Nom requis" : " "}
                </Text>

                {/* EMAIL */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === "email" && styles.inputFocused,
                  !isEmailValid && touched.email && styles.inputError,
                ]}>
                  <MaterialIcons name="email" size={22} color="#8e9aaf" style={styles.icon} />
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => { setFocusedInput(""); markTouched("email"); }}
                    style={styles.textInput}
                  />
                </View>

                <Text style={styles.error}>
                  {!isEmailValid && touched.email ? "Email invalide" : " "}
                </Text>

                {/* PHONE */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === "phone" && styles.inputFocused,
                  !isPhoneValid && touched.phone && styles.inputError,
                ]}>
                  <MaterialIcons name="phone" size={22} color="#8e9aaf" style={styles.icon} />
                  <TextInput
                    placeholder="Téléphone"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setFocusedInput("phone")}
                    onBlur={() => { setFocusedInput(""); markTouched("phone"); }}
                    style={styles.textInput}
                  />
                </View>

                <Text style={styles.error}>
                  {!isPhoneValid && touched.phone ? "Numéro invalide" : " "}
                </Text>

                {/* PASSWORD */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === "password" && styles.inputFocused,
                  !isPasswordValid && touched.password && styles.inputError,
                ]}>
                  <MaterialIcons name="lock" size={22} color="#8e9aaf" style={styles.icon} />
                  <TextInput
                    placeholder="Mot de passe"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => { setFocusedInput(""); markTouched("password"); }}
                    style={styles.textInput}
                  />
                </View>

                <Text style={styles.error}>
                  {!isPasswordValid && touched.password ? "Mot de passe trop court" : " "}
                </Text>

                {/* TERMS */}
                <TouchableOpacity style={styles.row} onPress={() => setAgree(!agree)}>
                  <Text style={styles.checkbox}>{agree ? "☑" : "☐"}</Text>
                  <Text style={styles.terms}>J’accepte les conditions</Text>
                </TouchableOpacity>

                {/* BUTTON */}
                <TouchableOpacity
                  style={[styles.button, pressed && styles.buttonPressed]}
                  onPress={handleRegister}
                  onPressIn={() => setPressed(true)}
                  onPressOut={() => setPressed(false)}
                >
                  <Text style={styles.buttonText}>S’inscrire</Text>
                </TouchableOpacity>

                {/* 🔥 SAME LINE LOGIN LINK */}
                <View style={styles.bottomRow}>
                  <Text style={styles.bottomText}>Déjà membre ? </Text>

                  <TouchableOpacity onPress={() => router.replace("/login")}>
                    <Text style={styles.signinText}>Se connecter</Text>
                  </TouchableOpacity>
                </View>

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

  safeArea: { flex: 1, backgroundColor: "#eef3fb" },
  keyboardView: { flex: 1 },
  container: { flex: 1 },

  backButton: {
    position: "absolute",
    top: 20,
    left: 18,
    zIndex: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 50,
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
    margin: 20,
    padding: 26,
  },

  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
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
    width: 150,
    height: 150,
  },

  title: {
    fontSize: 26,
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
    paddingVertical: 14,
  },

  error: {
    fontSize: 12,
    color: "#ff5a6b",
    minHeight: 16,
  },

  row: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 20,
  },

  checkbox: {
    marginRight: 8,
    color: "#1564c0",
  },

  terms: {
    color: "#6c7a92",
    fontSize: 13,
  },

  button: {
    backgroundColor: "#1564c0",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  bottomText: {
    color: "#6c7a92",
    fontSize: 13,
  },

  signinText: {
    color: "#1564c0",
    fontSize: 13,
    fontWeight: "800",
  },
});