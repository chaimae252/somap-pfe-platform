import { Routes, Route } from "react-router-dom";

import AdminEntry from "../pages/AdminEntry";
import Dashboard from "../pages/Dashboard";
import Clients from "../pages/Clients";
import Demandes from "../pages/Demandes";
import Projets from "../pages/Projets";
import Services from "../pages/Services";
import Profile from "../pages/Profile";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<AdminEntry />} />
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/register" element={<div>Register admin</div>} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/demandes" element={<Demandes />} />
            <Route path="/projets" element={<Projets />} />
            <Route path="/services" element={<Services />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
    );
}