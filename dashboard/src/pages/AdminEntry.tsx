import Button from "../components/Button";
import SomapBackground from "../components/SomapBackground";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo2.png";

export default function AdminEntry() {
    const navigate = useNavigate();

    return (
        <SomapBackground>
            <div style={styles.card}>
                <div style={styles.accentBar} />

                <div style={styles.logoWrapper}>
                    <img src={logo} alt="SOMAP & SERVICE" style={styles.logo} />
                </div>

                <div style={styles.divider}>
                    <span style={styles.dividerLine} />
                    <span style={styles.dividerDot} />
                    <span style={styles.dividerLine} />
                </div>

                <p style={styles.subtitle}>Plateforme d'administration industrielle</p>

                <div style={styles.buttonBox}>
                    <Button title="Se connecter" onClick={() => navigate("/login")} />
                    <Button title="Créer un admin" type="secondary" onClick={() => navigate("/register")} />
                </div>

                <p style={styles.footerTag}>
                    Société Marocaine des Produits Chimiques et Services
                </p>
            </div>
        </SomapBackground>
    );
}

const SOMAP_GREEN = "#7EC933";
const SOMAP_BLUE = "#1271b8";

const styles: any = {
    card: {
        position: "relative",
        backgroundColor: "#ffffff",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: "22px",
        padding: "0 36px 32px",
        width: "100%",
        maxWidth: "380px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 4px 32px rgba(18,113,184,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
        overflow: "hidden",
    },
    accentBar: {
        width: "calc(100% + 72px)",
        height: "4px",
        background: `linear-gradient(90deg, ${SOMAP_GREEN} 0%, ${SOMAP_BLUE} 100%)`,
        marginBottom: "32px",
        marginLeft: "-36px",
    },
    logoWrapper: {
        width: "250px", height: "90px",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "6px",
        filter: "drop-shadow(0 2px 10px rgba(18,113,184,0.13))",
    },
    logo: { width: "100%", height: "100%", objectFit: "contain" },
    divider: { display: "flex", alignItems: "center", gap: "10px", width: "100%", margin: "18px 0 16px" },
    dividerLine: { flex: 1, height: "1px", background: "linear-gradient(90deg,transparent,rgba(18,113,184,0.25),transparent)", display: "block" },
    dividerDot: { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: SOMAP_BLUE, display: "block", flexShrink: 0 },
    subtitle: {
        fontSize: "11px", color: "#7a8fa6", textAlign: "center",
        letterSpacing: "0.9px", textTransform: "uppercase", margin: "0 0 26px", lineHeight: 1.6,
    },
    buttonBox: { width: "100%", display: "flex", flexDirection: "column", gap: "11px" },
    footerTag: { marginTop: "24px", fontSize: "10px", color: "#b0bec8", textAlign: "center", letterSpacing: "0.3px", lineHeight: 1.5 },
};