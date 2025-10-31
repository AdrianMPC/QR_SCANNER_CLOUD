import React, { useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Simple redirección por rol (sin auth)
    if (email === "admin@uep.edu") navigate("/admin");
    else if (email === "organizador@uep.edu") navigate("/organizador");
    else navigate("/asistencia");
  };

  return (
    <div className="login-container">
      <h2>🎓 Sistema de Asistencia UEP</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo institucional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}