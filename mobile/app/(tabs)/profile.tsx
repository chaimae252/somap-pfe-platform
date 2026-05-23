// app/(tabs)/profile.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  StatusBar, Animated, Dimensions, TextInput, ActivityIndicator,
  Modal, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import Theme from '../../constants/theme';
import { router, useFocusEffect } from 'expo-router';
import { getHomeStats } from '../../services/homeService';
import { updateClient } from '../../services/clientService';
import { changePassword } from '../../services/authService';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

const { colors, fonts, spacing, radius, shadows } = Theme;
const { width } = Dimensions.get('window');

// Colors
const BLUE = colors.blue;          // '#1B6CA8'
const BLUE_LIGHT = 'rgba(27,108,168,0.1)';
const GREEN_ACCENT = '#2D9C7C';    
const GREEN_LIGHT = 'rgba(45,156,124,0.1)';
const RED_DELETE = '#E53E3E';
const RED_LIGHT = 'rgba(229,62,62,0.1)';
const ORANGE_LOGOUT = '#F59E0B';      // New distinct color for logout
const ORANGE_LIGHT = 'rgba(245,158,11,0.1)';

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

  const bgColors = type === "success"
    ? ["#49C69A", GREEN_ACCENT] as const
    : ["#EB5757", "#C0392B"] as const;
  const icon = type === "success" ? "checkmark-circle" : "alert-circle";

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }], opacity: fadeAnim }]}
    >
      <LinearGradient
        colors={bgColors}
        style={styles.toastGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name={icon} size={24} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Animated counter
const AnimatedCounter = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedValue, { toValue: value, duration, useNativeDriver: false }).start();
    animatedValue.addListener(({ value: v }) => setDisplayValue(Math.floor(v)));
    return () => animatedValue.removeAllListeners();
  }, [value]);
  return <Text style={styles.statValue}>{displayValue}</Text>;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, setAuth, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ demandes: 0, projets: 0, notifications: 0 });
  const [lastLogin, setLastLogin] = useState<string>('Aujourd’hui');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "success",
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: user?.nom || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const [editForm, setEditForm] = useState({
    nom: user?.nom || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
  });

  // Delete account state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setEditForm({
        nom: user.nom || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
      });
      setContactForm(prev => ({
        ...prev,
        name: user.nom || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getHomeStats(user.id);
      setStats({
        demandes: data?.demandes || 0,
        projets: data?.projets || 0,
        notifications: data?.notifications || 0,
      });
      setLastLogin(new Date().toLocaleDateString('fr-FR'));
    } catch (error) {
      console.log('Error fetching stats:', error);
    }
  }, [user?.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const handleLogoutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.nom.trim()) {
      setToast({ visible: true, message: "Le nom est requis", type: "error" });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const clientData = {
        id: user!.id,
        nom: editForm.nom,
        telephone: editForm.telephone,
        adresse: editForm.adresse,
        email: user!.email,
      };

      const updatedClient = await updateClient(user!.id, clientData as any);
      const updatedUser = { ...user, ...updatedClient };
      if (setAuth && token) {
        setAuth(token, updatedUser);
      } else {
        useAuthStore.setState({ user: updatedUser });
      }
      setToast({ visible: true, message: "Informations mises à jour", type: "success" });
      setIsEditingInfo(false);
    } catch (error: any) {
      setToast({ visible: true, message: error?.response?.data?.message || "Impossible de mettre à jour", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword.trim()) {
      setToast({ visible: true, message: "Mot de passe actuel requis", type: "error" });
      return;
    }
    if (!passwordForm.newPassword.trim()) {
      setToast({ visible: true, message: "Nouveau mot de passe requis", type: "error" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setToast({ visible: true, message: "Le mot de passe doit contenir au moins 6 caractères", type: "error" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ visible: true, message: "Les mots de passe ne correspondent pas", type: "error" });
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setToast({ visible: true, message: "Le nouveau mot de passe doit être différent", type: "error" });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPasswordLoading(true);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setToast({ visible: true, message: "Mot de passe modifié avec succès", type: "success" });
      setPasswordModalVisible(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.log('Password change error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || "Impossible de modifier le mot de passe";
      setToast({ visible: true, message: errorMsg, type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const navigateTo = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(screen as any);
  };

  const handleCall = (phoneNumber: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const submitContactForm = async () => {
    if (!contactForm.subject.trim()) {
      setToast({ visible: true, message: "Veuillez saisir un objet", type: "error" });
      return;
    }
    if (!contactForm.message.trim()) {
      setToast({ visible: true, message: "Veuillez saisir votre message", type: "error" });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);

    try {
      await api.post('/contact', {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
      });

      setToast({ visible: true, message: "Message envoyé avec succès !", type: "success" });
      setContactForm({ ...contactForm, subject: '', message: '' });
    } catch (error: any) {
      console.log('Contact error:', error?.response?.data || error.message);
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Erreur lors de l'envoi. Vérifiez votre connexion ou réessayez.";
      setToast({ visible: true, message, type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      setToast({ visible: true, message: "Veuillez indiquer la raison de la suppression", type: "error" });
      return;
    }
    if (!deleteConfirmed) {
      setToast({ visible: true, message: "Vous devez confirmer la suppression", type: "error" });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleting(true);

    try {
      await api.delete(`/clients/${user!.id}`, { data: { reason: deleteReason } });
      setToast({ visible: true, message: "Votre compte a été supprimé définitivement", type: "success" });
      
      setDeleteModalVisible(false);
      setTimeout(async () => {
        await logout();
        router.replace('/(auth)/login');
      }, 1000);
    } catch (error: any) {
      console.log('Delete account error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.message || error?.response?.data || "Impossible de supprimer le compte. Réessayez plus tard.";
      setToast({ visible: true, message: errorMsg, type: "error" });
      setDeleting(false);
    }
  };

  if (!user) return null;

  const SOCIETY_PHONE = "+212 5XX XXX XXX";
  const SOCIETY_EMAIL = "somapservice11@gmail.com";
  const SOCIETY_ADDRESS = "N 460 bloc L Ouled Wjih Kenitra Maroc 14000";

  return (
    <LinearGradient colors={['#f0f4fa', '#ffffff']} style={styles.gradientContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0d2d5e" translucent={false} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} colors={[BLUE]} />}
        >
          {/* Header Card */}
          <LinearGradient
            colors={["#0B1F3A", "#1B6CA8", GREEN_ACCENT] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient colors={[colors.blueAccent, colors.cyan]} style={styles.avatarLarge}>
                <Text style={styles.avatarInitialLarge}>{user.nom?.charAt(0).toUpperCase() || 'C'}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.userNameWhite}>{user.nom || 'Client'}</Text>
            <Text style={styles.userEmailWhite}>{user.email || 'client@example.com'}</Text>
            <View style={styles.badgeRowWhite}>
              <Text style={styles.userRoleWhite}>{user.role || 'Client'}</Text>
              <View style={styles.lastLoginBadgeWhite}>
                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                <Text style={styles.lastLoginTextWhite}>Dernière connexion: {lastLogin}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/(tabs)/demandes')} activeOpacity={0.7}>
              <View style={styles.statIconBg}><Ionicons name="document-text-outline" size={24} color={BLUE} /></View>
              <AnimatedCounter value={stats.demandes} />
              <Text style={styles.statLabel}>Demandes</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/(tabs)/projets')} activeOpacity={0.7}>
              <View style={styles.statIconBg}><Ionicons name="briefcase-outline" size={24} color={BLUE} /></View>
              <AnimatedCounter value={stats.projets} />
              <Text style={styles.statLabel}>Projets</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/notifications')} activeOpacity={0.7}>
              <View style={styles.statIconBg}><Ionicons name="notifications-outline" size={24} color={BLUE} /></View>
              <AnimatedCounter value={stats.notifications} />
              <Text style={styles.statLabel}>Notifications</Text>
            </TouchableOpacity>
          </View>

          {/* Informations personnelles */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoCardTitle}>Informations personnelles</Text>
              {!isEditingInfo && (
                <TouchableOpacity onPress={() => setIsEditingInfo(true)} style={styles.editIconButton}>
                  <Ionicons name="pencil-outline" size={20} color={BLUE} />
                </TouchableOpacity>
              )}
            </View>

            {!isEditingInfo ? (
              <>
                {[
                  { icon: 'person-outline', label: 'Nom', value: user.nom || 'Non renseigné' },
                  { icon: 'call-outline', label: 'Téléphone', value: user.telephone || 'Non renseigné' },
                  { icon: 'location-outline', label: 'Adresse', value: user.adresse || 'Non renseignée' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <View style={styles.infoIconBg}>
                      <Ionicons name={item.icon as any} size={20} color={GREEN_ACCENT} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={styles.editInfoForm}>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Nom *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.nom}
                      onChangeText={(text) => setEditForm({ ...editForm, nom: text })}
                      placeholder="Votre nom"
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Téléphone</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.telephone}
                      onChangeText={(text) => setEditForm({ ...editForm, telephone: text })}
                      placeholder="Téléphone"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Adresse</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.adresse}
                      onChangeText={(text) => setEditForm({ ...editForm, adresse: text })}
                      placeholder="Adresse"
                    />
                  </View>
                </View>
                <View style={styles.editButtonsContainer}>
                  <TouchableOpacity onPress={() => setIsEditingInfo(false)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveEdit} disabled={loading} style={styles.primaryButton}>
                    <LinearGradient colors={[GREEN_ACCENT, "#49C69A"]} style={styles.primaryButtonGradient}>
                      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>Enregistrer</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Elegant Collapsible Form */}
          <View style={styles.formCard}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsFormExpanded(!isFormExpanded)}
              style={styles.formCardHeaderTouchable}
            >
              <View style={styles.formHeaderContent}>
                <View style={styles.formIconCircle}>
                  <Ionicons name="create-outline" size={24} color={BLUE} />
                </View>
                <View style={styles.formHeaderText}>
                  <Text style={styles.formCardTitle}>Envoyer un message</Text>
                  <Text style={styles.formHeaderSubtitle}>Formulaire de contact rapide</Text>
                </View>
                <View style={styles.chevronCircle}>
                  <Ionicons
                    name={isFormExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={BLUE}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {isFormExpanded && (
              <>
                <View style={styles.formDivider} />
                <Text style={styles.formSubtitle}>
                  Utilisez ce formulaire pour toute demande détaillée. Nous vous répondrons dans les plus brefs délais.
                </Text>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Nom</Text>
                  <TextInput
                    style={styles.formInput}
                    value={contactForm.name}
                    onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                    placeholder="Votre nom"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={contactForm.email}
                    onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
                    placeholder="Votre email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Objet *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={contactForm.subject}
                    onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
                    placeholder="Sujet de votre message"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Message *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={contactForm.message}
                    onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                    placeholder="Décrivez votre demande..."
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={submitContactForm}
                  disabled={sending}
                >
                  <LinearGradient colors={[BLUE, '#3B82F6']} style={styles.primaryButtonGradient}>
                    {sending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Envoyer le message</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Direct Contact Card */}
          <View style={styles.contactCard}>
            <View style={styles.contactCardHeader}>
              <LinearGradient colors={[BLUE, '#3B82F6']} style={styles.contactIconBg}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.contactCardTitle}>Nous contacter</Text>
            </View>

            <TouchableOpacity style={styles.contactRow} onPress={() => handleCall(SOCIETY_PHONE)} activeOpacity={0.7}>
              <View style={[styles.contactIconCircle, { backgroundColor: BLUE_LIGHT }]}>
                <Ionicons name="call-outline" size={22} color={BLUE} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Service Client</Text>
                <Text style={styles.contactValue}>{SOCIETY_PHONE}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => handleEmail(SOCIETY_EMAIL)} activeOpacity={0.7}>
              <View style={[styles.contactIconCircle, { backgroundColor: BLUE_LIGHT }]}>
                <Ionicons name="mail-outline" size={22} color={BLUE} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Support par email</Text>
                <Text style={styles.contactValue}>{SOCIETY_EMAIL}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.contactRow}>
              <View style={[styles.contactIconCircle, { backgroundColor: BLUE_LIGHT }]}>
                <Ionicons name="location-outline" size={22} color={BLUE} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Adresse</Text>
                <Text style={styles.contactValue}>{SOCIETY_ADDRESS}</Text>
              </View>
            </View>
            <Text style={styles.contactHint}>
              Appuyez sur le téléphone ou l&apos;email pour nous contacter directement.
            </Text>
          </View>

          {/* Account Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Paramètres du compte</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => setPasswordModalVisible(true)}>
              <LinearGradient colors={['rgba(18,113,184,0.1)', 'transparent']} style={styles.actionGradient}>
                <View style={styles.actionIcon}><Ionicons name="key-outline" size={22} color={BLUE} /></View>
                <Text style={styles.actionText}>Changer le mot de passe</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Delete Account Row - RED */}
            <TouchableOpacity style={[styles.actionRow, styles.deleteRow]} onPress={() => setDeleteModalVisible(true)}>
              <LinearGradient colors={['rgba(229,62,62,0.05)', 'transparent']} style={styles.actionGradient}>
                <View style={[styles.actionIcon, styles.deleteIcon]}><Ionicons name="trash-outline" size={22} color={RED_DELETE} /></View>
                <Text style={[styles.actionText, styles.deleteText]}>Supprimer mon compte</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Logout Row - ORANGE */}
            <TouchableOpacity style={[styles.actionRow, styles.logoutRow]} onPress={handleLogoutPress}>
              <LinearGradient colors={['rgba(245,158,11,0.05)', 'transparent']} style={styles.actionGradient}>
                <View style={[styles.actionIcon, styles.logoutIcon]}><Ionicons name="log-out-outline" size={22} color={ORANGE_LOGOUT} /></View>
                <Text style={[styles.actionText, styles.logoutText]}>Se déconnecter</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Change Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.modalInner} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrapper}>
                  <LinearGradient colors={[BLUE, colors.cyan]} style={styles.modalIconBg}>
                    <Ionicons name="key-outline" size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.modalTitle}>Changer le mot de passe</Text>
                <Text style={styles.modalSubtitle}>
                  Veuillez entrer votre mot de passe actuel, puis choisissez un nouveau mot de passe.
                </Text>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#8A94A6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Mot de passe actuel"
                    placeholderTextColor="#8A94A6"
                    secureTextEntry
                    value={passwordForm.currentPassword}
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setPasswordModalVisible(false);
                    router.push("/VerifyScreen");
                  }}
                  style={styles.forgotLinkContainer}
                >
                  <Ionicons name="help-circle-outline" size={14} color={BLUE} />
                  <Text style={[styles.forgotLinkText, { color: BLUE }]}>Mot de passe oublié ?</Text>
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-open-outline" size={20} color="#8A94A6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                    placeholderTextColor="#8A94A6"
                    secureTextEntry
                    value={passwordForm.newPassword}
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="checkmark-done-outline" size={20} color="#8A94A6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Confirmer le nouveau mot de passe"
                    placeholderTextColor="#8A94A6"
                    secureTextEntry
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                  />
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setPasswordModalVisible(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  <LinearGradient colors={[BLUE, "#3B82F6"]} style={styles.primaryButtonGradient}>
                    {passwordLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>Modifier</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Logout Modal - ORANGE accent */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#fff", "#fef9e8"] as const} style={styles.modalGradient}>
              <View style={[styles.modalIconCircle, { backgroundColor: ORANGE_LIGHT }]}>
                <Ionicons name="log-out-outline" size={40} color={ORANGE_LOGOUT} />
              </View>
              <Text style={styles.modalTitle}>Déconnexion</Text>
              <Text style={styles.modalMessage}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setLogoutModalVisible(false)}>
                  <Text style={styles.secondaryButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={async () => {
                    try {
                      setLogoutModalVisible(false);
                      await new Promise(resolve => setTimeout(resolve, 100));
                      await logout();
                      router.replace('/(auth)/login');
                    } catch (error) {
                      router.replace('/(auth)/login');
                    }
                  }}
                >
                  <LinearGradient colors={[ORANGE_LOGOUT, "#D97706"] as const} style={styles.primaryButtonGradient}>
                    <Text style={styles.primaryButtonText}>Se déconnecter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal - RED accent (unchanged) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <LinearGradient
              colors={["#ffffff", "#fff5f5"] as const}
              style={styles.deleteModalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.deleteIconWrapper}>
                <LinearGradient
                  colors={[RED_DELETE, "#C0392B"] as const}
                  style={styles.deleteIconGradient}
                >
                  <Ionicons name="trash-outline" size={36} color="#fff" />
                </LinearGradient>
                <View style={styles.warningBadge}>
                  <Text style={styles.warningBadgeText}>⚠️</Text>
                </View>
              </View>

              <Text style={styles.deleteModalTitle}>Supprimer définitivement mon compte</Text>
              
              <Text style={styles.deleteModalWarning}>
                Cette action est <Text style={{ fontWeight: 'bold' }}>IRRÉVERSIBLE</Text>. 
                Toutes vos données (demandes, projets, messages, historique) seront effacées.
              </Text>

              <Text style={styles.deleteModalLabel}>Raison de la suppression *</Text>
              <TextInput
                style={styles.deleteReasonInput}
                placeholder="Décrivez votre raison (obligatoire)"
                placeholderTextColor="#9CA3AF"
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              {deleteReason.length > 0 && (
                <Text style={styles.charCounter}>{deleteReason.length}/200</Text>
              )}

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDeleteConfirmed(!deleteConfirmed);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, deleteConfirmed && styles.checkboxChecked]}>
                  {deleteConfirmed && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Je comprends que cette action est définitive et supprime toutes mes données.
                </Text>
              </TouchableOpacity>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteCancelButton}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setDeleteReason('');
                    setDeleteConfirmed(false);
                  }}
                  disabled={deleting}
                >
                  <Text style={styles.deleteCancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteConfirmButton,
                    (!deleteReason.trim() || !deleteConfirmed || deleting) && styles.disabledButton
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={deleting || !deleteReason.trim() || !deleteConfirmed}
                >
                  <LinearGradient
                    colors={[RED_DELETE, "#C0392B"] as const}
                    style={styles.deleteConfirmGradient}
                  >
                    {deleting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.deleteConfirmText}>Supprimer définitivement</Text>
                    )}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  avatarContainer: { position: 'relative', marginBottom: spacing.md },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...shadows.sm,
  },
  avatarInitialLarge: { fontSize: 40, fontFamily: fonts.condensedBold, color: '#fff' },
  userNameWhite: { fontSize: 22, fontFamily: fonts.condensedBold, color: '#fff', marginTop: spacing.sm },
  userEmailWhite: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  badgeRowWhite: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  userRoleWhite: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  lastLoginBadgeWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  lastLoginTextWhite: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.body },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgBadge, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: fonts.condensedBold, color: colors.textPrimary },
  statLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  infoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  infoCardTitle: { fontSize: 14, fontFamily: fonts.condensedBold, color: colors.textPrimary, letterSpacing: 0.5 },
  editIconButton: { padding: 4 },
  editButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  editInfoForm: { marginTop: spacing.sm },
  editField: { marginBottom: spacing.md },
  editLabel: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.textSecondary, marginBottom: 4 },
  editInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: fonts.body, backgroundColor: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  infoValue: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textPrimary, marginTop: 1 },
  actionsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: spacing.md,
    ...shadows.md,
  },
  cardTitle: { fontSize: 14, fontFamily: fonts.condensedBold, color: colors.textPrimary, letterSpacing: 0.5, marginBottom: spacing.sm, marginHorizontal: spacing.lg },
  actionRow: { overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: spacing.lg },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgBadge, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.textPrimary },
  deleteRow: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  deleteIcon: { backgroundColor: RED_LIGHT },
  deleteText: { color: RED_DELETE },
  logoutRow: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  logoutIcon: { backgroundColor: ORANGE_LIGHT },
  logoutText: { color: ORANGE_LOGOUT },
  versionText: { textAlign: 'center', fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.md },
  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 1000 },
  toastGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 60, ...shadows.md },
  toastText: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1, fontFamily: fonts.bodyMedium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: width * 0.85, borderRadius: 32, overflow: 'hidden', ...shadows.lg },
  modalGradient: { padding: 24, alignItems: 'center' },
  modalIconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1B2430', marginBottom: 12, fontFamily: fonts.condensedBold, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#6B7A90', textAlign: 'center', marginBottom: 24, lineHeight: 22, fontFamily: fonts.body },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%', marginTop: 8 },
  modalInner: { padding: 24, alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalIconWrapper: { marginBottom: 16 },
  modalIconBg: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  modalSubtitle: { fontSize: 14, fontFamily: fonts.body, color: '#6B7A90', textAlign: 'center', lineHeight: 20 },
  modalForm: { width: '100%', marginBottom: 24 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, marginBottom: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  inputIcon: { marginRight: 10 },
  modalInput: { flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: fonts.body, color: '#1B2430' },
  forgotLinkContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 16, marginTop: 4, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-end' },
  forgotLinkText: { fontSize: 12, fontFamily: fonts.bodyMedium, letterSpacing: 0.3 },
  contactCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  contactCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  contactIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactCardTitle: { fontSize: 16, fontFamily: fonts.condensedBold, color: colors.textPrimary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  contactIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactTextContainer: { flex: 1 },
  contactLabel: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted },
  contactValue: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  contactHint: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, fontStyle: 'italic' },
  formCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.md,
  },
  formCardHeaderTouchable: {
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  formHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  formIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeaderText: {
    flex: 1,
  },
  formCardTitle: {
    fontSize: 18,
    fontFamily: fonts.condensedBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  formHeaderSubtitle: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
  },
  formSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 16,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  formField: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Unified button styles
  primaryButton: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    ...shadows.sm,
  },
  primaryButtonGradient: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: '#fff',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: '#6B7A90',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Delete Account Modal specific styles
  deleteModalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadows.lg,
  },
  deleteModalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  deleteIconWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  deleteIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  warningBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#FFE5B4',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  warningBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteModalTitle: {
    fontSize: 22,
    fontFamily: fonts.condensedBold,
    color: '#1B2430',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalWarning: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: RED_DELETE,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
  },
  deleteModalLabel: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  deleteReasonInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.body,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCounter: {
    fontSize: 11,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: RED_DELETE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: RED_DELETE,
    borderColor: RED_DELETE,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: '#4B5563',
  },
  deleteConfirmButton: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
  },
  deleteConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  deleteConfirmText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: '#fff',
    textAlign: 'center',
  },
});