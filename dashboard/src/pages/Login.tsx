import type { CSSProperties, FormEvent } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SomapBackground from "../components/SomapBackground";
import Button from "../components/Button";
import api from "../api/api";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }

  return fallback;
}

export default function Login() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        motDePasse: password,
      });

      const { token, refreshToken, role, nom, id, email: accountEmail } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", nom);
      localStorage.setItem("userId", id.toString());
      if (accountEmail) localStorage.setItem("userEmail", accountEmail);

      if (role === "ADMIN") {
        navigate("/dashboard");
      } else {
        setError("Accès réservé aux administrateurs.");
        localStorage.clear();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Échec de connexion. Vérifiez vos identifiants."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SomapBackground>
      <div style={styles.card}>
        <div style={styles.accentBar} />
        <h2 style={styles.title}>Connexion Administrateur</h2>

        <form ref={formRef} onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={styles.input}
          />

          <div style={styles.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ ...styles.input, ...styles.passwordInput }}
            />
            <button
              type="button"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShowPassword((value) => !value)}
              style={styles.eyeButton}
            >
              {showPassword ? (
                <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.buttonBox}>
            <Button
              title={loading ? "Connexion..." : "Se connecter"}
              type="primary"
              onClick={() => formRef.current?.requestSubmit()}
            />
          </div>
        </form>

        <p style={styles.footer}>
          Vous n'avez pas de compte ?{" "}
          <button type="button" style={styles.link} onClick={() => navigate("/register")}>
            Créer un administrateur
          </button>
        </p>
      </div>
    </SomapBackground>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    position: "relative",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: "22px",
    padding: "0 36px 32px",
    maxWidth: "380px",
    width: "100%",
    boxShadow: "0 4px 32px rgba(18,113,184,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
    overflow: "hidden",
  },
  accentBar: {
    width: "calc(100% + 72px)",
    height: "4px",
    background: "linear-gradient(90deg, #7EC933 0%, #1271b8 100%)",
    marginBottom: "32px",
    marginLeft: "-36px",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
    color: "#1271b8",
    fontWeight: 800,
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: "48px",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#6b7f95",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  buttonBox: { marginTop: "8px" },
  error: { color: "red", fontSize: "13px", textAlign: "center" },
  footer: { marginTop: "24px", fontSize: "13px", textAlign: "center", color: "#6b7f95" },
  link: {
    border: "none",
    background: "transparent",
    color: "#1271b8",
    cursor: "pointer",
    fontWeight: 700,
    padding: 0,
    fontFamily: "inherit",
  },
};
