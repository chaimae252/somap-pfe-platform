import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const SOMAP_BLUE: [number, number, number] = [18, 113, 184]; // #1271b8
const SOMAP_GREEN: [number, number, number] = [126, 201, 51]; // #7EC933
const SOMAP_RED: [number, number, number] = [173, 35, 36]; // #ad2324
const TEXT_COLOR: [number, number, number] = [25, 50, 79]; // #19324f
const MUTED_COLOR: [number, number, number] = [107, 127, 149]; // #6b7f95

// Helper to draw standard header
function drawHeader(doc: jsPDF, title: string, adminName: string) {
    // Top colored bars (SOMAP BLUE & GREEN)
    doc.setFillColor(SOMAP_BLUE[0], SOMAP_BLUE[1], SOMAP_BLUE[2]);
    doc.rect(0, 0, 210, 15, "F");

    doc.setFillColor(SOMAP_GREEN[0], SOMAP_GREEN[1], SOMAP_GREEN[2]);
    doc.rect(0, 15, 210, 2, "F");

    // Title text
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, 14, 30);

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    const dateStr = new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date());
    doc.text(`SOMAP & SERVICE — Administration Dashboard`, 14, 38);
    doc.text(`Généré le : ${dateStr} | Par : ${adminName}`, 14, 43);

    // Line separator
    doc.setDrawColor(229, 237, 245); // #e5edf5
    doc.line(14, 48, 196, 48);
}

// Helper to draw standard footer
function drawFooter(doc: jsPDF, pageNumber: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    doc.text(`Page ${pageNumber}`, 196, 285, { align: "right" });
    doc.text("SOMAP & SERVICE — Document Confidentiel — Tous droits réservés.", 14, 285);
}

// Helper to format date
function formatDate(value?: string) {
    if (!value) return "Date non disponible";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

// Helper to format date short
function formatDateShort(value?: string) {
    if (!value) return "Non définie";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

// Helper to format numbers
function formatNumber(value?: number) {
    return new Intl.NumberFormat("fr-MA").format(value ?? 0);
}

export function exportDashboardPDF(
    stats: { clients: number; demandes: number; projets: number; services: number },
    monthly: Array<{ month: string; demandes: number; projets: number }>,
    statuses: Array<{ name: string; value: number }>,
    adminName: string
) {
    const doc = new jsPDF();
    const title = "Synthèse d'Activité SOMAP & SERVICE";

    // 1. Draw Header
    drawHeader(doc, title, adminName);

    // 2. Add Stats Summary Cards (Section heading & boxes)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text("Indicateurs Clés", 14, 58);

    // Draw 4 cards side-by-side
    const cardWidth = 42;
    const cardHeight = 22;
    const startX = 14;
    const startY = 64;
    const gap = 6;

    const cards = [
        { label: "Clients", value: formatNumber(stats.clients), color: SOMAP_GREEN },
        { label: "Demandes", value: formatNumber(stats.demandes), color: [246, 183, 24] }, // gold
        { label: "Projets", value: formatNumber(stats.projets), color: SOMAP_BLUE },
        { label: "Services", value: formatNumber(stats.services), color: SOMAP_RED },
    ];

    cards.forEach((card, index) => {
        const x = startX + index * (cardWidth + gap);
        // Draw card background
        doc.setFillColor(248, 251, 255); // #f8fbff
        doc.setDrawColor(229, 237, 245); // #e5edf5
        doc.rect(x, startY, cardWidth, cardHeight, "FD");

        // Color indicator on the left side of the card
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.rect(x, startY, 2, cardHeight, "F");

        // Text inside card
        doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(card.label.toUpperCase(), x + 5, startY + 7);

        doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(card.value, x + 5, startY + 16);
    });

    // 3. Add monthly activity table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text("Activité Mensuelle (Demandes & Projets)", 14, 98);

    const monthlyRows = monthly.map((m) => [
        m.month,
        formatNumber(m.demandes),
        formatNumber(m.projets),
        formatNumber(m.demandes + m.projets),
    ]);

    autoTable(doc, {
        startY: 104,
        head: [["Mois", "Demandes reçues", "Projets lancés", "Total éléments"]],
        body: monthlyRows,
        theme: "striped",
        headStyles: { fillColor: SOMAP_BLUE },
        styles: { font: "helvetica", fontSize: 9 },
        margin: { left: 14, right: 14 },
    });

    // 4. Add demands by status table
    const nextY = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Demandes par Statut", 14, nextY);

    const totalDemands = statuses.reduce((sum, s) => sum + s.value, 0) || 1;
    const statusRows = statuses.map((s) => {
        const percentage = Math.round((s.value / totalDemands) * 100);
        let displayName = s.name;
        if (s.name === "EN_ATTENTE") displayName = "En attente";
        else if (s.name === "VALIDEE") displayName = "Validée";
        else if (s.name === "REJETEE") displayName = "Rejetée";

        return [displayName, formatNumber(s.value), `${percentage}%`];
    });

    autoTable(doc, {
        startY: nextY + 6,
        head: [["Statut de la Demande", "Nombre", "Pourcentage"]],
        body: statusRows,
        theme: "striped",
        headStyles: { fillColor: SOMAP_BLUE },
        styles: { font: "helvetica", fontSize: 9 },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
            // Draw header & footer on pages
            drawFooter(doc, data.pageNumber);
        },
    });

    doc.save(`SOMAP_Report_Dashboard_${Date.now()}.pdf`);
}

export function exportDemandesPDF(demandes: any[], adminName: string) {
    const doc = new jsPDF();
    const title = "Registre des Demandes Clients";

    const rows = demandes.map((d) => {
        let urgencyLabel = "Normal";
        if (d.urgence === "FAIBLE") urgencyLabel = "Faible";
        else if (d.urgence === "URGENT") urgencyLabel = "Urgent";

        let statusLabel = "En attente";
        if (d.statut === "VALIDEE") statusLabel = "Validée";
        else if (d.statut === "REJETEE") statusLabel = "Rejetée";

        return [
            String(d.id),
            d.objet || "Sans objet",
            d.clientNom || `Client #${d.clientId ?? "-"}`,
            d.serviceTitre || `Service #${d.serviceId ?? "-"}`,
            urgencyLabel,
            statusLabel,
            formatDate(d.dateCreation),
        ];
    });

    autoTable(doc, {
        startY: 55,
        head: [["ID", "Objet", "Client", "Service", "Priorité", "Statut", "Date de création"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: SOMAP_BLUE },
        styles: { font: "helvetica", fontSize: 8 },
        margin: { top: 55, bottom: 20, left: 14, right: 14 },
        didDrawPage: (data) => {
            drawHeader(doc, title, adminName);
            drawFooter(doc, data.pageNumber);
        },
    });

    doc.save(`SOMAP_Demandes_${Date.now()}.pdf`);
}

export function exportClientsPDF(clients: any[], adminName: string) {
    const doc = new jsPDF();
    const title = "Registre des Comptes Clients";

    const rows = clients.map((c) => [
        String(c.id),
        c.nom || "Sans nom",
        c.email || "-",
        c.telephone || "-",
        c.adresse || "-",
        `${formatNumber(c.demandesCount)} demandes / ${formatNumber(c.projetsCount)} projets`,
    ]);

    autoTable(doc, {
        startY: 55,
        head: [["ID", "Nom du Client", "Email", "Téléphone", "Adresse", "Activité (Demandes/Projets)"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: SOMAP_BLUE },
        styles: { font: "helvetica", fontSize: 8 },
        margin: { top: 55, bottom: 20, left: 14, right: 14 },
        didDrawPage: (data) => {
            drawHeader(doc, title, adminName);
            drawFooter(doc, data.pageNumber);
        },
    });

    doc.save(`SOMAP_Clients_${Date.now()}.pdf`);
}

export function exportProjetsPDF(projets: any[], adminName: string) {
    const doc = new jsPDF();
    const title = "Registre des Projets Industriels";

    const rows = projets.map((p) => {
        let statusLabel = "En cours";
        if (p.statut === "TERMINE") statusLabel = "Terminé";
        else if (p.statut === "SUSPENDU") statusLabel = "Suspendu";

        return [
            String(p.id),
            p.titre || "Sans titre",
            p.clientNom || `Client #${p.clientId ?? "-"}`,
            p.demandeObjet || `Demande #${p.demandeId ?? "-"}`,
            statusLabel,
            formatDateShort(p.dateDebut),
            formatDateShort(p.dateFin),
        ];
    });

    autoTable(doc, {
        startY: 55,
        head: [["ID", "Titre du Projet", "Client", "Demande Liée", "Statut", "Date Début", "Date Fin Prévue"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: SOMAP_BLUE },
        styles: { font: "helvetica", fontSize: 8 },
        margin: { top: 55, bottom: 20, left: 14, right: 14 },
        didDrawPage: (data) => {
            drawHeader(doc, title, adminName);
            drawFooter(doc, data.pageNumber);
        },
    });

    doc.save(`SOMAP_Projets_${Date.now()}.pdf`);
}

export function exportServicesPDF(services: any[], adminName: string) {
    const doc = new jsPDF();
    const title = "Catalogue des Prestations et Services";

    const rows = services.map((s) => [
        String(s.id),
        s.titre || "Sans titre",
        s.description || "Aucune description.",
        s.adminNom ? `Géré par : ${s.adminNom}` : "Système",
        formatNumber(s.commentCount) + " commentaires",
    ]);

    autoTable(doc, {
        startY: 55,
        head: [["ID", "Titre du Service", "Description", "Responsable", "Retours Clients"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: SOMAP_BLUE },
        styles: { font: "helvetica", fontSize: 8.5 },
        columnStyles: {
            2: { cellWidth: 90 }, // Give description more space
        },
        margin: { top: 55, bottom: 20, left: 14, right: 14 },
        didDrawPage: (data) => {
            drawHeader(doc, title, adminName);
            drawFooter(doc, data.pageNumber);
        },
    });

    doc.save(`SOMAP_Services_${Date.now()}.pdf`);
}
