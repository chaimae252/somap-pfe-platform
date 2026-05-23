import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { OnboardingTopBar } from '../../components/OnboardingTopBar';
import { ScreenBadge } from '../../components/ScreenBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressDots } from '../../components/ProgressDots';
import { ProgressBar } from '../../components/ProgressBar';
import { NotificationItem } from '../../components/NotificationItem';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface Onboarding3Props {
    onStart: () => void;
    currentIndex?: number;
    totalScreens?: number;
    onDotPress?: (index: number) => void;
    isActive?: boolean;
}

const PROJECT = {
    label: 'Projet Akwa Industries',
    value: 73,
};

const NOTIFICATIONS = [
    {
        dotColor: Colors.blue,
        title: 'Intervention confirmée',
        body: 'Équipe disponible demain à 08h00',
        time: 'Il y a 5 min',
    },
    {
        dotColor: Colors.green,
        title: 'Phase terminée',
        body: 'Sablage validé avec succès',
        time: 'Il y a 23 min',
    },
];

const Onboarding3: React.FC<Onboarding3Props> = ({
                                                     onStart,
                                                     currentIndex = 2,
                                                     totalScreens = 3,
                                                     onDotPress,
                                                     isActive = false,
                                                 }) => {
    const [showBar, setShowBar] = useState(false);

    useEffect(() => {
        if (isActive) {
            setShowBar(false);
            const timer = setTimeout(() => setShowBar(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowBar(false);
        }
    }, [isActive]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#0d2d5e" translucent={false} />

            <View style={styles.screen}>
                <View
                    style={[
                        styles.blob,
                        {
                            width: 220,
                            height: 220,
                            backgroundColor: Colors.blobBlue,
                            bottom: 100,
                            right: -50,
                            opacity: 0.6,
                        },
                    ]}
                />
                <View
                    style={[
                        styles.blob,
                        {
                            width: 160,
                            height: 160,
                            backgroundColor: Colors.blobCyan,
                            top: 80,
                            left: -40,
                            opacity: 0.4,
                        },
                    ]}
                />

                <OnboardingTopBar centerLogo />

                <View style={styles.dashZone}>
                    <View
                        style={[
                            styles.heroCard,
                            {
                                transform: [{ scale: showBar ? 1 : 0.95 }],
                            },
                        ]}
                    >
                        <View style={styles.heroHeader}>
                            <Text style={styles.heroTitle}>
                                {PROJECT.label}
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Projet industriel en cours
                            </Text>
                        </View>

                        <Text style={styles.heroPercent}>{PROJECT.value}%</Text>

                        {showBar && (
                            <ProgressBar
                                progress={PROJECT.value}
                                color="blue"
                                animate={true}
                            />
                        )}

                        <Text style={styles.heroStatus}>
                            En cours d&#39;exécution
                        </Text>
                    </View>

                    <View style={styles.notifZone}>
                        {NOTIFICATIONS.map((n, i) => (
                            <NotificationItem
                                key={i}
                                dotColor={n.dotColor}
                                title={n.title}
                                body={n.body}
                                time={n.time}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.content}>
                    <ScreenBadge label="Suivi intelligent" />

                    <Text style={styles.title}>
                        Gardez le contrôle{'\n'}de vos projets
                    </Text>

                    <Text style={styles.subtitle}>
                        Suivez l&#39;avancement en temps réel, recevez des notifications et pilotez vos interventions avec précision.
                    </Text>

                    <PrimaryButton
                        label="Commencer"
                        onPress={onStart}
                        icon="arrow-start"
                    />
                </View>

                <ProgressDots
                    total={totalScreens}
                    current={currentIndex}
                    onDotPress={onDotPress}
                />
            </View>
        </SafeAreaView>
    );
};

export default Onboarding3;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.bgScreen,
    },
    screen: {
        flex: 1,
        backgroundColor: Colors.bgScreen,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        borderRadius: 9999,
    },
    dashZone: {
        paddingHorizontal: Theme.spacing.xl,
        paddingTop: 10,
        flex: 1,
        justifyContent: 'flex-start',
    },
    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: Theme.radius.xl + 6,
        padding: 26,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        shadowColor: '#0b4f91',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 10,
        overflow: 'hidden',
    },
    heroHeader: {
        marginBottom: 10,
    },
    heroTitle: {
        fontFamily: Theme.fonts.condensedBold,
        fontSize: 16,
        color: Colors.textPrimary,
        letterSpacing: 0.3,
    },
    heroSubtitle: {
        fontFamily: Theme.fonts.body,
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 2,
    },
    heroPercent: {
        fontFamily: Theme.fonts.condensedBold,
        fontSize: 44,
        color: Colors.blue,
        marginBottom: 14,
    },
    heroStatus: {
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Theme.radius.sm,
        backgroundColor: 'rgba(18,113,184,0.1)',
        fontFamily: Theme.fonts.bodySemiBold,
        fontSize: 11,
        color: Colors.blue,
    },
    notifZone: {
        gap: 5,
        marginTop: -5,
    },
    content: {
        paddingHorizontal: Theme.spacing.xxl,
        paddingTop: 10,
        marginTop: 10,
        alignItems: 'center',
    },
    title: {
        fontFamily: Theme.fonts.condensedBold,
        fontSize: 30,
        color: Colors.textPrimary,
        lineHeight: 34,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: Theme.fonts.body,
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 23,
        marginBottom: 20,
        textAlign: 'center',
        opacity: 0.9,
    },
});
