import { Routes, Route } from "react-router-dom";
import AdminEntry from "../pages/AdminEntry";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<AdminEntry />} />
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/register" element={<div>Register admin</div>} />
        </Routes>
    );
}