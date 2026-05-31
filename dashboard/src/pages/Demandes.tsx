import Navbar from "../components/Navbar";

export default function Demandes() {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Navbar />

            <main
                style={{
                    flex: 1,
                    padding: "24px",
                    backgroundColor: "#f8fafc",
                }}
            >
                <h1>Demandes</h1>
            </main>
        </div>
    );
}