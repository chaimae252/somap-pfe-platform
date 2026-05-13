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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [touched, setTouched] = useState({
    new: false,
    confirm: false,
  });

  const [pressed, setPressed] = useState(false);

  const isNewValid = newPassword.length >= 6;
  const isMatch = newPassword === confirmPassword;
  const isConfirmValid = isMatch && confirmPassword.length > 0;
  const isFormValid = isNewValid && isConfirmValid;

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Erreur", "Veuillez vérifier les champs.");
      return;
    }

    try {
      await resetPassword(email as string, newPassword);

      Alert.alert("Succès", "Mot de passe mis à jour !");
      router.replace("/login");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier le mot de passe");
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

              {/* BACK */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/VerifyScreen")}
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

                {/* ICON HEADER (NEW STYLE) */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <MaterialIcons
                      name="lock-reset"
                      size={45}
                      color="#fff"
                    />
                  </View>

                  <Text style={styles.title}>
                    Réinitialiser le mot de passe
                  </Text>

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
                  secureTextEntry
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
                  secureTextEntry
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
                  style={[
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
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

  /* ICON BOX (same as login/register) */
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