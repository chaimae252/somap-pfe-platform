type Props = {
    title: string;
    onClick: () => void;
    type?: "primary" | "secondary";
};

export default function Button({ title, onClick, type = "primary" }: Props) {
    const isPrimary = type === "primary";

    return (
        <button
            onClick={onClick}
            style={{
                padding: "13px 20px",
                borderRadius: "13px",
                border: isPrimary ? "none" : "1.5px solid rgba(126,201,51,0.6)",
                background: isPrimary ? "#1271b8" : "rgba(126,201,51,0.06)",
                color: isPrimary ? "#ffffff" : "#4a8a10",
                fontSize: "14px",
                fontWeight: isPrimary ? 700 : 600,
                cursor: "pointer",
                width: "100%",
                letterSpacing: "0.2px",
                boxShadow: isPrimary ? "0 4px 16px rgba(18,113,184,0.28)" : "none",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget;
                if (isPrimary) {
                    el.style.transform = "translateY(-1px)";
                    el.style.boxShadow = "0 8px 24px rgba(18,113,184,0.38)";
                } else {
                    el.style.backgroundColor = "rgba(126,201,51,0.13)";
                    el.style.borderColor = "#7EC933";
                }
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (isPrimary) {
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "0 4px 16px rgba(18,113,184,0.28)";
                } else {
                    el.style.backgroundColor = "rgba(126,201,51,0.06)";
                    el.style.borderColor = "rgba(126,201,51,0.6)";
                }
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = isPrimary ? "translateY(-1px)" : "translateY(0)"; }}
        >
            {title}
        </button>
    );
}