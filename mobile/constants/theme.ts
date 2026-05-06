import Colors from "./colors";

export const Theme = {
  colors: Colors,

  // ======================================================
  // 🔤 TYPOGRAPHY (Barlow system you already chose)
  // ======================================================
  fonts: {
    condensed: "BarlowCondensed",
    condensedBold: "BarlowCondensed-Bold",
    condensedSemiBold: "BarlowCondensed-SemiBold",

    body: "Barlow",
    bodyMedium: "Barlow-Medium",
    bodySemiBold: "Barlow-SemiBold",
  },

  // ======================================================
  // 📏 SPACING SYSTEM (8pt grid system - professional UI standard)
  // ======================================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  // ======================================================
  // 🔵 BORDER RADIUS SYSTEM
  // ======================================================
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    pill: 999,
    card: 14,
    button: 12,
    screen: 24,
  },

  // ======================================================
  // 🌫️ SHADOW SYSTEM (iOS + Android friendly)
  // ======================================================
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },

    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },
  },

  // ======================================================
  // 🎯 LAYOUT HELPERS
  // ======================================================
  layout: {
    screenPadding: 20,
    cardPadding: 16,
    sectionGap: 24,
  },
};

export default Theme;