// app/(tabs)/profile.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  StatusBar, Animated, Dimensions, TextInput, ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import Theme from '../../constants/theme';
import { router, useFocusEffect } from 'expo-router';
import { getHomeStats } from '../../services/homeService';
import { updateClient } from '../../services/clientService';
import * as Haptics from 'expo-haptics';

const { colors, fonts, spacing, radius, shadows } = Theme;
const { width } = Dimensions.get('window');

// ================= CUSTOM TOAST =================
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
    ? ["#49C69A", "#2D9C7C"] as const 
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "success",
  });

  const [editForm, setEditForm] = useState({
    nom: user?.nom || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    email: user?.email || '',
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        nom: user.nom || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Redirect if no user
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
        email: editForm.email,
      };

      const updatedClient = await updateClient(user!.id, clientData as any);
      const updatedUser = { ...user, ...updatedClient };
      if (setAuth && token) {
        setAuth(token, updatedUser);
      } else {
        useAuthStore.setState({ user: updatedUser });
      }
      setToast({ visible: true, message: "Profil mis à jour avec succès", type: "success" });
      setIsEditing(false);
    } catch (error: any) {
      setToast({ visible: true, message: error?.response?.data?.message || "Impossible de mettre à jour le profil", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(screen as any);
  };

  if (!user) return null;

  return (
    <LinearGradient colors={['#f0f4fa', '#ffffff']} style={styles.gradientContainer}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} colors={[colors.blue]} />}
      >
        {/* Header Card – Dark gradient matching demands page */}
        <LinearGradient
          colors={["#0B1F3A", "#123C69", "#1B6CA8"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient colors={[colors.blueAccent, colors.cyan]} style={styles.avatarLarge}>
              <Text style={styles.avatarInitialLarge}>{user.nom?.charAt(0).toUpperCase() || 'C'}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          {!isEditing ? (
            <>
              <Text style={styles.userNameWhite}>{user.nom || 'Client'}</Text>
              <Text style={styles.userEmailWhite}>{user.email || 'client@example.com'}</Text>
              <View style={styles.badgeRowWhite}>
                <Text style={styles.userRoleWhite}>{user.role || 'Client'}</Text>
                <View style={styles.lastLoginBadgeWhite}>
                  <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.lastLoginTextWhite}>Dernière connexion: {lastLogin}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editBtnWhite} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.editBtnTextWhite}>Modifier le profil</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editFormContainer}>
              <Text style={styles.editTitleWhite}>Modifier le profil</Text>
              <TextInput
                style={styles.editInputWhite}
                placeholder="Nom complet"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editForm.nom}
                onChangeText={(text) => setEditForm({ ...editForm, nom: text })}
              />
              <TextInput
                style={styles.editInputWhite}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.editInputWhite}
                placeholder="Téléphone"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editForm.telephone}
                onChangeText={(text) => setEditForm({ ...editForm, telephone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.editInputWhite}
                placeholder="Adresse"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editForm.adresse}
                onChangeText={(text) => setEditForm({ ...editForm, adresse: text })}
              />
              <View style={styles.editButtonsRow}>
                <TouchableOpacity style={styles.cancelButtonWhite} onPress={() => setIsEditing(false)} disabled={loading}>
                  <Text style={styles.cancelButtonTextWhite}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButtonWhite} onPress={handleSaveEdit} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.blue} size="small" /> : <Text style={styles.saveButtonTextWhite}>Enregistrer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/(tabs)/demandes')} activeOpacity={0.7}>
            <View style={styles.statIconBg}><Ionicons name="document-text-outline" size={24} color={colors.blue} /></View>
            <AnimatedCounter value={stats.demandes} />
            <Text style={styles.statLabel}>Demandes</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/(tabs)/projets')} activeOpacity={0.7}>
            <View style={styles.statIconBg}><Ionicons name="briefcase-outline" size={24} color={colors.blue} /></View>
            <AnimatedCounter value={stats.projets} />
            <Text style={styles.statLabel}>Projets</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/(tabs)/notifications')} activeOpacity={0.7}>
            <View style={styles.statIconBg}><Ionicons name="notifications-outline" size={24} color={colors.blue} /></View>
            <AnimatedCounter value={stats.notifications} />
            <Text style={styles.statLabel}>Notifications</Text>
          </TouchableOpacity>
        </View>

        {!isEditing && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Informations personnelles</Text>
            {[
              { icon: 'person-outline', label: 'Nom', value: user.nom || 'Non renseigné' },
              { icon: 'mail-outline', label: 'Email', value: user.email || 'Non renseigné' },
              { icon: 'call-outline', label: 'Téléphone', value: user.telephone || 'Non renseigné' },
              { icon: 'location-outline', label: 'Adresse', value: user.adresse || 'Non renseignée' },
            ].map((item, idx) => (
              <View key={idx} style={styles.infoRow}>
                <View style={styles.infoIconBg}><Ionicons name={item.icon as any} size={20} color={colors.blue} /></View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Paramètres du compte</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => setToast({ visible: true, message: "Fonctionnalité à venir", type: "error" })}>
            <LinearGradient colors={['rgba(18,113,184,0.1)', 'transparent']} style={styles.actionGradient}>
              <View style={styles.actionIcon}><Ionicons name="key-outline" size={22} color={colors.blue} /></View>
              <Text style={styles.actionText}>Changer le mot de passe</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.logoutRow]} onPress={handleLogoutPress}>
            <LinearGradient colors={['rgba(229,62,62,0.05)', 'transparent']} style={styles.actionGradient}>
              <View style={[styles.actionIcon, styles.logoutIcon]}><Ionicons name="log-out-outline" size={22} color="#E53E3E" /></View>
              <Text style={[styles.actionText, styles.logoutText]}>Se déconnecter</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#fff", "#f8f9fc"] as const} style={styles.modalGradient}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="log-out-outline" size={40} color="#E53E3E" />
              </View>
              <Text style={styles.modalTitle}>Déconnexion</Text>
              <Text style={styles.modalMessage}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelModalButton} onPress={() => setLogoutModalVisible(false)}>
                  <Text style={styles.cancelModalText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmModalButton} 
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
                  <LinearGradient colors={["#E53E3E", "#C0392B"] as const} style={styles.confirmGradient}>
                    <Text style={styles.confirmModalText}>Se déconnecter</Text>
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
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.blue,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...shadows.sm,
  },
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
  editBtnWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  editBtnTextWhite: { color: '#fff', fontFamily: fonts.bodyMedium, fontSize: 13 },
  editFormContainer: { width: '100%', marginTop: spacing.sm },
  editTitleWhite: { fontSize: 18, fontFamily: fonts.condensedBold, color: '#fff', marginBottom: spacing.md, textAlign: 'center' },
  editInputWhite: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  editButtonsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelButtonWhite: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  cancelButtonTextWhite: { color: '#fff', fontFamily: fonts.bodyMedium },
  saveButtonWhite: { flex: 1, backgroundColor: '#fff', paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  saveButtonTextWhite: { color: colors.blue, fontFamily: fonts.bodySemiBold },

  // Stats Card
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

  // Info Card
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
  infoCardTitle: {
  fontSize: 14,
  fontFamily: fonts.condensedBold,
  color: colors.textPrimary,
  letterSpacing: 0.5,
  marginBottom: 9,        // reduced gap (was spacing.md ≈ 12)
  // if you want to move the title up, add marginTop: -4
},
cardTitle: { 
  fontSize: 14, 
  fontFamily: fonts.condensedBold, 
  color: colors.textPrimary, 
  letterSpacing: 0.5, 
  marginBottom: spacing.sm,    // ✅ reduce bottom margin (from spacing.md to sm)
  marginHorizontal: spacing.lg, // ✅ add horizontal alignment with the action rows
},
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgBadge, alignItems: 'center', justifyContent: 'center' },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  infoValue: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textPrimary, marginTop: 1 },

  // Actions Card
 actionsCard: {
  marginHorizontal: spacing.lg,
  marginTop: spacing.lg,
  backgroundColor: '#fff',
  borderRadius: radius.xl,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: colors.borderLight,
  paddingTop: spacing.md,      // ✅ add top padding
  ...shadows.md,
},
  actionRow: { overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: spacing.lg },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgBadge, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.textPrimary },
  logoutRow: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  logoutIcon: { backgroundColor: 'rgba(229,62,62,0.1)' },
  logoutText: { color: '#E53E3E' },
  versionText: { textAlign: 'center', fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.md },

  // Toast
  toastContainer: { position: "absolute", top: 60, left: 20, right: 20, zIndex: 1000 },
  toastGradient: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 60, ...shadows.md },
  toastText: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1, fontFamily: fonts.bodyMedium },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: width * 0.85, borderRadius: 32, overflow: 'hidden', ...shadows.lg },
  modalGradient: { padding: 24, alignItems: 'center' },
  modalIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(229,62,62,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1B2430', marginBottom: 12, fontFamily: fonts.condensedBold },
  modalMessage: { fontSize: 16, color: '#6B7A90', textAlign: 'center', marginBottom: 24, lineHeight: 22, fontFamily: fonts.body },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%' },
  cancelModalButton: { flex: 1, backgroundColor: '#F0F2F5', paddingVertical: 12, borderRadius: 40, alignItems: 'center' },
  cancelModalText: { fontSize: 16, fontWeight: '600', color: '#6B7A90' },
  confirmModalButton: { flex: 1, borderRadius: 40, overflow: 'hidden' },
  confirmGradient: { paddingVertical: 12, alignItems: 'center' },
  confirmModalText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: fonts.bodySemiBold },
});