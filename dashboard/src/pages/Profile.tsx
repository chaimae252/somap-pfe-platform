import Navbar from "../components/Navbar";

export default function Profile() {
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
                <h1>Profile</h1>
            </main>
        </div>
    );
}