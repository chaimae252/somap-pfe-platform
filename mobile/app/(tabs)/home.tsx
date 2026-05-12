import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import Theme from "../../constants/theme";

import { getAllServices } from "../../services/serviceService";
import { getHomeStats } from "../../services/homeService";
import { getCurrentProject } from "../../services/projectService";

const { colors, fonts, spacing, radius, shadows } = Theme;

const ADVANTAGES = [
  {
    icon: "shield-checkmark" as const,
    title: "Qualité certifiée",
    desc: "Entreprise certifiée ISO 2015",
    color: "#1271B8",
    bg: "rgba(18,113,184,0.10)",
  },

  {
    icon: "flash" as const,
    title: "Intervention rapide",
    desc: "Réactivité et respect des délais",
    color: "#2D9C7C",
    bg: "rgba(73,198,154,0.12)",
  },

  {
    icon: "leaf" as const,
    title: "Respect environnement",
    desc: "Solutions industrielles durables",
    color: "#49C69A",
    bg: "rgba(73,198,154,0.12)",
  },

  {
    icon: "build" as const,
    title: "Expertise technique",
    desc: "20 ans d’expérience industrielle",
    color: "#D4A017",
    bg: "rgba(212,160,23,0.12)",
  },
];

const PARTNERS = [
  "CASA TRAM",
  "PEUGEOT PSA",
  "TRANSDEV",
  "PLASTIC OMNIUM",
  "SEPALUMIC",
];

export default function HomeScreen() {

  const insets = useSafeAreaInsets();
  const { user, token } = useAuthStore();
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      if (!user?.id) {
        console.log("No connected user");
        return;
      }

      const servicesData = await getAllServices();
      setServices(servicesData.slice(0, 4));

      const statsData = await getHomeStats(user.id);
      setStats(statsData);

      const projectData = await getCurrentProject(user.id);
      setProject(projectData);

    } catch (error) {
      console.log("Erreur Home:", error);
    }
  };

  const getServiceIcon = (title: string) => {

    const lower = title.toLowerCase();

    if (lower.includes("sablage")) {
      return {
        icon: "hammer",
        accent: "#1271B8",
        bg: "rgba(18,113,184,0.10)",
      };
    }

    if (lower.includes("peinture")) {
      return {
        icon: "color-fill",
        accent: "#13ACD5",
        bg: "rgba(19,172,213,0.10)",
      };
    }

    if (lower.includes("traitement")) {
      return {
        icon: "water",
        accent: "#2D9C7C",
        bg: "rgba(73,198,154,0.12)",
      };
    }

    return {
      icon: "flask",
      accent: "#D4A017",
      bg: "rgba(212,160,23,0.12)",
    };
  };

  const getProjectProgress = (statut: string) => {
    switch (statut) {

      case "EN_COURS":
        return 60;

      case "TERMINE":
        return 100;

      case "SUSPENDU":
        return 25;

      default:
        return 0;
    }
  };

  const formatProjectStatus = (statut: string) => {
    switch (statut) {

      case "EN_COURS":
        return "En cours";

      case "TERMINE":
        return "Terminé";

      case "SUSPENDU":
        return "Suspendu";

      default:
        return statut;
    }
  };

  const getProjectColors = (statut: string) => {
    switch (statut) {

      case "TERMINE":
        return ["#49C69A", "#2D9C7C"] as const;

      case "SUSPENDU":
        return ["#F2994A", "#D9822B"] as const;

      default:
        return ["#1271B8", "#13ACD5"] as const;
    }
  };

  return (
      <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120 + insets.bottom,
          }}
      >
        <StatusBar barStyle="light-content" />

        {/* ─── HEADER ─────────────────────────────────────── */}
        <LinearGradient
            colors={["#0d2d5e", "#1271b8", "#2D9C7C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeLabel}>Bonjour 👋</Text>
              <Text style={styles.welcomeName}>
                {user?.nom || "Client"}
              </Text>
              <Text style={styles.subtitle}>SOMAP & SERVICE</Text>
            </View>

            <View style={styles.rightHeader}>

              <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.notificationButton}
              >
                <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#fff"
                />

                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {stats?.notifications || 0}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.avatarWrap}>
                <LinearGradient
                    colors={[colors.blueAccent, colors.cyan]}
                    style={styles.avatar}
                >
                  <Text style={styles.avatarInitial}>C</Text>
                </LinearGradient>

                <View style={styles.avatarDot} />
              </View>

            </View>
          </View>

          {/* Stat strip */}
          <View style={styles.statStrip}>
            {[
              {
                val: stats?.demandes?.toString() || "0",
                lbl: "Demandes",
              },

              {
                val: stats?.projets?.toString() || "0",
                lbl: "Projets",
              },
            ].map((s, i, arr) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>

                  {i < arr.length - 1 && (
                      <View style={styles.statDivider} />
                  )}
                </View>
            ))}
          </View>
        </LinearGradient>

        {/* ─── QUICK ACTIONS ──────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
                style={styles.actionPrimaryWrap}
                activeOpacity={0.85}
            >
              <LinearGradient
                  colors={["#1271b8", "#2D9C7C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionInner}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="add" size={18} color="#fff" />
                </View>

                <Text style={styles.actionPrimaryTxt}>
                  Nouvelle{"\n"}demande
                </Text>

                <Ionicons
                    name="arrow-forward"
                    size={14}
                    color="rgba(255,255,255,0.55)"
                    style={{ marginTop: "auto" }}
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionSecondaryWrap}
                activeOpacity={0.85}
            >
              <View style={styles.actionIconWrapAlt}>
                <Ionicons
                    name="construct"
                    size={18}
                    color={colors.blue}
                />
              </View>

              <Text style={styles.actionSecondaryTxt}>
                Voir{"\n"}services
              </Text>

              <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.textHint}
                  style={{ marginTop: "auto" }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── PROJECT ────────────────────────────────────── */}
        {project && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projet en cours</Text>

              <View style={styles.projCard}>
                <View style={styles.projCardHeader}>

                  <View style={styles.projIconWrap}>
                    <Ionicons
                        name="business"
                        size={16}
                        color={colors.blue}
                    />
                  </View>

                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />

                    <Text style={styles.statusTxt}>
                      {formatProjectStatus(project.statut)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.projTitle}>
                  {project.titre}
                </Text>

                <Text style={styles.projDesc}>
                  {project.description}
                </Text>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLbl}>
                    Progression
                  </Text>

                  <Text style={styles.progressPct}>
                    {getProjectProgress(project.statut)}%
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <LinearGradient
                      colors={getProjectColors(project.statut)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        {
                          width: `${getProjectProgress(project.statut)}%`,
                        },
                      ]}
                  />
                </View>
              </View>
            </View>
        )}

        {/* ─── SERVICES ───────────────────────────────────── */}
        <View style={[styles.section, { paddingRight: 0 }]}>
          <Text
              style={[
                styles.sectionTitle,
                { paddingRight: spacing.lg },
              ]}
          >
            Services populaires
          </Text>

          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 4,
                paddingRight: spacing.lg,
                gap: 10,
              }}
          >
            {services.map((service, i) => {

              const config = getServiceIcon(service.titre);

              return (
                  <TouchableOpacity
                      key={i}
                      style={styles.serviceCard}
                      activeOpacity={0.85}
                  >
                    <View
                        style={[
                          styles.serviceIconWrap,
                          {
                            backgroundColor: config.bg,
                          },
                        ]}
                    >
                      <Ionicons
                          name={config.icon as any}
                          size={20}
                          color={config.accent}
                      />
                    </View>

                    <Text style={styles.serviceTitle}>
                      {service.titre}
                    </Text>

                    <Text style={styles.serviceDesc}>
                      {service.description}
                    </Text>

                    <View
                        style={[
                          styles.serviceChip,
                          {
                            backgroundColor: config.bg,
                          },
                        ]}
                    >
                      <Text
                          style={[
                            styles.serviceChipTxt,
                            {
                              color: config.accent,
                            },
                          ]}
                      >
                        Voir plus
                      </Text>
                    </View>
                  </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── ADVANTAGES ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pourquoi choisir SOMAP ?
          </Text>

          <View style={styles.advantagesGrid}>
            {ADVANTAGES.map((item, index) => (
                <View key={index} style={styles.advantageCard}>

                  <View
                      style={[
                        styles.advantageIconWrap,
                        { backgroundColor: item.bg },
                      ]}
                  >
                    <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.color}
                    />
                  </View>

                  <Text style={styles.advantageTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.advantageDesc}>
                    {item.desc}
                  </Text>

                </View>
            ))}
          </View>
        </View>

        {/* ─── PARTNERS ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Nos partenaires
          </Text>

          <View style={styles.partnersGrid}>
            {PARTNERS.map((partner, index) => (
                <View key={index} style={styles.partnerCard}>
                  <Ionicons
                      name="business"
                      size={16}
                      color="#1271B8"
                  />

                  <Text style={styles.partnerText}>
                    {partner}
                  </Text>
                </View>
            ))}
          </View>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  advantagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  advantageCard: {
    width: "48%",
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },

  advantageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  advantageTitle: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    lineHeight: 18,
  },

  advantageDesc: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },

  partnersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  partnerCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgCard,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },

  partnerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.2,
  },
  // ── Header ──────────────────────────────────────────────────────
  header: {
    paddingTop: 30,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
    alignItems: "flex-start",
    zIndex: 2,
  },
  welcomeLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: fonts.body,
    letterSpacing: 0.3,
  },
  welcomeName: {
    color: "#fff",
    fontSize: 26,
    fontFamily: fonts.condensedBold,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontFamily: fonts.body,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 3,
  },
  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#49C69A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 20,
    fontFamily: fonts.condensedBold,
  },
  avatarDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#49C69A",
    borderWidth: 2,
    borderColor: "#0d2d5e",
  },

  // Stat strip
  statStrip: {
    flexDirection: "row",
    marginTop: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    zIndex: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  statVal: {
    color: "#fff",
    fontSize: 19,
    fontFamily: fonts.condensedBold,
  },
  statLbl: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 9,
    fontFamily: fonts.body,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statDivider: {
    position: "absolute",
    right: 0,
    top: "20%",
    bottom: "20%",
    width: 0.5,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  // ── Section ─────────────────────────────────────────────────────
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.condensedBold,
    color: colors.textPrimary,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ── Actions ─────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionPrimaryWrap: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  actionInner: {
    padding: spacing.md,
    height: 112,
  },
  actionSecondaryWrap: {
    flex: 1,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionIconWrapAlt: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.bgBadge,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionPrimaryTxt: {
    color: "#fff",
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 19,
  },
  actionSecondaryTxt: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Project ─────────────────────────────────────────────────────
  projCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  projCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  projIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.bgBadge,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(73,198,154,0.12)",
    borderWidth: 1,
    borderColor: "rgba(73,198,154,0.25)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#49C69A",
  },
  statusTxt: {
    color: "#2D9C7C",
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.6,
  },
  projTitle: {
    fontSize: 16,
    fontFamily: fonts.condensedBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  projDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 7,
  },
  progressLbl: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  progressPct: {
    color: colors.blue,
    fontFamily: fonts.condensedBold,
    fontSize: 13,
  },
  progressTrack: {
    height: 7,
    backgroundColor: colors.bgLight,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    width: "65%",
    height: "100%",
    borderRadius: radius.pill,
  },

  // ── Services ────────────────────────────────────────────────────
  serviceCard: {
    width: 150,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 14,
    fontFamily: fonts.condensedBold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  serviceDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  serviceChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 10,
  },
  serviceChipTxt: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
  },

  // ── Notifications ───────────────────────────────────────────────
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    ...shadows.sm,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifBody: { flex: 1 },
  notifTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  notifTime: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
});