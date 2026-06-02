import { Routes, Route } from "react-router-dom";

import AdminEntry from "../pages/AdminEntry";
import Dashboard from "../pages/Dashboard";
import Clients from "../pages/Clients";
import Demandes from "../pages/Demandes";
import Projets from "../pages/Projets";
import Services from "../pages/Services";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import RegisterAdmin from "../pages/RegisterAdmin";
import Login from "../pages/Login";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<AdminEntry />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterAdmin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/demandes" element={<Demandes />} />
            <Route path="/projets" element={<Projets />} />
            <Route path="/services" element={<Services />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
    );
}
