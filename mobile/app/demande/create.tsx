import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  ActivityIndicator,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import api from "@/services/api";
import { getAllServices } from "../../services/serviceService";

/* ================= TYPES ================= */

type ServiceAnimMap = {
  [key: string]: Animated.Value;
};

type Urgence = "Faible" | "Normal" | "Urgent";

type Service = {
  id: number;
  titre: string;
  description: string;
  images: {
    imageUrl: string;
  }[];
};

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

type ImagePickerAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

type ToastType = "success" | "error";

/* ================= TOAST ================= */

const Toast = ({
  visible,
  message,
  type,
  onHide,
}: {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColors =
    type === "success"
      ? (["#49C69A", "#2D9C7C"] as const)
      : (["#EB5757", "#C0392B"] as const);

  const icon =
    type === "success" ? "checkmark-circle" : "alert-circle";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={bgColors}
        style={styles.toastGradient}
      >
        <Ionicons name={icon} size={24} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function CreateDemandeScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");

  const [urgence, setUrgence] =
    useState<Urgence>("Normal");

  const [images, setImages] = useState<SelectedImage[]>([]);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });

  const [errors, setErrors] = useState({
    service: false,
    objet: false,
    description: false,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService && errors.service) {
      setErrors((prev) => ({
        ...prev,
        service: false,
      }));
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      setServicesLoading(true);

      const data = await getAllServices();

      setServices(data);

      if (serviceId && data.length > 0) {
        const selected = data.find(
          (s: Service) =>
            s.id === parseInt(serviceId as string)
        );

        if (selected) {
          setSelectedService(selected);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setServicesLoading(false);
    }
  };

  /* ================= PDF ================= */

  const generateDraftHTML = () => {
    return `
      <html>
      <body style="font-family: Arial; padding: 30px;">
        <h1>Nouvelle demande</h1>

        <p><strong>Service :</strong> ${
          selectedService?.titre || "-"
        }</p>

        <p><strong>Objet :</strong> ${objet}</p>

        <p><strong>Description :</strong> ${description}</p>

        <p><strong>Urgence :</strong> ${urgence}</p>

        <p><strong>Images :</strong> ${images.length}</p>
      </body>
      </html>
    `;
  };

  const handleDownloadDraft = async () => {
    try {
      setProcessing(true);

      const html = generateDraftHTML();

      const { uri } = await Print.printToFileAsync({
        html,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintDraft = async () => {
    try {
      setProcessing(true);

      await Print.printAsync({
        html: generateDraftHTML(),
      });
    } catch (error) {
      console.log(error);
    } finally {
      setProcessing(false);
    }
  };

  /* ================= IMAGE PICKER ================= */

  const pickImages = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

    if (!result.canceled) {
      const selected: SelectedImage[] =
        result.assets.map(
          (asset: ImagePickerAsset) => ({
            uri: asset.uri,
            name:
              asset.fileName ||
              `image_${Date.now()}.jpg`,
            type:
              asset.mimeType || "image/jpeg",
          })
        );

      setImages((prev) => [...prev, ...selected]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* ================= SUBMIT ================= */

  const validateForm = () => {
    let isValid = true;

    const newErrors = {
      service: false,
      objet: false,
      description: false,
    };

    if (!selectedService) {
      newErrors.service = true;
      isValid = false;
    }

    if (!objet.trim()) {
      newErrors.objet = true;
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = true;
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const clientId =
        await AsyncStorage.getItem("userId");

      if (!clientId) {
        throw new Error("Utilisateur non connecté");
      }

      const payload = {
        objet: objet.trim(),
        description: description.trim(),
        clientId: parseInt(clientId),
        serviceId: selectedService!.id,
        urgence: urgence.toUpperCase(),
      };

      const demandeResponse = await api.post(
        "/demandes",
        payload
      );

      const demandeId = demandeResponse.data.id;

      if (images.length > 0) {
        for (const img of images) {
          const formData = new FormData();

          formData.append("file", {
            uri: img.uri,
            name: img.name,
            type: img.type,
          } as any);

          formData.append(
            "demandeId",
            String(demandeId)
          );

          await api.post(
            "/images/upload",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );
        }
      }

      setToast({
        visible: true,
        message:
          "Demande envoyée avec succès",
        type: "success",
      });

      setTimeout(() => {
        router.replace("/home");
      }, 2000);
    } catch (error: any) {
      console.log(error);

      setToast({
        visible: true,
        message: "Erreur lors de l'envoi",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >
        <LinearGradient
          colors={[
            "#0d2d5e",
            "#1271b8",
            "#2D9C7C",
          ]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color="#fff"
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                Nouvelle Demande
              </Text>

              <Text style={styles.headerSubtitle}>
                Décrivez votre besoin
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDownloadDraft}
            >
              <Ionicons
                name="download-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePrintDraft}
            >
              <Ionicons
                name="print-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* YOUR UI HERE */}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() =>
          setToast((prev) => ({
            ...prev,
            visible: false,
          }))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 35,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },

  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },

  toastGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 60,
  },

  toastText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
});