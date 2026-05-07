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

export default function ResetPasswordScreen() {

  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [pressed, setPressed] = useState(false);

  /* ================= VALIDATION ================= */

  const isCurrentValid = currentPassword.trim().length > 0;
  const isNewValid = newPassword.length >= 6;
  const isMatch = newPassword === confirmPassword;
  const isConfirmValid = isMatch && confirmPassword.length > 0;

  const isFormValid = isCurrentValid && isNewValid && isConfirmValid;

 const markTouched = (field: keyof typeof touched) => {
  setTouched((prev) => ({ ...prev, [field]: true }));
};

  const handleSubmit = () => {
    if (!isFormValid) {
      Alert.alert("Erreur", "Veuillez vérifier les champs.");
      return;
    }

    Alert.alert("Succès", "Mot de passe mis à jour !");
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
              onPress={() => router.replace("/VerifyScreen")}
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
                source={require("@/assets/images/resetPas.png")}
                style={styles.topImage}
                resizeMode="contain"
              />

              <Text style={styles.title}>
                Réinitialiser le mot de passe
              </Text>

              <Text style={styles.subtitle}>
                Choisissez un mot de passe fort et sécurisé
              </Text>
            </View>

            {/* CURRENT */}
             

            {/* NEW */}
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
              {!isNewValid && touched.new
                ? "Min 6 caractères"
                : " "}
            </Text>

            {/* CONFIRM */}
            <TextInput
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#8e9aaf"
              style={[
                styles.input,
                !isConfirmValid &&
                  touched.confirm &&
                  styles.inputError,
              ]}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => markTouched("confirm")}
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
              <Text style={styles.buttonText}>
                Valider
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
    height: 150,
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
    width: 120,
    height: 120,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 13,
    color: "#6a7c94",
    textAlign: "center",
    marginTop: 10,
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

  button: {
    backgroundColor: "#1564c0",
    padding: 14,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 10,
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});