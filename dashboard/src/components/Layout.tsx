import Navbar from "./Navbar";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Navbar />

            <main
                style={{
                    flex: 1,
                    padding: "24px",
                    background: "#f8fafc",
                }}
            >
                {children}
            </main>
        </div>
    );
}