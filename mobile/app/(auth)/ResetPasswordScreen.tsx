import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { resetPassword } from "@/services/authService";
import { ALLOW_SCREEN_RECORDING_DEMO } from "@/constants/demo";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

const email =
  typeof params.email === "string"
    ? params.email
    : Array.isArray(params.email)
    ? params.email[0]
    : "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ new: false, confirm: false });
  const [pressed, setPressed] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isNewValid = newPassword.length >= 6;
  const isMatch = newPassword === confirmPassword;
  const isConfirmValid = isMatch && confirmPassword.length > 0;
  const isFormValid = isNewValid && isConfirmValid;

  const markTouched = (field: "new" | "confirm") => {
  setTouched((prev) => ({ ...prev, [field]: true }));
};


  const handleSubmit = async () => {
    if (!isFormValid) {
      setMessage({ type: "error", text: "Veuillez vérifier les champs" });
      return;
    }
    try {
      await resetPassword(email, newPassword);
      setMessage({ type: "success", text: "Mot de passe mis à jour !" });
      setTimeout(() => {
        router.replace("/login");
      }, 800);
    } catch (error) {
      setMessage({ type: "error", text: "Impossible de modifier le mot de passe" });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              {/* MESSAGE */}
              {message.text !== "" && (
                <View
                  style={[
                    styles.messageBox,
                    message.type === "success"
                      ? styles.messageSuccess
                      : styles.messageError,
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              )}

              {/* BACK */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/VerifyScreen")}
              >
                <MaterialIcons name="arrow-back-ios" size={20} color="#1564c0" />
              </TouchableOpacity>

              {/* HEADER */}
              <View style={styles.header}>
                <Image
                  source={require("../../assets/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* CARD */}
              <View style={styles.card}>
                {/* ICON HEADER (NEW STYLE) */}
                <View style={styles.cardHeader}>
                  <Image
                    source={require("@/assets/images/reset-login.png")}
                    style={styles.resetIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>Réinitialiser le mot de passe</Text>
                  <Text style={styles.subtitle}>
                    Choisissez un mot de passe fort et sécurisé
                  </Text>
                </View>

                {/* NEW PASSWORD */}
                <TextInput
                  placeholder="Nouveau mot de passe (min 6)"
                  placeholderTextColor="#8e9aaf"
                  style={[
                    styles.input,
                    !isNewValid && touched.new && styles.inputError,
                  ]}
                  secureTextEntry={!ALLOW_SCREEN_RECORDING_DEMO}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onBlur={() => markTouched("new")}
                />
                <Text style={styles.error}>
                  {!isNewValid && touched.new ? "Min 6 caractères" : " "}
                </Text>

                {/* CONFIRM PASSWORD */}
                <TextInput
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#8e9aaf"
                  style={[
                    styles.input,
                    !isConfirmValid && touched.confirm && styles.inputError,
                  ]}
                  secureTextEntry={!ALLOW_SCREEN_RECORDING_DEMO}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => markTouched("confirm")}
                  onSubmitEditing={handleSubmit}
                />
                <Text style={styles.error}>
                  {!isConfirmValid && touched.confirm
                    ? "Les mots de passe ne correspondent pas"
                    : " "}
                </Text>

                {/* BUTTON */}
                <TouchableOpacity
                  style={[styles.button, pressed && styles.buttonPressed]}
                  onPress={handleSubmit}
                  onPressIn={() => setPressed(true)}
                  onPressOut={() => setPressed(false)}
                >
                  <Text style={styles.buttonText}>Valider</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 30,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 18,
    zIndex: 10,
    padding: 4,
  },
  messageBox: {
    marginTop: 35,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "center",
    width: "70%",
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
  resetIcon: {
    width: 200,
    height: 240,
    marginBottom: -13,
    marginTop: -50,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f2d3d",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6c7a92",
    textAlign: "center",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#f7f9fc",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1.5,
    borderColor: "#d8e2f1",
    marginTop: 12,
    fontSize: 15,
    color: "#1f2d3d",
  },
  inputError: {
    borderColor: "#ff5a6b",
    backgroundColor: "#fff5f6",
  },
  error: {
    color: "#ff5a6b",
    fontSize: 12,
    minHeight: 16,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#1564c0",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 15,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
