import React, {useState, useRef, useEffect} from "react";
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
    SafeAreaView,
    StatusBar,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {LinearGradient} from "expo-linear-gradient";
import {useRouter} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import {getAllServices} from "../../services/serviceService";
import { useLocalSearchParams } from "expo-router";

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

// ================= CUSTOM TOAST COMPONENT =================
type ToastType = "success" | "error";

const Toast = ({visible, message, type, onHide}: {
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
                Animated.spring(translateY, {toValue: 0, useNativeDriver: true, speed: 12}),
                Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
            ]).start();
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {toValue: -100, duration: 200, useNativeDriver: true}),
                    Animated.timing(fadeAnim, {toValue: 0, duration: 200, useNativeDriver: true}),
                ]).start(() => onHide());
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const bgColors = type === "success"
        ? ["#49C69A", "#2D9C7C"] as const
        : ["#EB5757", "#C0392B"] as const;
    const icon = type === "success" ? "checkmark-circle" : "alert-circle";

    return (
        <Animated.View style={[styles.toastContainer, {transform: [{translateY}], opacity: fadeAnim}]}>
            <LinearGradient colors={bgColors} style={styles.toastGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                <Ionicons name={icon} size={24} color="#fff"/>
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
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [objet, setObjet] = useState("");
    const [description, setDescription] = useState("");
    const [urgence, setUrgence] = useState<Urgence>("Normal");
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: "",
        type: "success",
    });
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [errors, setErrors] = useState({service: false, objet: false, description: false});

    useEffect(() => {
        if (selectedService && errors.service) {
            setErrors(prev => ({
                ...prev,
                service: false
            }));
        }
    }, [selectedService]);

    useEffect(() => {
        if (objet.trim() && errors.objet) setErrors(prev => ({...prev, objet: false}));
    }, [objet]);
    useEffect(() => {
        if (description.trim() && errors.description) setErrors(prev => ({...prev, description: false}));
    }, [description]);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setServicesLoading(true);

            const data = await getAllServices();

            setServices(data);

            if (serviceId && data.length > 0) {
                const selected = data.find(
                    (s: Service) => s.id === parseInt(serviceId as string)
                );

                if (selected) {
                    setSelectedService(selected);
                }
            }
        } catch (error) {
            console.log("Services error:", error);
        } finally {
            setServicesLoading(false);
        }
    };

    const objetAnim = useRef(new Animated.Value(0)).current;
    const descAnim = useRef(new Animated.Value(0)).current;
    const serviceAnims = useRef<ServiceAnimMap>({}).current;

    services.forEach(service => {
        if (!serviceAnims[service.titre]) {
            serviceAnims[service.titre] = new Animated.Value(0);
        }
    });

    const animateIn = (anim: Animated.Value) =>
        Animated.timing(anim, {toValue: 1, duration: 180, useNativeDriver: false}).start();
    const animateOut = (anim: Animated.Value) =>
        Animated.timing(anim, {toValue: 0, duration: 180, useNativeDriver: false}).start();
    const animateServiceIn = (key: string) => {
        if (serviceAnims[key]) Animated.timing(serviceAnims[key], {
            toValue: 1,
            duration: 180,
            useNativeDriver: false
        }).start();
    };
    const animateServiceOut = (key: string) => {
        if (serviceAnims[key]) Animated.timing(serviceAnims[key], {
            toValue: 0,
            duration: 180,
            useNativeDriver: false
        }).start();
    };

    const pickImages = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            setToast({visible: true, message: "Permission refusée – accès aux photos nécessaire", type: "error"});
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
            setToast({visible: true, message: `${selected.length} image(s) ajoutée(s)`, type: "success"});
        }
    };

    const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

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
        setLoading(true);
        try {
            const clientId = await AsyncStorage.getItem("userId");
            if (!clientId) throw new Error("Utilisateur non connecté");

            const demandePayload = {
                objet: objet.trim(),
                description: description.trim(),
                clientId: parseInt(clientId),
                serviceId: selectedService!.id,
                urgence: urgence.toUpperCase(),
            };

            const demandeResponse = await api.post("/demandes", demandePayload);
            const demandeId = demandeResponse.data.id;

            if (images.length > 0) {
                for (const img of images) {
                    const formData = new FormData();
                    formData.append("file", {uri: img.uri, name: img.name, type: img.type} as any);
                    formData.append("demandeId", String(demandeId));
                    await api.post("/images/upload", formData, {headers: {"Content-Type": "multipart/form-data"}});
                }
            }

            setToast({visible: true, message: "Demande envoyée avec succès !", type: "success"});
            setTimeout(() => router.replace("/(tabs)/home"), 2500);
        } catch (error: any) {
            console.error("Submit error:", error);
            let message = "Une erreur est survenue lors de l'envoi.";
            if (error.response?.data?.message) message = error.response.data.message;
            else if (error.message) message = error.message;
            setToast({visible: true, message, type: "error"});
        } finally {
            setLoading(false);
        }
    };

    const Label = ({icon, title}: { icon: any; title: string }) => (
        <View style={styles.labelRow}>
            <Ionicons name={icon} size={16} color="#1271B8"/>
            <Text style={styles.label}>{title}</Text>
        </View>
    );

    const urgences = [
        {title: "Faible", color: "#49C69A", icon: "checkmark-circle", bg: "rgba(73,198,154,0.12)"},
        {title: "Normal", color: "#F2C94C", icon: "time", bg: "rgba(18,113,184,0.10)"},
        {title: "Urgent", color: "#EB5757", icon: "warning", bg: "rgba(235,87,87,0.12)"},
    ];

    const normalize = (url?: string | null) => {
        if (!url) return null;

        // already full URL
        if (url.startsWith("http")) return url;

        // backend relative path
        if (url.startsWith("/")) {
            return `http://192.168.137.1:8080${url}`;
        }

        return null;
    };

    const getSafeServiceImage = (images?: { imageUrl: string | null }[]) => {
        if (!images || images.length === 0) {
            return "https://via.placeholder.com/400";
        }

        // 1. PRIORITY: real service images (/images/)
        const imagesFolder = images.find(img =>
            img?.imageUrl?.includes("/images/")
        );

        if (imagesFolder?.imageUrl) {
            return normalize(imagesFolder.imageUrl) ?? "https://via.placeholder.com/400";
        }

        // 2. fallback: uploads (less important)
        const uploads = images.find(img =>
            img?.imageUrl?.includes("/uploads/")
        );

        if (uploads?.imageUrl) {
            return normalize(uploads.imageUrl) ?? "https://via.placeholder.com/400";
        }

        // 3. last fallback: anything valid
        const anyValid = images.find(img => img?.imageUrl);

        return normalize(anyValid?.imageUrl) ?? "https://via.placeholder.com/400";
    };

    return (
        <View style={{flex: 1, backgroundColor: "#F4F7FB"}}>
            <StatusBar barStyle="light-content" backgroundColor="#0d2d5e" translucent={false}/>

            <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 120}}>

                {/* ── HEADER — matches ServicesScreen & HomeScreen ── */}
                <LinearGradient
                    colors={["#0d2d5e", "#1271b8", "#2D9C7C"] as const}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.header}
                >
                    {/* Decorative blobs */}
                    <View style={styles.blob1}/>
                    <View style={styles.blob2}/>

                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={24} color="#fff"/>
                        </TouchableOpacity>

                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headerLabel}>SOMAP & SERVICE</Text>
                            <Text style={styles.headerTitle}>Nouvelle Demande</Text>
                            <Text style={styles.headerSubtitle}>Décrivez votre besoin industriel</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Services */}
                <View style={styles.section}>
                    <Label icon="layers-outline" title="Type de service"/>

                    {errors.service && (
                        <Text style={styles.errorText}>
                            Veuillez sélectionner un service
                        </Text>
                    )}

                    {servicesLoading ? (
                        <ActivityIndicator
                            size="small"
                            color="#1271B8"
                            style={{marginTop: 20}}
                        />
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >
                            {services.map((service) => {

                                const active = selectedService?.id === service.id;

                                const imageUri = getSafeServiceImage(service.images);

                                return (
                                    <Animated.View
                                        key={service.id}
                                        style={{
                                            transform: [
                                                {
                                                    scale:
                                                        serviceAnims[
                                                            service.titre
                                                            ]?.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [1, 1.05],
                                                        }) ?? 1,
                                                },
                                            ],
                                        }}
                                    >
                                        <View
                                            style={[
                                                styles.serviceCardHorizontal,
                                                {
                                                    borderColor: active
                                                        ? "#1271b8"
                                                        : "#E8EEF5",
                                                },
                                            ]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                onPress={() => setSelectedService(service)}
                                                onPressIn={() =>
                                                    animateServiceIn(service.titre)
                                                }
                                                onPressOut={() =>
                                                    animateServiceOut(service.titre)
                                                }
                                                style={styles.serviceSelectArea}
                                            >
                                                <Image
                                                    source={{uri: imageUri}}
                                                    style={styles.serviceImage}
                                                />

                                                <Text
                                                    style={[
                                                        styles.serviceTextHorizontal,
                                                        {
                                                            color: active
                                                                ? "#1271b8"
                                                                : "#1B2430",
                                                        },
                                                    ]}
                                                >
                                                    {service.titre}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.detailsButton}
                                                onPress={() =>
                                                    router.push(
                                                        `/service/${service.id}` as any
                                                    )
                                                }
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="information-circle-outline"
                                                    size={20}
                                                    color="#1271B8"
                                                />

                                                <Text style={styles.detailsText}>
                                                    Détails
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                {/* Objet */}
                <View style={styles.section}>
                    <Label icon="document-text-outline" title="Objet"/>
                    <Animated.View
                        style={[
                            styles.inputWrapper,
                            {
                                borderColor: objetAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [errors.objet ? "#EB5757" : "#E6ECF2", "#1271B8"],
                                }),
                            },
                        ]}
                    >
                        <Ionicons name="document-text-outline" size={20} color="#8A94A6"/>
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
                    {errors.objet && <Text style={styles.errorText}>L&apos;objet est requis</Text>}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Label icon="create-outline" title="Description"/>
                    <Animated.View
                        style={[
                            styles.textAreaWrapper,
                            {
                                borderColor: descAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [errors.description ? "#EB5757" : "#E6ECF2", "#1271B8"],
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
                    {errors.description && <Text style={styles.errorText}>La description est requise</Text>}
                </View>

                {/* Images */}
                <View style={styles.section}>
                    <Label icon="cloud-upload-outline" title="Pièces jointes"/>
                    <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
                        <Ionicons name="cloud-upload-outline" size={34} color="#1271B8"/>
                        <Text style={styles.uploadTitle}>Ajouter des images</Text>
                        <Text style={styles.uploadSubtitle}>JPG, PNG ou PDF</Text>
                    </TouchableOpacity>
                    {images.length > 0 && (
                        <View style={styles.imagePreviewContainer}>
                            {images.map((img, idx) => (
                                <View key={idx} style={styles.imagePreview}>
                                    <Image source={{uri: img.uri}} style={styles.previewImage}/>
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                                        <Ionicons name="close-circle" size={24} color="#EB5757"/>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    {images.length === 0 && <Text style={styles.hintText}>Aucune image sélectionnée (optionnel)</Text>}
                </View>

                {/* Urgence */}
                <View style={styles.section}>
                    <Label icon="warning-outline" title="Niveau d'urgence"/>
                    <View style={styles.urgenceRow}>
                        {urgences.map((item) => {
                            const active = urgence === item.title;
                            return (
                                <TouchableOpacity
                                    key={item.title}
                                    onPress={() => setUrgence(item.title as Urgence)}
                                    style={[styles.urgenceChip, {backgroundColor: active ? item.color : item.bg}]}
                                >
                                    <Ionicons name={item.icon as any} size={16} color={active ? "#fff" : item.color}/>
                                    <Text style={[styles.urgenceText, {color: active ? "#fff" : item.color}]}>
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
                    style={{marginHorizontal: 50, marginTop: 25}}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient colors={["#1271b8", "#1271b8"] as const} style={styles.submitButton}>
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <Text style={styles.submitText}>Envoyer la demande</Text>}
                        {!loading && <Ionicons name="arrow-forward" size={20} color="#fff"/>}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({...prev, visible: false}))}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: "#F4F7FB"},

    // ── HEADER — matches ServicesScreen & HomeScreen ──────────────
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 35,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: "hidden",
        marginBottom: 8,
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
        alignItems: "flex-start",
        zIndex: 2,
        gap: 8,
    },
    backButton: {
        padding: 4,
        marginTop: 20,
        marginRight: 4,
    },
    headerTextBlock: {
        flex: 1,
    },
    headerLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: "500",
        marginBottom: 6,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    headerSubtitle: {
        color: "rgba(255,255,255,0.82)",
        fontSize: 13,
        marginTop: 4,
    },

    // ── FORM ──────────────────────────────────────────────────────
    section: {marginTop: 24, paddingHorizontal: 20},
    labelRow: {flexDirection: "row", alignItems: "center", marginBottom: 10},
    label: {fontSize: 15, fontWeight: "600", letterSpacing: 0.5, color: "#6B7A90", marginLeft: 8},
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
        shadowOffset: {width: 0, height: 6},
        shadowRadius: 10,
        shadowOpacity: 0.08,
        elevation: 2,
    },
    input: {flex: 1, marginLeft: 12, fontSize: 15, color: "#1B2430"},
    textAreaWrapper: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E6ECF2",
        shadowColor: "#1271B8",
        shadowOffset: {width: 0, height: 6},
        shadowRadius: 10,
        shadowOpacity: 0.08,
        elevation: 2,
    },
    textArea: {minHeight: 140, fontSize: 15, color: "#1B2430"},
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
    uploadTitle: {marginTop: 12, fontSize: 15, fontWeight: "600", color: "#1B2430"},
    uploadSubtitle: {marginTop: 4, color: "#7B8794", fontSize: 12},
    imagePreviewContainer: {flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8},
    imagePreview: {width: 80, height: 80, borderRadius: 8, position: "relative"},
    previewImage: {width: "100%", height: "100%", borderRadius: 8},
    removeImageBtn: {position: "absolute", top: -8, right: -8},
    urgenceRow: {flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap"},
    urgenceChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 999
    },
    urgenceText: {fontWeight: "700", fontSize: 13, letterSpacing: 0.3},
    submitButton: {
        height: 60,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
        marginTop: 10
    },
    submitText: {color: "#fff", fontSize: 16, fontWeight: "700"},
    serviceCardHorizontal: {
        width: 200,
        marginRight: 12,
        borderRadius: 18,
        backgroundColor: "#fff",
        borderWidth: 2,
        padding: 18,
        shadowColor: "#1271B8",
        shadowOffset: {width: 0, height: 6},
        shadowRadius: 10,
        shadowOpacity: 0.06,
        elevation: 2,
    },
    serviceSelectArea: {alignItems: "center"},
    serviceImage: {width: "100%", height: 85, borderRadius: 12, marginBottom: 8},
    serviceTextHorizontal: {fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 8},
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
    detailsText: {fontSize: 12, fontWeight: "600", color: "#1271B8"},
    errorText: {color: "#EB5757", fontSize: 12, marginTop: 4, marginLeft: 4},
    hintText: {color: "#8A94A6", fontSize: 12, marginTop: 8, textAlign: "center"},
    toastContainer: {position: "absolute", top: 60, left: 20, right: 20, zIndex: 1000},
    toastGradient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 60,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    toastText: {color: "#fff", fontSize: 15, fontWeight: "600", flex: 1},
});
