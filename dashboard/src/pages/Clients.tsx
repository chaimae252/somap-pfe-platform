import { useState } from "react";
import Navbar from "../components/Navbar";
import SomapBackground from "../components/SomapBackground";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type Status = "Actif" | "Premium" | "Nouveau";

interface Client {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    city: string;
    demandes: number;
    projets: number;
    status: Status;
    lastActivity: string;
}

const clients: Client[] = [
    { id: "CL-001", name: "Chaimae Hakam",     company: "Atlas Metal Solutions", email: "chaimaahakam@gmail.com",       phone: "0762503231", city: "Kenitra",     demandes: 8,  projets: 2, status: "Actif",   lastActivity: "Aujourd'hui" },
    { id: "CL-002", name: "Yassine El Amrani", company: "Nord Industrie",        email: "yassine@nord-industrie.ma",    phone: "0661849205", city: "Tanger",      demandes: 5,  projets: 1, status: "Actif",   lastActivity: "Hier" },
    { id: "CL-003", name: "Salma Bennani",     company: "Bennani Equipements",   email: "salma@bennani-eq.ma",          phone: "0614378902", city: "Casablanca",  demandes: 12, projets: 4, status: "Premium", lastActivity: "24 mai 2026" },
    { id: "CL-004", name: "Omar Rifi",         company: "Rifi Maintenance",      email: "omar.rifi@maintenance.ma",     phone: "0700451882", city: "Rabat",       demandes: 3,  projets: 0, status: "Nouveau", lastActivity: "20 mai 2026" },
    { id: "CL-005", name: "Imane Zahraoui",    company: "Zahraoui Chimie",       email: "imane@zahraoui-chimie.ma",     phone: "0655107234", city: "Mohammedia",  demandes: 7,  projets: 3, status: "Actif",   lastActivity: "18 mai 2026" },
    { id: "CL-006", name: "Karim Benali",      company: "Eau & Solutions",        email: "k.benali@eausolutions.ma",     phone: "0683456789", city: "Fès",         demandes: 4,  projets: 1, status: "Actif",   lastActivity: "15 mai 2026" },
    { id: "CL-007", name: "Nadia Berrada",     company: "BioChim Maroc",          email: "nberrada@biochim.ma",          phone: "0666789012", city: "Agadir",      demandes: 9,  projets: 3, status: "Premium", lastActivity: "12 mai 2026" },
];

const STATUS_STYLE: Record<Status, { color: string; background: string }> = {
    Premium: { color: "#8a5a00", background: "#fff4d6" },
    Nouveau: { color: SOMAP_BLUE, background: "rgba(18,113,184,0.10)" },
    Actif:   { color: "#2f7d32", background: "rgba(126,201,51,0.15)" },
};

const FILTER_TABS: Array<"Tous" | Status> = ["Tous", "Actif", "Premium", "Nouveau"];

function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function Clients() {
    const [search, setSearch]     = useState("");
    const [activeTab, setActiveTab] = useState<"Tous" | Status>("Tous");

    const filtered = clients.filter((c) => {
        const matchTab = activeTab === "Tous" || c.status === activeTab;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q);
        return matchTab && matchSearch;
    });

    return (
        <SomapBackground style={styles.shell}>
            <Navbar />

            <main style={styles.main}>
                {/* Header */}
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Clients</h1>
                        <p style={styles.subtitle}>Suivi des comptes clients, demandes et projets associés.</p>
                    </div>
                    <button style={styles.primaryButton}>
                        <span style={styles.btnPlus}>+</span>
                        Nouveau client
                    </button>
                </section>

                {/* Stats */}
                <section style={styles.statsGrid}>
                    {[
                        { label: "Total clients",  value: clients.length,                                         helper: "+2 ce mois",           tone: "blue"  },
                        { label: "Actifs",         value: clients.filter(c => c.status === "Actif").length,        helper: "du portefeuille",      tone: "green" },
                        { label: "Demandes",       value: clients.reduce((s, c) => s + c.demandes, 0),             helper: "Toutes périodes",      tone: "blue"  },
                        { label: "Projets liés",   value: clients.reduce((s, c) => s + c.projets, 0),              helper: "En suivi",             tone: "green" },
                    ].map((s) => (
                        <div key={s.label} style={styles.statCard}>
                            <div style={{ ...styles.statIcon, background: s.tone === "green" ? "rgba(126,201,51,0.14)" : "rgba(18,113,184,0.12)", color: s.tone === "green" ? SOMAP_GREEN : SOMAP_BLUE }}>
                                {s.tone === "green" ? "✓" : "◈"}
                            </div>
                            <div>
                                <p style={styles.statLabel}>{s.label}</p>
                                <strong style={styles.statValue}>{s.value}</strong>
                                <p style={styles.statHelper}>{s.helper}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Toolbar */}
                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIconEl}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher par nom, entreprise, email ou ville…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
                        )}
                    </div>
                    <div style={styles.filters}>
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{ ...styles.filterButton, ...(activeTab === tab ? styles.filterButtonActive : {}) }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Table card */}
                <section style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Liste des clients</h2>
                            <p style={styles.sectionSubtitle}>
                                {filtered.length === clients.length
                                    ? `${clients.length} clients au total`
                                    : `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} sur ${clients.length}`}
                            </p>
                        </div>
                        <span style={styles.countBadge}>{filtered.length} clients</span>
                    </div>

                    {/* Head row */}
                    <div style={{ ...styles.row, ...styles.headRow }}>
                        <span>Client</span>
                        <span>Contact</span>
                        <span>Ville</span>
                        <span>Activité</span>
                        <span>Statut</span>
                    </div>

                    {filtered.length > 0 ? filtered.map((client, i) => (
                        <div
                            key={client.id}
                            style={{ ...styles.row, ...(i === filtered.length - 1 ? { borderBottom: "none" } : {}) }}
                        >
                            <div style={styles.clientCell}>
                                <div style={styles.avatar}>{initials(client.name)}</div>
                                <div style={{ minWidth: 0 }}>
                                    <strong style={styles.clientName}>{client.name}</strong>
                                    <p style={styles.company}>{client.company}</p>
                                </div>
                            </div>

                            <div style={{ minWidth: 0 }}>
                                <p style={{ ...styles.primaryText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.email}</p>
                                <p style={styles.secondaryText}>{client.phone}</p>
                            </div>

                            <span style={styles.primaryText}>{client.city}</span>

                            <div style={styles.activityCell}>
                                <span style={styles.primaryText}>{client.demandes} demandes</span>
                                <span style={styles.secondaryText}>{client.projets} projets</span>
                            </div>

                            <span style={{ ...styles.statusBadge, ...STATUS_STYLE[client.status] }}>
                {client.status}
              </span>
                        </div>
                    )) : (
                        <div style={styles.emptyState}>
                            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Aucun client ne correspond à votre recherche.</p>
                            <button style={styles.resetBtn} onClick={() => { setSearch(""); setActiveTab("Tous"); }}>Réinitialiser les filtres</button>
                        </div>
                    )}
                </section>
            </main>
        </SomapBackground>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100%",
        height: "100dvh",
        minHeight: "100dvh",
        overflow: "hidden",
    },
    main: {
        flex: 1,
        padding: 28,
        overflowY: "auto",
        overflowX: "hidden",
        height: "100dvh",
        minWidth: 0,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 18,
        marginBottom: 22,
    },
    eyebrow: {
        display: "block",
        color: SOMAP_BLUE,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.1,
        marginBottom: 6,
    },
    title: {
        margin: 0,
        fontSize: 32,
        lineHeight: 1.1,
        color: TEXT,
    },
    subtitle: {
        marginTop: 6,
        color: MUTED,
        fontSize: 13,
    },
    primaryButton: {
        border: "none",
        background: SOMAP_BLUE,
        color: "#fff",
        height: 42,
        padding: "0 18px",
        borderRadius: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        flexShrink: 0,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    btnPlus: {
        width: 20,
        height: 20,
        borderRadius: 10,
        background: "rgba(255,255,255,0.22)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        lineHeight: 1,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
        gap: 14,
        marginBottom: 18,
    },
    statCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: 900,
        flexShrink: 0,
    },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11 },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        marginBottom: 18,
    },
    searchBox: {
        flex: 1,
        height: 44,
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 14px",
    },
    searchIconEl: { color: SOMAP_BLUE, fontSize: 19, fontWeight: 900, flexShrink: 0 },
    searchInput: {
        flex: 1,
        border: "none",
        outline: "none",
        fontSize: 13,
        color: TEXT,
        background: "transparent",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    clearBtn: {
        border: "none",
        background: "none",
        cursor: "pointer",
        color: MUTED,
        fontSize: 13,
        padding: "0 2px",
        lineHeight: 1,
        flexShrink: 0,
    },
    filters: { display: "flex", gap: 8 },
    filterButton: {
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: MUTED,
        height: 38,
        padding: "0 14px",
        borderRadius: 999,
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    filterButtonActive: {
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderColor: "rgba(18,113,184,0.22)",
        fontWeight: 700,
    },
    tableCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        overflow: "hidden",
    },
    tableHeader: {
        padding: "16px 20px",
        borderBottom: "1px solid #edf2f7",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 600 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    countBadge: {
        background: "rgba(126,201,51,0.16)",
        color: "#3f8619",
        fontSize: 12,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 10px",
    },
    row: {
        display: "grid",
        gridTemplateColumns: "minmax(180px, 1.5fr) minmax(190px, 1.6fr) minmax(80px, 0.7fr) minmax(110px, 0.9fr) minmax(80px, 0.6fr)",
        gap: 14,
        alignItems: "center",
        padding: "13px 20px",
        borderBottom: "1px solid #edf2f7",
    },
    headRow: {
        background: "#f8fbff",
        color: "#7890a8",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        paddingTop: 11,
        paddingBottom: 11,
    },
    clientCell: { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${SOMAP_BLUE}, ${SOMAP_GREEN})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
    },
    clientName: { color: TEXT, fontSize: 13, fontWeight: 600 },
    company: { margin: "2px 0 0", color: MUTED, fontSize: 12 },
    primaryText: { margin: 0, color: TEXT, fontSize: 13, fontWeight: 600 },
    secondaryText: { margin: "3px 0 0", color: "#8b9aad", fontSize: 12 },
    activityCell: { display: "flex", flexDirection: "column" },
    statusBadge: {
        justifySelf: "start",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 700,
    },
    emptyState: {
        padding: "48px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
    },
    resetBtn: {
        border: "none",
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
};
