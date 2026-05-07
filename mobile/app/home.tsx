import { View, Text } from "react-native";

export default function HomeScreen() {

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text>Bienvenue dans SOMAP 👋</Text>
        </View>
    );
}