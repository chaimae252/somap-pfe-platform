import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ServiceDetails() {

    const { id } = useLocalSearchParams();

    return (
        <View>
            <Text>Détails service {id}</Text>
        </View>
    );
}