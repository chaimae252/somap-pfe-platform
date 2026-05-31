import type { CSSProperties } from "react";
import Navbar from "./Navbar";
import logo from "../assets/logo2.png";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div style={styles.shell}>
            <Navbar />

            <main style={styles.main}>
                <img src={logo} alt="" aria-hidden="true" style={styles.watermark} />
                {children}
            </main>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    shell: {
        display: "flex",
        height: "100dvh",
        minHeight: "100dvh",
        overflow: "hidden",
        backgroundColor: "#f4f8fc",
    },
    main: {
        flex: 1,
        minWidth: 0,
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "24px",
        position: "relative",
        backgroundColor: "#f4f8fc",
        backgroundImage: `
            radial-gradient(ellipse 70% 50% at 12% 0%, rgba(126,201,51,0.13), transparent 55%),
            linear-gradient(135deg, rgba(18,113,184,0.08), rgba(255,255,255,0) 42%)
        `,
    },
    watermark: {
        position: "fixed",
        right: 28,
        bottom: 20,
        width: 280,
        maxWidth: "32vw",
        opacity: 0.035,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
    },
};
