import Navbar from "../components/Navbar";

export default function Services() {
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
                <h1>Services</h1>
            </main>
        </div>
    );
}