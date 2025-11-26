// src/App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AlumnoEventos from "./pages/AlumnosEventos"
import AlumnoMisEventos from "./pages/AlumnosMisEventos";
import OrganizadorEventos from "./pages/OrganizadorEventos";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleAuth = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="app">
      <div className="bg-gradient" />

      <main className="app-main">
        <Routes>
          {/* LOGIN */}
          <Route path="/login" element={<Login onAuth={handleAuth} />} />

          {/* ALUMNO - EVENTOS DISPONIBLES */}
          <Route
            path="/alumno/eventos"
            element={
              currentUser
                ? <AlumnoEventos currentUser={currentUser} />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/alumno/mis-eventos"
            element={
              currentUser
                ? <AlumnoMisEventos currentUser={currentUser} />
                : <Navigate to="/login" replace />
            }
          />

          {/* ORGANIZADOR - PANEL (ver eventos y generar QR) */}
          <Route
            path="/organizador"
            element={
              currentUser?.rol === "ORGANIZADOR" ? (
                <OrganizadorEventos
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* RUTA POR DEFECTO */}
          <Route
            path="/"
            element={
              currentUser ? (
                currentUser.rol === "ESTUDIANTE" ? (
                  <Navigate to="/alumno/eventos" replace />
                ) : (
                  <Navigate to="/organizador" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}
