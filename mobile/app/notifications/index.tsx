import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const notifications = [
    {
        id: "1",
        title: "Demande validée",
        message: "Votre demande de peinture a été acceptée.",
        time: "Il y a 2h",
        icon: "checkmark-circle",
        color: "#49C69A",
    },

    {
        id: "2",
        title: "Projet mis à jour",
        message: "La progression de votre projet est maintenant à 60%.",
        time: "Il y a 5h",
        icon: "construct",
        color: "#1271B8",
    },

    {
        id: "3",
        title: "Nouveau message",
        message: "SOMAP a ajouté une mise à jour à votre projet.",
        time: "Hier",
        icon: "notifications",
        color: "#F2994A",
    },
];

export default function NotificationsScreen() {

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.card}
                    >
                        <View
                            style={[
                                styles.iconWrap,
                                { backgroundColor: `${item.color}20` },
                            ]}
                        >
                            <Ionicons
                                name={item.icon as any}
                                size={22}
                                color={item.color}
                            />
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.cardTitle}>
                                {item.title}
                            </Text>

                            <Text style={styles.message}>
                                {item.message}
                            </Text>

                            <Text style={styles.time}>
                                {item.time}
                            </Text>
                        </View>
                    </TouchableOpacity>

                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F7F9FC",
    },

    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0d2d5e",
    },

    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: "flex-start",
    },

    iconWrap: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    content: {
        flex: 1,
        marginLeft: 14,
    },

    cardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111",
    },

    message: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        lineHeight: 18,
    },

    time: {
        fontSize: 11,
        color: "#999",
        marginTop: 8,
    },
});