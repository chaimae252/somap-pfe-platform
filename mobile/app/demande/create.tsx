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
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";

/* ================= TYPES ================= */
type ServiceAnimMap = {
  [key: string]: Animated.Value;
};

type Urgence = "Faible" | "Normal" | "Urgent";

// ✅ Local service type (matches the static array)
type LocalService = {
  id: string;
  title: string;
  description: string;
  image: any; // require() returns a number
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

export default function CreateDemandeScreen() {
  const router = useRouter();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");
  const [urgence, setUrgence] = useState<Urgence>("Normal");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ Use the static services array directly
  const services: LocalService[] = [
    {
      id: "1",
      title: "Traitement de surface",
      description: "Solutions complètes de préparation, nettoyage et protection des surfaces métalliques industrielles.",
      image: require("../../assets/traitement-surface.jpg"),
    },
    {
      id: "2",
      title: "Sablage",
      description: "Nettoyage industriel des surfaces par projection d’abrasif à grande vitesse.",
      image: require("../../assets/sablage.jpg"),
    },
    {
      id: "3",
      title: "Métallisation",
      description: "Protection anticorrosion durable par application de couches métalliques.",
      image: require("../../assets/metallisation.jpg"),
    },
    {
      id: "4",
      title: "Peinture industrielle",
      description: "Application de peintures techniques pour industrie et bâtiment.",
      image: require("../../assets/peinture.jpg"),
    },
    {
      id: "5",
      title: "Traitement des eaux",
      description: "Installation et maintenance des systèmes de traitement des eaux industrielles.",
      image: require("../../assets/eaux.jpg"),
    },
    {
      id: "6",
      title: "Produits chimiques",
      description: "Fourniture de produits chimiques adaptés aux besoins industriels.",
      image: require("../../assets/chimique.jpg"),
    },
    {
      id: "7",
      title: "Travaux polyester",
      description: "Fabrication et réparation de cuves et structures en polyester.",
      image: require("../../assets/polyester.png"),
    },
  ];

  // Animations
  const objetAnim = useRef(new Animated.Value(0)).current;
  const descAnim = useRef(new Animated.Value(0)).current;
  const serviceAnims = useRef<ServiceAnimMap>({}).current;

  // ✅ Initialize animations when component mounts
  useEffect(() => {
    services.forEach(service => {
      if (!serviceAnims[service.title]) {
        serviceAnims[service.title] = new Animated.Value(0);
      }
    });
  }, []);

  const animateIn = (anim: Animated.Value) => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const animateOut = (anim: Animated.Value) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const animateServiceIn = (key: string) => {
    if (serviceAnims[key]) {
      Animated.timing(serviceAnims[key], {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  const animateServiceOut = (key: string) => {
    if (serviceAnims[key]) {
      Animated.timing(serviceAnims[key], {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Nous avons besoin d'accéder à vos photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected: SelectedImage[] = result.assets.map((asset: ImagePickerAsset) => ({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      }));
      setImages(prev => [...prev, ...selected]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      Alert.alert("Champ requis", "Veuillez sélectionner un service");
      return;
    }
    if (!objet.trim()) {
      Alert.alert("Champ requis", "Veuillez saisir un objet");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Champ requis", "Veuillez décrire votre demande");
      return;
    }

    setLoading(true);

    try {
      const clientId = await AsyncStorage.getItem("userId");
      if (!clientId) throw new Error("Utilisateur non connecté");

      // Note: serviceId must be sent as number (convert from string)
      const demandePayload = {
        description: description,
        clientId: parseInt(clientId),
        serviceId: parseInt(selectedServiceId), // ✅ convert to number
        urgence: urgence.toUpperCase(),
      };

      const demandeResponse = await api.post("/demandes", demandePayload);
      const demandeId = demandeResponse.data.id;

      if (images.length > 0) {
        for (const img of images) {
          const formData = new FormData();
          formData.append("file", {
            uri: img.uri,
            name: img.name,
            type: img.type,
          } as any);
          formData.append("demandeId", String(demandeId));

          await api.post("/images/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      Alert.alert("Succès", "Votre demande a été envoyée", [
        { text: "OK", onPress: () => router.replace("/home") },
      ]);
    } catch (error: any) {
      console.error("Submit error:", error);
      let message = "Une erreur est survenue";
      if (error.response?.data?.message) message = error.response.data.message;
      else if (error.message) message = error.message;
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ icon, title }: { icon: any; title: string }) => (
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={16} color="#1271B8" />
      <Text style={styles.label}>{title}</Text>
    </View>
  );

  const urgences = [
    { title: "Faible", color: "#49C69A", icon: "checkmark-circle", bg: "rgba(73,198,154,0.12)" },
    { title: "Normal", color: "#F2C94C", icon: "time", bg: "rgba(18,113,184,0.10)" },
    { title: "Urgent", color: "#EB5757", icon: "warning", bg: "rgba(235,87,87,0.12)" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back-ios" size={20} color="#1564c0" />
      </TouchableOpacity>

      <LinearGradient colors={["#0B1F3A", "#123C69", "#1B6CA8"]} style={styles.headerCard}>
        <Text style={styles.headerTitle}>Nouvelle Demande</Text>
        <Text style={styles.headerSubtitle}>Décrivez votre besoin industriel</Text>
      </LinearGradient>

      {/* Services - using static array */}
      <View style={styles.section}>
        <Label icon="layers-outline" title="Type de service" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {services.map(service => {
            const active = selectedServiceId === service.id;
            return (
              <Animated.View
                key={service.id}
                style={{
                  transform: [
                    {
                      scale: serviceAnims[service.title]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05],
                      }) ?? 1,
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedServiceId(service.id)}
                  onPressIn={() => animateServiceIn(service.title)}
                  onPressOut={() => animateServiceOut(service.title)}
                  style={[styles.serviceCardHorizontal, { borderColor: active ? "#1271b8" : "#E8EEF5" }]}
                >
                  <Image source={service.image} style={styles.serviceImage} />
                  <Text style={[styles.serviceTextHorizontal, { color: active ? "#1271b8" : "#1B2430" }]}>
                    {service.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Objet */}
      <View style={styles.section}>
        <Label icon="document-text-outline" title="Objet" />
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor: objetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#E6ECF2", "#1271B8"],
              }),
            },
          ]}
        >
          <Ionicons name="document-text-outline" size={20} color="#8A94A6" />
          <TextInput
            placeholder="Ex: Réparation cabine peinture"
            placeholderTextColor="#9AA4B2"
            style={styles.input}
            value={objet}
            onChangeText={setObjet}
            onFocus={() => animateIn(objetAnim)}
            onBlur={() => animateOut(objetAnim)}
          />
        </Animated.View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Label icon="create-outline" title="Description" />
        <Animated.View
          style={[
            styles.textAreaWrapper,
            {
              borderColor: descAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#E6ECF2", "#1271B8"],
              }),
            },
          ]}
        >
          <TextInput
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholder="Décrivez votre demande..."
            placeholderTextColor="#9AA4B2"
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            onFocus={() => animateIn(descAnim)}
            onBlur={() => animateOut(descAnim)}
          />
        </Animated.View>
      </View>

      {/* Pièces jointes */}
      <View style={styles.section}>
        <Label icon="cloud-upload-outline" title="Pièces jointes" />
        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Ionicons name="cloud-upload-outline" size={34} color="#1271B8" />
          <Text style={styles.uploadTitle}>Ajouter des images</Text>
          <Text style={styles.uploadSubtitle}>JPG, PNG ou PDF</Text>
        </TouchableOpacity>
        {images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imagePreview}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                  <Ionicons name="close-circle" size={24} color="#EB5757" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Urgence */}
      <View style={styles.section}>
        <Label icon="warning-outline" title="Niveau d'urgence" />
        <View style={styles.urgenceRow}>
          {urgences.map(item => {
            const active = urgence === item.title;
            return (
              <TouchableOpacity
                key={item.title}
                onPress={() => setUrgence(item.title as Urgence)}
                style={[styles.urgenceChip, { backgroundColor: active ? item.color : item.bg }]}
              >
                <Ionicons name={item.icon as any} size={16} color={active ? "#fff" : item.color} />
                <Text style={[styles.urgenceText, { color: active ? "#fff" : item.color }]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={{ marginHorizontal: 50, marginTop: 25 }}
        onPress={handleSubmit}
        disabled={loading}
      >
        <LinearGradient colors={["#1271b8", "#1271b8"]} style={styles.submitButton}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Envoyer la demande</Text>}
          {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles remain identical to your original (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  backButton: { position: "absolute", top: 40, left: 18, zIndex: 10, padding: 4 },
  headerCard: {
    marginHorizontal: 20,
    marginTop: 65,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 28,
    alignItems: "center",
    elevation: 6,
  },
  headerTitle: { color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 14, textAlign: "center" },
  section: { marginTop: 24, paddingHorizontal: 20 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  label: { fontSize: 15, fontWeight: "600", letterSpacing: 0.5, color: "#6B7A90", marginLeft: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: "#E6ECF2",
    shadowColor: "#1271B8",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 15, color: "#1B2430" },
  textAreaWrapper: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6ECF2",
    shadowColor: "#1271B8",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  textArea: { minHeight: 140, fontSize: 15, color: "#1B2430" },
  uploadBox: {
    height: 160,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#BCD4EA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  uploadTitle: { marginTop: 12, fontSize: 15, fontWeight: "600", color: "#1B2430" },
  uploadSubtitle: { marginTop: 4, color: "#7B8794", fontSize: 12 },
  imagePreviewContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 },
  imagePreview: { width: 80, height: 80, borderRadius: 8, position: "relative" },
  previewImage: { width: "100%", height: "100%", borderRadius: 8 },
  removeImageBtn: { position: "absolute", top: -8, right: -8 },
  urgenceRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" },
  urgenceChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  urgenceText: { fontWeight: "700", fontSize: 13, letterSpacing: 0.3 },
  submitButton: { height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, marginTop: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  serviceCardHorizontal: {
    width: 200,
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 2,
    padding: 18,
    shadowColor: "#1271B8",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  serviceImage: { width: "100%", height: 85, borderRadius: 12, marginBottom: 8 },
  serviceTextHorizontal: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});