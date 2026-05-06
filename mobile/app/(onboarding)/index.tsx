import OnboardingNavigator from "@/app/(onboarding)/OnboardingNavigator";

export default function OnboardingIndex() {
    return <OnboardingNavigator onFinish={function(): void {
        throw new Error("Function not implemented.");
    } } />;
}