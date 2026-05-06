import { useRouter } from 'expo-router';
import OnboardingNavigator from './OnboardingNavigator';

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <OnboardingNavigator
            onFinish={() => {
                router.replace('/login'); // or '/(auth)/login'
            }}
        />
    );
}