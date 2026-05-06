import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface LogoMarkProps {
    size?: 'sm' | 'md' | 'lg';
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 'md' }) => {

    const logoWidth =
        size === 'sm' ? 120 :
            size === 'lg' ? 180 :
                150;

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo2.png')}
                style={{
                    width: logoWidth,
                    height: logoWidth / 3.75,
                }}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // remove red after testing
    },
});