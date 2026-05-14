import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Animated, Pressable } from "react-native";
import { useRef, useEffect } from "react";
import Theme from "../../constants/theme";

const { colors, fonts, radius, spacing } = Theme;

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: colors.blue,
                tabBarInactiveTintColor: colors.textMuted,

                tabBarLabelStyle: {
                    fontFamily: fonts.bodyMedium,
                    fontSize: 11,
                    letterSpacing: 0.3,
                    marginBottom: 0,
                    marginTop: 2,
                },

                tabBarStyle: {
                    position: "absolute",
                    bottom: 10,
                    left: 14,
                    right: 14,
                    height: 68,
                    backgroundColor: colors.bgCard,
                    borderRadius: 28,
                    borderTopWidth: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    // Branded blue shadow
                    shadowColor: colors.blue,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    elevation: 14,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                },

                tabBarItemStyle: {
                    paddingVertical: 0,
                    marginVertical: 7,
                },

                tabBarButton: (props) => <AnimatedTabButton {...props} />,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Accueil",
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabIcon focused={focused} icon="home" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="services"
                options={{
                    title: "Services",
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabIcon focused={focused} icon="construct" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="demandes"
                options={{
                    title: "Demandes",
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabIcon focused={focused} icon="document-text" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="projets"
                options={{
                    title: "Projets",
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabIcon focused={focused} icon="business" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabIcon focused={focused} icon="person" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}

// ─── Press-bounce wrapper ─────────────────────────────────────────────────────

function AnimatedTabButton({ children, onPress, onLongPress, style, ...rest }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () =>
        Animated.spring(scale, {
            toValue: 0.86,
            useNativeDriver: true,
            speed: 60,
            bounciness: 0,
        }).start();

    const pressOut = () =>
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 22,
            bounciness: 12,
        }).start();

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={pressIn}
            onPressOut={pressOut}
            style={style}
            {...rest}
        >
            <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

// ─── Tab icon ─────────────────────────────────────────────────────────────────

type TabIconProps = {
    focused: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    size: number;
};

function TabIcon({ focused, icon, color, size }: TabIconProps) {
    const pillScale   = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
    const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
    const iconY       = useRef(new Animated.Value(focused ? -1 : 1)).current;
    const iconScale   = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
    const dotOpacity  = useRef(new Animated.Value(focused ? 1 : 0)).current;
    const dotScale    = useRef(new Animated.Value(focused ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(pillScale, {
                toValue: focused ? 1 : 0.6,
                useNativeDriver: true,
                speed: 20,
                bounciness: 12,
            }),
            Animated.timing(pillOpacity, {
                toValue: focused ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(iconY, {
                toValue: focused ? -1 : 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
            }),
            Animated.spring(iconScale, {
                toValue: focused ? 1.15 : 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
            }),
            Animated.spring(dotScale, {
                toValue: focused ? 1 : 0,
                useNativeDriver: true,
                speed: 22,
                bounciness: 18,
            }),
            Animated.timing(dotOpacity, {
                toValue: focused ? 1 : 0,
                duration: 160,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused]);

    const outlineIcon = `${icon}-outline` as keyof typeof Ionicons.glyphMap;

    return (
        <View style={styles.iconWrapper}>
            {/* Pill background */}
            <Animated.View
                style={[
                    styles.pill,
                    { opacity: pillOpacity, transform: [{ scale: pillScale }] },
                ]}
            />

            {/* Icon */}
            <Animated.View
                style={{ transform: [{ translateY: iconY }, { scale: iconScale }] }}
            >
                <Ionicons
                    name={focused ? icon : outlineIcon}
                    size={size}
                    color={focused ? colors.blue : colors.textMuted}
                />
            </Animated.View>

            {/* Active dot */}
            <Animated.View
                style={[
                    styles.dot,
                    { opacity: dotOpacity, transform: [{ scale: dotScale }] },
                ]}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    iconWrapper: {
        width: 44,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
    },

    pill: {
        position: "absolute",
        width: 44,
        height: 35,
        borderRadius: 16,
        backgroundColor: colors.bgBadge,       // rgba(18,113,184,0.10)
        borderWidth: 1,
        borderColor: colors.borderBadge,        // rgba(18,113,184,0.25)
    },

    dot: {
        position: "absolute",
        bottom: -1,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.blue,
    },
});