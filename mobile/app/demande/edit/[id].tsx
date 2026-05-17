import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  Animated,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import api from "@/services/api";
// At the top of the file, after imports
const TOAST_SUCCESS_GRADIENT = ["#49C69A", "#2D9C7C"] as const;
const TOAST_ERROR_GRADIENT = ["#EB5757", "#C0392B"] as const;
// ================= TYPES =================
type Urgence = "FAIBLE" | "NORMAL" | "URGENT";

type ServiceAnimMap = {
  [key: string]: Animated.Value;
};

type LocalService = {
  id: string;
  title: string;
  description: string;
  image: any;   // local require image (for display only)
};

type ImageItem = {
  id: number;
  imageUrl: string;
};

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
  isNew?: boolean;
};

// ================= CUSTOM TOAST (TOP) =================
type ToastType = "success" | "error";

const Toast = ({ visible, message, type, onHide }: { 
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
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 12 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  // Use constants instead of inline arrays
  const bgColors = type === "success" ? TOAST_SUCCESS_GRADIENT : TOAST_ERROR_GRADIENT;
  const icon = type === "success" ? "checkmark-circle" : "alert-circle";

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }], opacity: fadeAnim }]}
    >
      <LinearGradient colors={bgColors} style={styles.toastGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Ionicons name={icon} size={24} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function EditDemandeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Demande state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");
  const [urgence, setUrgence] = useState<Urgence>("NORMAL");
  const [existingImages, setExistingImages] = useState<ImageItem[]>([]);
  const [newImages, setNewImages] = useState<SelectedImage[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "success",
  });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ id?: number; uri?: string; index?: number; isNew?: boolean } | null>(null);

  // Services (static – same as create screen)
 const services: LocalService[] = [
  { id: "3", title: "Traitement de surface", description: "Solutions complètes...", image: require("../../../assets/traitement-surface.jpg") },
  { id: "4", title: "Sablage", description: "Nettoyage industriel...", image: require("../../../assets/sablage.jpg") },
  { id: "5", title: "Métallisation", description: "Protection anticorrosion...", image: require("../../../assets/metallisation.jpg") },
  { id: "6", title: "Peinture industrielle", description: "Application de peintures...", image: require("../../../assets/peinture.jpg") },
  { id: "7", title: "Traitement des eaux", description: "Installation et maintenance...", image: require("../../../assets/eaux.jpg") },
  { id: "8", title: "Produits chimiques", description: "Fourniture de produits...", image: require("../../../assets/chimique.jpg") },
  { id: "9", title: "Travaux polyester", description: "Fabrication et réparation...", image: require("../../../assets/polyester.png") },
];

  // Animations for service cards
  const serviceAnims = useRef<ServiceAnimMap>({}).current;
  useEffect(() => {
    services.forEach(service => {
      if (!serviceAnims[service.title]) serviceAnims[service.title] = new Animated.Value(0);
    });
  }, []);

  const animateServiceIn = (key: string) => {
    if (serviceAnims[key]) {
      Animated.timing(serviceAnims[key], { toValue: 1, duration: 180, useNativeDriver: false }).start();
    }
  };
  const animateServiceOut = (key: string) => {
    if (serviceAnims[key]) {
      Animated.timing(serviceAnims[key], { toValue: 0, duration: 180, useNativeDriver: false }).start();
    }
  };

  const BASE_URL = "http://192.168.1.119:8080"; // <-- replace with your backend IP

  const fetchDemande = async () => {
    try {
      const response = await api.get(`/demandes/${id}`);
      const data = response.data;
      setObjet(data.objet || "");
      setDescription(data.description || "");
      setUrgence(data.urgence || "NORMAL");
      setSelectedServiceId(data.serviceId?.toString() || null);

      // Fetch images and filter by demandeId
      const imagesRes = await api.get(`/images`);
      const filtered = imagesRes.data
        .filter((img: any) => img.demandeId === Number(id) && img.imageUrl)
        .map((img: any) => ({
          ...img,
          imageUrl: img.imageUrl.startsWith('http') ? img.imageUrl : `${BASE_URL}${img.imageUrl}`,
        }));
      setExistingImages(filtered);
    } catch (error) {
      console.error(error);
      setToast({ visible: true, message: "Erreur lors du chargement", type: "error" });
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDemande();
    }, [id])
  );

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setToast({ visible: true, message: "Permission refusée", type: "error" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const selected: SelectedImage[] = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
        isNew: true,
      }));
      setNewImages(prev => [...prev, ...selected]);
      setToast({ visible: true, message: `${selected.length} image(s) ajoutée(s)`, type: "success" });
    }
  };

  const confirmDeleteImage = (image: { id?: number; uri?: string; isNew?: boolean }, index?: number) => {
    setImageToDelete({ ...image, index, isNew: image.isNew });
    setDeleteModalVisible(true);
  };

  const deleteExistingImage = async (imageId: number) => {
    try {
      await api.delete(`/images/${imageId}`);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      setToast({ visible: true, message: "Image supprimée", type: "success" });
    } catch (error) {
      setToast({ visible: true, message: "Erreur lors de la suppression", type: "error" });
    }
  };

  const deleteNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setToast({ visible: true, message: "Image retirée", type: "success" });
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;
    if (imageToDelete.isNew && imageToDelete.index !== undefined) {
      deleteNewImage(imageToDelete.index);
    } else if (imageToDelete.id) {
      await deleteExistingImage(imageToDelete.id);
    }
    setDeleteModalVisible(false);
    setImageToDelete(null);
  };

  const handleUpdate = async () => {
    if (!selectedServiceId) {
      setToast({ visible: true, message: "Veuillez sélectionner un service", type: "error" });
      return;
    }
    if (!objet.trim() || !description.trim()) {
      setToast({ visible: true, message: "Veuillez remplir tous les champs", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Update demande fields (including serviceId)
      await api.put(`/demandes/${id}`, {
        objet: objet.trim(),
        description: description.trim(),
        urgence,
        serviceId: parseInt(selectedServiceId),
      });

      // 2. Upload new images
      for (const img of newImages) {
        const formData = new FormData();
        formData.append("file", {
          uri: img.uri,
          name: img.name,
          type: img.type,
        } as any);
        formData.append("demandeId", String(id));
        await api.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setNewImages([]);
      await fetchDemande();

      setToast({ visible: true, message: "Demande mise à jour avec succès", type: "success" });
      setTimeout(() => router.back(), 2000);
    } catch (error) {
      console.error("Update error:", error);
      setToast({ visible: true, message: "Erreur lors de la mise à jour", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const Label = ({ icon, title }: { icon: any; title: string }) => (
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={16} color="#1271B8" />
      <Text style={styles.label}>{title}</Text>
    </View>
  );

  const urgences = [
    { title: "FAIBLE", label: "Faible", color: "#49C69A", icon: "checkmark-circle", bg: "rgba(73,198,154,0.12)" },
    { title: "NORMAL", label: "Normal", color: "#F2C94C", icon: "time", bg: "rgba(18,113,184,0.10)" },
    { title: "URGENT", label: "Urgent", color: "#EB5757", icon: "warning", bg: "rgba(235,87,87,0.12)" },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1271B8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1564c0" />
        </TouchableOpacity>

        <LinearGradient colors={["#0B1F3A", "#123C69", "#1B6CA8"] as const} style={styles.headerCard}>
          <Text style={styles.headerTitle}>Modifier la demande</Text>
          <Text style={styles.headerSubtitle}>Modifiez votre besoin industriel</Text>
        </LinearGradient>

        {/* SERVICES CAROUSEL */}
        <View style={styles.section}>
          <Label icon="layers-outline" title="Type de service" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {services.map(service => {
              const active = selectedServiceId === service.id;
              return (
                <Animated.View
                  key={service.id}
                  style={{
                    transform: [{ scale: serviceAnims[service.title]?.interpolate({ inputRange: [0,1], outputRange: [1,1.05] }) ?? 1 }],
                  }}
                >
                  <View style={[styles.serviceCardHorizontal, { borderColor: active ? "#1271b8" : "#E8EEF5" }]}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setSelectedServiceId(service.id)}
                      onPressIn={() => animateServiceIn(service.title)}
                      onPressOut={() => animateServiceOut(service.title)}
                      style={styles.serviceSelectArea}
                    >
                      <Image source={service.image} style={styles.serviceImage} />
                      <Text style={[styles.serviceTextHorizontal, { color: active ? "#1271b8" : "#1B2430" }]}>
                        {service.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => router.push(`/service/${service.id}` as any)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="information-circle-outline" size={20} color="#1271B8" />
                      <Text style={styles.detailsText}>Détails</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        {/* OBJET */}
        <View style={styles.section}>
          <Label icon="document-text-outline" title="Objet" />
          <TextInput
            style={styles.input}
            placeholder="Objet de la demande"
            value={objet}
            onChangeText={setObjet}
          />
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Label icon="create-outline" title="Description" />
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Description détaillée"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* URGENCE */}
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
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* IMAGES */}
        <View style={styles.section}>
          <Label icon="cloud-upload-outline" title="Pièces jointes" />
          <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
            <Ionicons name="cloud-upload-outline" size={34} color="#1271B8" />
            <Text style={styles.uploadTitle}>Ajouter des images</Text>
            <Text style={styles.uploadSubtitle}>JPG, PNG ou PDF</Text>
          </TouchableOpacity>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <View style={styles.imageList}>
              <Text style={styles.imageSubtitle}>Images actuelles :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {existingImages.map((img) => (
                  <View key={img.id} style={styles.imageItem}>
                    <Image source={{ uri: img.imageUrl }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageIcon} onPress={() => confirmDeleteImage({ id: img.id })}>
                      <Ionicons name="trash-outline" size={20} color="#EB5757" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* New images */}
          {newImages.length > 0 && (
            <View style={styles.imageList}>
              <Text style={styles.imageSubtitle}>Nouvelles images :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {newImages.map((img, idx) => (
                  <View key={idx} style={styles.imageItem}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageIcon} onPress={() => confirmDeleteImage({ uri: img.uri, isNew: true }, idx)}>
                      <Ionicons name="close-circle" size={20} color="#EB5757" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={{ marginHorizontal: 50, marginTop: 25, marginBottom: 40 }}
          onPress={handleUpdate}
          disabled={submitting}
        >
          <LinearGradient colors={["#1271b8", "#1271b8"] as const} style={styles.submitButton}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enregistrer</Text>}
            {!submitting && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#fff", "#f8f9fc"] as const} style={styles.modalGradient}>
              <Ionicons name="alert-circle" size={60} color="#EB5757" />
              <Text style={styles.modalTitle}>Confirmation</Text>
              <Text style={styles.modalMessage}>Supprimer cette image ?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeleteConfirm}>
                  <LinearGradient colors={["#EB5757", "#C0392B"] as const} style={styles.deleteGradient}>
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

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
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E8EEF5",
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  urgenceRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" },
  urgenceChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  urgenceText: { fontWeight: "700", fontSize: 13, letterSpacing: 0.3 },
  submitButton: { height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, marginTop: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  uploadBox: {
    height: 120,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#BCD4EA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 8,
  },
  uploadTitle: { marginTop: 8, fontSize: 14, fontWeight: "600", color: "#1B2430" },
  uploadSubtitle: { marginTop: 2, color: "#7B8794", fontSize: 11 },
  imageList: { marginTop: 16 },
  imageSubtitle: { fontSize: 12, color: "#6B7A90", marginBottom: 8 },
  imageScroll: { flexDirection: "row" },
  imageItem: { marginRight: 12, position: "relative" },
  imagePreview: { width: 100, height: 100, borderRadius: 12, backgroundColor: "#E8EEF5" },
  removeImageIcon: { position: "absolute", top: -8, right: -8, backgroundColor: "#fff", borderRadius: 12, padding: 2 },
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
  serviceSelectArea: { alignItems: "center" },
  serviceImage: { width: "100%", height: 85, borderRadius: 12, marginBottom: 8 },
  serviceTextHorizontal: { fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(18,113,184,0.08)",
    gap: 4,
  },
  detailsText: { fontSize: 12, fontWeight: "600", color: "#1271B8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toastContainer: { position: "absolute", top: 60, left: 20, right: 20, zIndex: 1000 },
  toastGradient: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 60, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  toastText: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "80%", borderRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  modalGradient: { padding: 24, alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#1B2430", marginBottom: 12 },
  modalMessage: { fontSize: 16, color: "#6B7A90", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12, width: "100%" },
  modalButton: { flex: 1, borderRadius: 40, overflow: "hidden" },
  cancelButton: { backgroundColor: "#F0F2F5", paddingVertical: 12, alignItems: "center" },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7A90" },
  deleteButton: { overflow: "hidden" },
  deleteGradient: { paddingVertical: 12, alignItems: "center" },
  deleteButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});