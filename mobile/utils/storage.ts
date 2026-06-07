import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveToken = async (token: string) => {
    await AsyncStorage.setItem("token", token);
};

export const getToken = async () => {
    return await AsyncStorage.getItem("token");
};

export const removeToken = async () => {
    await AsyncStorage.removeItem("token");
};

export const saveRefreshToken = async (token: string) => {
    await AsyncStorage.setItem("refreshToken", token);
};

export const getRefreshToken = async () => {
    return await AsyncStorage.getItem("refreshToken");
};

export const removeRefreshToken = async () => {
    await AsyncStorage.removeItem("refreshToken");
};

export const saveUser = async (user: any) => {
    await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
    );
};

export const getUser = async () => {

    const user = await AsyncStorage.getItem("user");

    return user ? JSON.parse(user) : null;
};

export const logoutUser = async () => {
    await AsyncStorage.clear();
};