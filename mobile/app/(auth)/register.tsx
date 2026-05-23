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
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {

  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);

  const [focusedInput, setFocusedInput] = useState("");

  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    adresse: false,
  });

  const [pressed, setPressed] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

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
      setMessage({
        type: "error",
        text: "Veuillez vérifier vos informations",
      });
      return;
    }

    if (!agree) {
      setMessage({
        type: "error",
        text: "Acceptez les conditions",
      });
      return;
    }

    try {
      const data = await register({
        nom: fullName,
        email,
        motDePasse: password,
        telephone: phone,
        adresse: adresse,
      });

      const token = data?.token;

      const user = {
        id: data?.id,
        nom: data?.nom || fullName,
        email: data?.email || email,
        role: data?.role,
        telephone: phone,
        adresse: adresse,
      };

      if (token) {
        await saveToken(token);
      }

      await saveUser(user);
      setAuth(token, user);
      await AsyncStorage.setItem("userId", user.id.toString());
      setMessage({
        type: "success",
        text: "Compte créé avec succès !",
      });

      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 800);

    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Impossible de créer le compte",
      });
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

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/login")}
              >
                <MaterialIcons name="arrow-back-ios" size={20} color="#1564c0" />
              </TouchableOpacity>

              <View style={styles.header}>
                <Image
                  source={require("@/assets/images/logomob.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Image
                    source={require("@/assets/images/signup-p.png")}
                    style={styles.regiIcon}
                    resizeMode="contain"
                  />
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
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.error}>
                  {!isPhoneValid && touched.phone ? "Numéro invalide" : " "}
                </Text>

                {/* ADRESSE */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === "adresse" && styles.inputFocused,
                ]}>
                  <MaterialIcons name="location-on" size={22} color="#8e9aaf" style={styles.icon} />
                  <TextInput
                    placeholder="Adresse (facultatif)"
                    value={adresse}
                    onChangeText={setAdresse}
                    onFocus={() => setFocusedInput("adresse")}
                    onBlur={() => { setFocusedInput(""); markTouched("adresse"); }}
                    style={styles.textInput}
                  />
                </View>
                <Text style={styles.error}>
                  {/* Optional field – no error */}
                </Text>

                {/* PASSWORD with visibility toggle */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === "password" && styles.inputFocused,
                  !isPasswordValid && touched.password && styles.inputError,
                ]}>
                  <MaterialIcons name="lock" size={22} color="#8e9aaf" style={styles.icon} />
                  <TextInput
                    placeholder="Mot de passe"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => { setFocusedInput(""); markTouched("password"); }}
                    style={styles.textInput}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={22} 
                      color="#8e9aaf" 
                    />
                  </TouchableOpacity>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eef3fb" },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  backButton: {
    position: "absolute",
    top: 40,
    left: 18,
    zIndex: 10,
    padding: 4,
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
  regiIcon: {
    width: 190,
    height: 200,
    marginBottom: -13,
    marginTop: -50,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1f2d3d",
    marginTop: 1,
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
  icon: { marginRight: 10 },
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
  messageBox: {
    marginTop: 35,
    padding: 12,
    borderRadius: 12,
    alignSelf: "center",
    width: "60%",
    alignItems: "center",
  },
  messageText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    width: "100%",
  },
  messageSuccess: {
    backgroundColor: "#2ecc71",
  },
  messageError: {
    backgroundColor: "#e74c3c",
  },
});