import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function VerifyScreen() {
  const router = useRouter();

  const [showStep2, setShowStep2] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [code, setCode] = useState(["", "", "", ""]);
  const inputs = useRef<TextInput[]>([]);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  /* ================= TIMER ================= */
  useEffect(() => {
  let interval: ReturnType<typeof setInterval>;

  if (showStep2 && timer > 0) {
    interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
  }

  if (timer === 0) {
    setCanResend(true);
  }

  return () => clearInterval(interval);
}, [timer, showStep2]);

  /* ================= ACTIONS ================= */
  const handleSendCode = () => {
    if (!email || !name) return;

    setShowStep2(true);
    setTimer(30);
    setCanResend(false);
  };

  const handleResend = () => {
    if (!canResend) return;

    setTimer(30);
    setCanResend(false);
  };

  const handleVerify = () => {
    const otp = code.join("");
    console.log("OTP:", otp);
    router.push("/ResetPasswordScreen");
    // 👉 navigate after success
    // router.push("/reset-password");
  };

  const handleChange = (text: string, index: number) => {
  const newCode = [...code];
  newCode[index] = text;
  setCode(newCode);

  if (text && index < inputs.current.length - 1) {
    inputs.current[index + 1]?.focus();
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>

          {/* 🔙 BACK BUTTON */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="#1564c0" />
          </TouchableOpacity>

          {/* 🔝 HEADER */}
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/logomob.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* 🧾 CARD */}
          <View style={styles.card}>

            {/* IMAGE + TITLE */}
            <View style={styles.cardHeader}>
              <Image
                source={require("@/assets/images/compte.png")}
                style={styles.topImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Vérification</Text>
            </View>

            {/* STEP 1 */}
            <TextInput
              placeholder="Nom"
              placeholderTextColor="#8e9aaf"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="Adresse email"
              placeholderTextColor="#8e9aaf"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={[
                styles.button,
                (!email || !name) && { opacity: 0.5 },
              ]}
              onPress={handleSendCode}
              disabled={!email || !name}
            >
              <Text style={styles.buttonText}>Envoyer le code</Text>
            </TouchableOpacity>

            {/* STEP 2 */}
            {showStep2 && (
              <>
                <Text style={styles.subtitle}>
                  Entrez le code envoyé à {email}
                </Text>

                {/* OTP */}
                <View style={styles.otpContainer}>
                  {code.map((c, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => {
                      if (ref) inputs.current[i] = ref;
                      }}
                      style={styles.otp}
                      maxLength={1}
                      keyboardType="numeric"
                      onChangeText={(text) => handleChange(text, i)}
                    />
                  ))}
                </View>

                {/* TIMER / RESEND */}
                {!canResend ? (
                  <Text style={styles.timer}>
                    Renvoyer dans {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resend}>Renvoyer le code</Text>
                  </TouchableOpacity>
                )}

                {/* VERIFY */}
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerify}
                >
                  <Text style={styles.buttonText}>Vérifier</Text>
                </TouchableOpacity>
              </>
            )}
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
    width: 120,
    height: 120,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  subtitle: {
    textAlign: "center",
    color: "#6a7c94",
    marginTop: 10,
  },

  input: {
    backgroundColor: "#f8fafd",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#8cd1b2",
    marginTop: 10,
    marginBottom: 14,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },

  otp: {
    width: 55,
    height: 55,
    backgroundColor: "#bcdfcf",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#bcdfcf",
  },

  timer: {
    textAlign: "center",
    color: "#1564c0",
    fontWeight: "600",
    marginBottom: 10,
  },

  resend: {
    textAlign: "center",
    color: "#1564c0",
    fontWeight: "600",
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#1564c0",
    padding: 14,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});