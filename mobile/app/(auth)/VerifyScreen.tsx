import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  forgotPassword,
  verifyCode,
} from "@/services/authService";

export default function VerifyScreen() {
  const router = useRouter();

  const [showStep2, setShowStep2] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [focusedInput, setFocusedInput] = useState("");

  const [code, setCode] = useState(["", "", "", ""]);
  const inputs = useRef<TextInput[]>([]);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

const [message, setMessage] = useState({
  type: "",
  text: "",
});
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

  const handleSendCode = async () => {
  if (!email || !name) return;

  setMessage({
    type: "success",
    text: "Vérification en cours...",
  });

  try {
    await forgotPassword(email);

    setShowStep2(true);
    setTimer(30);
    setCanResend(false);

    setMessage({
      type: "success",
      text: "Code envoyé à votre email",
    });

  } catch (error) {
    setMessage({
      type: "error",
      text: "Impossible d'envoyer le code",
    });
  }
};

  const handleResend = async () => {
  if (!canResend) return;

  try {
    await forgotPassword(email);

    setTimer(30);
    setCanResend(false);

    setMessage({
      type: "success",
      text: "Code renvoyé",
    });

  } catch (error) {
    setMessage({
      type: "error",
      text: "Impossible de renvoyer le code",
    });
  }
};

  const handleVerify = async () => {
  const otp = code.join("");

  try {
    await verifyCode(email, otp);

    setMessage({
      type: "success",
      text: "Code valide",
    });

    setTimeout(() => {
      router.push({
        pathname: "/ResetPasswordScreen",
        params: { email },
      });
    }, 800);

  } catch (error) {
    setMessage({
      type: "error",
      text: "Code invalide",
    });
  }
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
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>

              {/* BACK */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
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

                {/* ICON */}
                <View style={styles.cardHeader}>
                   <Image
                    source={require("@/assets/images/verify-page.png")}
                    style={styles.verifyIcon}
                    resizeMode="contain"
                  />

                  <Text style={styles.title}>Vérification</Text>
                </View>

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
    <Text style={styles.messageText}>
      {message.text}
    </Text>
  </View>
)}

                {/* INPUT NAME */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "name" && styles.inputFocused,
                  ]}
                >
                  <MaterialIcons name="person" size={22} color="#8e9aaf" />
                  <TextInput
                    placeholder="Nom"
                    value={name}
                    onChangeText={setName}
                    style={styles.textInput}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput("")}
                  />
                </View>

                {/* INPUT EMAIL */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                >
                  <MaterialIcons name="email" size={22} color="#8e9aaf" />
                  <TextInput
                    placeholder="Adresse email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.textInput}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput("")}
                  />
                </View>

                {/* BUTTON */}
                <TouchableOpacity
                  style={[styles.button, (!email || !name) && { opacity: 0.5 }]}
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
                          value={c}
                          onChangeText={(text) => handleChange(text, i)}
                        />
                      ))}
                    </View>

                    {!canResend ? (
                      <Text style={styles.timer}>
                        Renvoyer dans {timer}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleResend}>
                        <Text style={styles.resend}>Renvoyer le code</Text>
                      </TouchableOpacity>
                    )}

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
  container: { flex: 1, paddingBottom: 40 },

  backButton: {
  position: "absolute",
  top: 40,
  left: 18,
  zIndex: 10,
  padding: 4,
},

  header: { alignItems: "center", paddingTop: 35 },
  logo: { width: 230, height: 100 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 35,
    margin: 20,
    padding: 26,
  },

  cardHeader: { alignItems: "center", marginBottom: 10 },

   
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1f2d3d",
  },
  messageBox: {
  marginTop: 10,
  marginBottom: 10,
  padding: 12,
  borderRadius: 12,
  alignItems: "center",
  alignSelf: "center",
  width: "75%",
},
verifyIcon: {
    width: 200,   // bigger
    height: 240,  // bigger
    marginBottom: -13, // minimal space below image
    marginTop: -50,
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

  textInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 15,
  },

  button: {
    backgroundColor: "#1564c0",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 15,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },

  subtitle: {
    textAlign: "center",
    marginVertical: 10,
    color: "#6c7a92",
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },

  otp: {
  width: 55,
  height: 55,
  backgroundColor: "#fff",      // optional cleaner look
  borderRadius: 14,
  textAlign: "center",
  fontSize: 20,
  fontWeight: "700",
  borderWidth: 2,
  borderColor: "#99b1cc",       
  color: "#1f2d3d",
},

  timer: {
    textAlign: "center",
    color: "#1564c0",
  },

  resend: {
    textAlign: "center",
  color: "#10b981",  
  fontWeight: "600",
  marginBottom: 10,
  },
});