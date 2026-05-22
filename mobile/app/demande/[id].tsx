import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Share,
  Modal,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import api from "@/services/api";
import { Alert } from "react-native";

type Demande = {
  id: number;
  objet: string;
  description: string;
  statut: string;
  urgence: "FAIBLE" | "NORMAL" | "URGENT";
  dateCreation: string;
  serviceId: number;
};

type Service = {
  id: number;
  titre: string;
  description: string;
};

type ImageAttachment = {
  id: number;
  imageUrl: string;     // consistent with edit screen
};

// Base URL for image prefix (same as in EditDemandeScreen)
const BASE_URL = "http://192.168.1.119:8080"; // replace with your actual base URL

const getImageUrl = (url?: string | null) => {
  if (!url) return null;
  const clean = url.trim();
  if (clean.startsWith("http")) return clean;
  return `${BASE_URL}${clean}`;
};

const getUrgenceInfo = (urgence: string) => {
  switch (urgence) {
    case "URGENT": return { label: "Urgent", color: "#EB5757", bg: "#FEF1F1", icon: "warning" };
    case "NORMAL": return { label: "Normal", color: "#F2C94C", bg: "#FFF8E7", icon: "time" };
    case "FAIBLE": return { label: "Faible", color: "#49C69A", bg: "#E6F7F0", icon: "checkmark-circle" };
    default: return { label: urgence, color: "#8A94A6", bg: "#F0F2F5", icon: "help" };
  }
};

const getStatusInfo = (statut: string) => {
  switch (statut) {
    case "EN_ATTENTE": return { label: "En attente", color: "#FF8C00", bg: "#FFF3E0" };
    case "VALIDEE": return { label: "Validée", color: "#49C69A", bg: "#E6F7F0" };
    case "REJETEE": return { label: "Rejetée", color: "#EB5757", bg: "#FEF1F1" };
    default: return { label: statut, color: "#8A94A6", bg: "#F0F2F5" };
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Non définie";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DemandeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [demande, setDemande] = useState<Demande | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchDemande();
  }, [id]);

  const fetchDemande = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/demandes/${id}`);
      const data = res.data;
      setDemande(data);
      if (data.serviceId) {
        const serviceRes = await api.get(`/services/${data.serviceId}`);
        setService(serviceRes.data);
      }
      // Fetch images – adapt to the endpoint used in edit screen
      const imagesRes = await api.get(`/images`);
      const filtered = imagesRes.data.filter(
        (img: any) => img.demandeId === Number(id) && img.imageUrl
      );
      setImages(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateDemandeHTML = () => {
    if (!demande || !service) return "";
    const urgencyLabel = getUrgenceInfo(demande.urgence).label;
    const statusLabel = getStatusInfo(demande.statut).label;
    const imagesHtml =
      images.length > 0
        ? `<div><strong>Pièces jointes :</strong><br/>${images
            .map(
              (img) =>
                `<img src="${getImageUrl(img.imageUrl)}" style="max-width:200px; margin:5px;" />`
            )
            .join("")}</div>`
        : "";
    return `
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; }
          h1 { color: #1271B8; }
          .label { font-weight: bold; width: 120px; display: inline-block; }
        </style>
      </head>
      <body>
        <h1>${demande.objet}</h1>
        <p><strong>N° demande :</strong> #${demande.id}</p>
        <p><strong>Service :</strong> ${service.titre}</p>
        <p><strong>Description :</strong> ${demande.description}</p>
        <p><strong>Urgence :</strong> ${urgencyLabel}</p>
        <p><strong>Statut :</strong> ${statusLabel}</p>
        <p><strong>Date de création :</strong> ${formatDate(demande.dateCreation)}</p>
        ${imagesHtml}
      </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!demande || !service) return;
    setProcessing(true);
    try {
      const html = generateDemandeHTML();
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Enregistrer la demande",
        });
      } else {
        Alert.alert("Erreur", "Le partage n'est pas disponible");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de générer le PDF");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = async () => {
    if (!demande || !service) return;
    setProcessing(true);
    try {
      const html = generateDemandeHTML();
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'imprimer");
    } finally {
      setProcessing(false);
    }
  };

  const handleShareText = async () => {
    if (!demande || !service) return;
    await Share.share({
      message: `Demande #${demande.id}\nService: ${service.titre}\nObjet: ${demande.objet}\nDescription: ${demande.description}\nUrgence: ${demande.urgence}\nStatut: ${demande.statut}\nDate: ${formatDate(demande.dateCreation)}`,
    });
  };

  if (loading)
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1271B8" />
      </SafeAreaView>
    );
  if (!demande)
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#EB5757" />
        <Text style={styles.errorText}>Demande introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  const urgence = getUrgenceInfo(demande.urgence);
  const status = getStatusInfo(demande.statut);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#0d2d5e", "#1271b8", "#2D9C7C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleDownload} style={styles.iconButton} disabled={processing}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePrint} style={styles.iconButton} disabled={processing}>
              <Ionicons name="print-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/demande/edit/${demande.id}`)} style={styles.iconButton}>
              <Ionicons name="pencil-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerTitle}>{demande.objet}</Text>
        <View style={styles.statusBadgeHeader}>
          <View style={[styles.badgeRow, { backgroundColor: urgence.bg }]}>
            <Ionicons name={urgence.icon as any} size={14} color={urgence.color} />
            <Text style={[styles.badgeText, { color: urgence.color }]}>{urgence.label}</Text>
          </View>
          <View style={[styles.badgeRow, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.unifiedCard}>
          {/* Service */}
          {service && (
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={22} color="#1271B8" />
                <Text style={styles.sectionTitle}>Service concerné</Text>
              </View>
              <Text style={styles.serviceName}>{service.titre}</Text>
              <Text style={styles.serviceDesc}>{service.description}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={22} color="#1271B8" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{demande.description}</Text>
          </View>

          {/* Images – displayed exactly like in EditDemandeScreen */}
          {images.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.cardSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="images-outline" size={22} color="#1271B8" />
                  <Text style={styles.sectionTitle}>Pièces jointes ({images.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {images.map((img) => {
                    const fullUrl = getImageUrl(img.imageUrl);
                    return (
                      <TouchableOpacity
                        key={img.id}
                        onPress={() => {
                          setSelectedImage(fullUrl);
                          setLightboxVisible(true);
                        }}
                        activeOpacity={0.9}
                      >
                        <View style={styles.imageItem}>
                          <Image source={{ uri: fullUrl ?? undefined }} style={styles.imagePreview} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Informations */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={22} color="#1271B8" />
              <Text style={styles.sectionTitle}>Informations</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#6B7A90" />
              <Text style={styles.infoText}>Créée le {formatDate(demande.dateCreation)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={18} color="#6B7A90" />
              <Text style={styles.infoText}>N° Demande : #{demande.id}</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Full‑screen lightbox modal */}
      <Modal visible={lightboxVisible} transparent animationType="fade">
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setLightboxVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
  errorText: { fontSize: 16, color: "#EB5757", marginTop: 12 },
  backButton: { marginTop: 20, backgroundColor: "#1271B8", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 40 },
  backButtonText: { color: "#fff", fontWeight: "600" },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(77,184,232,0.16)",
  },
  blob2: {
    position: "absolute",
    bottom: 16,
    left: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(73,198,154,0.10)",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButtonHeader: { padding: 4 },
  headerActions: { flexDirection: "row", gap: 16 },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: "400", color: "#fff", marginBottom: 12 },
  statusBadgeHeader: { flexDirection: "row", gap: 12, alignSelf: "flex-start" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 40 },
  badgeText: { fontSize: 13, fontWeight: "600" },

  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  unifiedCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#0D2D5E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#EFF3F8",
  },
  cardSection: { marginVertical: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1B2430" },
  divider: { height: 1, backgroundColor: "#EFF3F8", marginVertical: 16 },
  serviceName: { fontSize: 17, fontWeight: "700", color: "#1271B8", marginBottom: 6 },
  serviceDesc: { fontSize: 14, lineHeight: 20, color: "#5A6B7F" },
  description: { fontSize: 15, lineHeight: 22, color: "#2C3E50" },

  // Image styling – exactly as in EditDemandeScreen
  imageScroll: { flexDirection: "row", marginTop: 8 },
  imageItem: { marginRight: 12, position: "relative" },
  imagePreview: { width: 100, height: 100, borderRadius: 12, backgroundColor: "#E8EEF5" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  infoText: { fontSize: 14, color: "#5A6B7F" },

  // Lightbox modal
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
  },
});