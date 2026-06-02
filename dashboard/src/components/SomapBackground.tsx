import type { ReactNode, CSSProperties } from "react";
import logo from "../assets/logo2.png";

type Props = {
    children: ReactNode;
    style?: CSSProperties;
    showWatermark?: boolean;
};

export default function SomapBackground({ children, style, showWatermark = false }: Props) {
    return (
        <div style={{ ...styles.container, ...style }}>
            <div style={styles.orb1} />
            <div style={styles.orb2} />
            {showWatermark && <img src={logo} alt="" aria-hidden="true" style={styles.watermark} />}
            {children}
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    container: {
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f4f8",
        backgroundImage: `
      radial-gradient(ellipse 70% 50% at 15% 10%, rgba(126,201,51,0.13) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 85% 90%, rgba(18,113,184,0.10) 0%, transparent 55%)
    `,
        position: "relative",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        boxSizing: "border-box",
    },
    orb1: {
        position: "absolute", width: 320, height: 320, borderRadius: "50%",
        background: "rgba(126,201,51,0.08)", top: "-80px", left: "-80px", pointerEvents: "none",
    },
    orb2: {
        position: "absolute", width: 240, height: 240, borderRadius: "50%",
        background: "rgba(18,113,184,0.07)", bottom: "-60px", right: "-50px", pointerEvents: "none",
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
