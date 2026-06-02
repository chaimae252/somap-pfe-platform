import type { CSSProperties } from "react";
import Navbar from "./Navbar";
import SomapBackground from "./SomapBackground";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <SomapBackground showWatermark style={styles.shell}>
            <Navbar />

            <main style={styles.main}>
                {children}
            </main>
        </SomapBackground>
    );
}

const styles: Record<string, CSSProperties> = {
    shell: {
        display: "flex",
        height: "100dvh",
        minHeight: "100dvh",
        overflow: "hidden",
        alignItems: "stretch",
        justifyContent: "flex-start",
    },
    main: {
        flex: 1,
        minWidth: 0,
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        padding: 28,
        position: "relative",
        zIndex: 1,
    },
};
