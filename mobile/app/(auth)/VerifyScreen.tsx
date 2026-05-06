import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const VerifyScreen = () => {
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  };

  const handleResend = () => setTimeLeft(300);

  return (
    <SafeAreaView style={styles.safeArea}>
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

          {/* ICON */}
          <View style={styles.cardHeader}>
            <Image
              source={require("@/assets/images/compte.png")}
              style={styles.icon}
              resizeMode="contain"
            />

            <Text style={styles.title}>Verify Account</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your account
            </Text>

            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          </View>

          {/* TABS */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "email" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("email")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "email" && styles.tabTextActive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "phone" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("phone")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "phone" && styles.tabTextActive,
                ]}
              >
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* INPUT */}
          <View style={styles.inputRow}>
            <TextInput
              placeholder={activeTab === "email" ? "Email" : "Phone"}
              placeholderTextColor="#8e9aaf"
              style={styles.input}
            />
            <TouchableOpacity style={styles.sendBtn}>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* RESEND */}
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resend}>Resend code</Text>
          </TouchableOpacity>

          {/* OTP */}
          <View style={styles.otpContainer}>
            {code.map((v, i) => (
              <TextInput
                key={i}
                style={styles.otp}
                maxLength={1}
                keyboardType="numeric"
                value={v}
                onChangeText={(t) => handleChange(t, i)}
              />
            ))}
          </View>

          {/* BUTTON */}
          <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace("/ResetPasswordScreen")}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

export default VerifyScreen;

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
    marginBottom: 10,
  },

  icon: {
    width: 170,
    height: 170,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
  },

  subtitle: {
    fontSize: 13,
    color: "#6a7c94",
    textAlign: "center",
    marginTop: 10,
  },

  timer: {
    marginTop: 10,
    color: "#1564c0",
    fontWeight: "600",
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "#20de84",
    marginHorizontal: 8,
  },

  tabActive: {
    backgroundColor: "#1564c0",
  },

  tabText: {
    color: "#fff",
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#fff",
  },

  inputRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafd",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e9f2",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    height: 45,
  },

  sendBtn: {
    backgroundColor: "#20de84",
    padding: 10,
    borderRadius: 20,
  },

  resend: {
    textAlign: "center",
    marginVertical: 12,
    color: "#1564c0",
    fontWeight: "600",
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },

  otp: {
    width: 45,
    height: 45,
    backgroundColor: "#bcdfcf",
    borderRadius: 10,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#bcdfcf",
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