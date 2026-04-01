import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Pages
import Login from "./pages/Login";
import ReceptionDashboard from "./pages/reception/ReceptionDashboard";
import NurseDashboard from "./pages/nurse/NurseDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import LabDashboard from "./pages/lab/LabDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RadiologyDashboard from "./pages/radiology/RadiologyDashboard";

// Protected route component
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div className="appShell">
        <Routes>
          {/* LOGIN */}
          <Route path="/" element={<Login />} />

          {/* RECEPTION */}
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRole="reception">
                <ReceptionDashboard />
              </ProtectedRoute>
            }
          />

          {/* NURSE */}
          <Route
            path="/nurse"
            element={
              <ProtectedRoute allowedRole="nurse">
                <NurseDashboard />
              </ProtectedRoute>
            }
          />

          {/* DOCTOR */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* LAB */}
          <Route
            path="/lab"
            element={
              <ProtectedRoute allowedRole="lab">
                <LabDashboard />
              </ProtectedRoute>
            }
          />

          {/* PHARMACY */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRole="pharmacy">
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />

          {/* RADIOLOGY */}
          <Route
            path="/radiology"
            element={
              <ProtectedRoute allowedRole="radiology">
                <RadiologyDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* UNKNOWN ROUTE */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;