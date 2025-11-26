// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import bcrypt from "bcryptjs";

export default function Login({ onAuth }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");

  const [emailOrUser, setEmailOrUser] = useState(""); // puede ser correo o usuario
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [rol, setRol] = useState("ESTUDIANTE");
  const [facultad, setFacultad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const FACULTADES = [
    "Ingeniería",
    "Administración",
    "Derecho",
    "Psicología",
    "Otra",
  ];

  const logError = (msg, err = null) => {
    const entry = {
      time: new Date().toISOString(),
      message: msg,
      details: err ? JSON.stringify(err) : null,
    };
    console.error("📛 LOG BD:", entry);
    setLogs((prev) => [...prev, entry]);
  };

  const resetForm = () => {
    setEmailOrUser("");
    setNombreCompleto("");
    setFacultad("");
    setTelefono("");
    setPassword("");
  };

  const isEstudiante = rol === "ESTUDIANTE";
  const isOrganizador = rol === "ORGANIZADOR";

  // 🔀 Decide a qué página ir según el rol
  const goAfterAuth = (rolNombre) => {
    if (rolNombre === "ESTUDIANTE") {
      navigate("/alumno/eventos");
    } else if (rolNombre === "ORGANIZADOR") {
      navigate("/organizador");
    } else {
      navigate("/");
    }
  };

  // --- Helpers BD ---

  const fetchRolId = async (rolNombre) => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id")
        .eq("nombre", rolNombre)
        .maybeSingle();

      if (error) {
        logError(`Error obteniendo rol "${rolNombre}"`, error);
        throw new Error("No se pudo obtener el rol desde la base de datos.");
      }
      if (!data) {
        logError(`El rol "${rolNombre}" no existe en la BD.`);
        throw new Error(`El rol "${rolNombre}" no existe en la BD.`);
      }
      return data.id;
    } catch (err) {
      logError("Fallo de conexión al obtener rol", err);
      throw err;
    }
  };

  const fetchFacultadIdOrNull = async (facultadNombre) => {
    try {
      if (!facultadNombre) return null;

      const { data, error } = await supabase
        .from("facultades")
        .select("id")
        .eq("nombre", facultadNombre)
        .maybeSingle();

      if (error) {
        logError("Error buscando facultad", error);
        return null;
      }
      return data?.id ?? null;
    } catch (err) {
      logError("Fallo al obtener facultad (conexión perdida)", err);
      return null;
    }
  };

  // --- SUBMIT ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!password) {
      alert("Ingresa tu contraseña.");
      setLoading(false);
      return;
    }

    try {
      const rolId = await fetchRolId(rol);

      if (mode === "login") {
        // ===== LOGIN =====
        let user;
        try {
          let query = supabase
            .from("usuarios")
            .select(
              "id, username, nombres, apellidos, telefono, correo, facultad_id, rol_id, password"
            )
            .eq("rol_id", rolId);

          // Estudiante: busca por correo
          // Organizador: busca por username
          if (isEstudiante) {
            query = query.eq("correo", emailOrUser);
          } else if (isOrganizador) {
            query = query.eq("username", emailOrUser);
          }

          const response = await query.maybeSingle();

          if (response.error) {
            logError("Error en consulta Login → usuarios", response.error);
            alert("Error al consultar datos del usuario.");
            return;
          }
          user = response.data;
        } catch (err) {
          logError("Fallo de conexión durante LOGIN", err);
          alert("⚠ No se pudo conectar con la base de datos.");
          return;
        }

        if (!user) {
          alert("Usuario no encontrado.");
          return;
        }

        if (!user.password) {
          alert("Este usuario no tiene contraseña registrada.");
          return;
        }

        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) {
          alert("Contraseña incorrecta.");
          return;
        }

        const loggedUser = {
          id: user.id,
          email: user.correo,
          username: user.username,
          nombreCompleto:
            user.nombres && user.apellidos
              ? `${user.nombres} ${user.apellidos}`
              : user.nombres || user.apellidos || "",
          rol,
          facultad: user.facultad_id || null,
          telefono: user.telefono || "",
        };

        onAuth && onAuth(loggedUser);
        goAfterAuth(rol);
        return;
      }

      // ===== REGISTRO =====
      let facultadId = null;
      if (isEstudiante) {
        facultadId = await fetchFacultadIdOrNull(facultad);
      }

      // Para estudiante:
      //   - correo = emailOrUser
      //   - username = parte antes del @
      // Para organizador:
      //   - username = emailOrUser (usuario)
      //   - correo = emailOrUser (puede no ser un correo real, la BD no valida)
      let usernameToSave;
      let correoToSave;

      if (isEstudiante) {
        correoToSave = emailOrUser;
        usernameToSave = emailOrUser.includes("@")
          ? emailOrUser.split("@")[0]
          : emailOrUser;
      } else {
        usernameToSave = emailOrUser;
        correoToSave = emailOrUser;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      let newUserRow;
      try {
        const response = await supabase
          .from("usuarios")
          .insert([
            {
              correo: correoToSave,
              username: usernameToSave,
              nombres: nombreCompleto,
              apellidos: "",
              telefono: telefono || "",
              rol_id: rolId,
              facultad_id: facultadId,
              password: passwordHash,
            },
          ])
          .select("id, nombres, telefono, correo, facultad_id, username")
          .single();

        if (response.error) {
          logError("Error insertando nuevo usuario", response.error);
          alert("No se pudo registrar el usuario.");
          return;
        }
        newUserRow = response.data;
      } catch (err) {
        logError("Fallo de conexión durante REGISTRO", err);
        alert("⚠ No se pudo conectar con la base de datos.");
        return;
      }

      const newUser = {
        id: newUserRow.id,
        email: newUserRow.correo,
        username: newUserRow.username,
        nombreCompleto: newUserRow.nombres,
        rol,
        facultad: newUserRow.facultad_id || null,
        telefono: newUserRow.telefono || "",
      };

      onAuth && onAuth(newUser);
      goAfterAuth(rol);
    } catch (err) {
      logError("Error general en el flujo de login/registro", err);
      alert(err.message || "Ha ocurrido un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---

  const labelIdentidad = isOrganizador ? "Usuario" : "Correo";
  const placeholderIdentidad = isOrganizador
    ? "usuario.organizador"
    : "correo@ejemplo.com";
  const inputType = isOrganizador ? "text" : "email";

  return (
    <div className="page">
      <div className="login-container">
        <h2 style={{ marginBottom: 4 }}>Login / Registro</h2>
        <p className="small" style={{ marginBottom: 20 }}>
          Ingresa o crea una cuenta para continuar.
        </p>

        {/* TABS */}
        <div className="login-tabs">
          <button
            type="button"
            className={`btn ${mode === "login" ? "btn-primary" : ""}`}
            onClick={() => {
              setMode("login");
              resetForm();
            }}
            disabled={loading}
          >
            Ingresar
          </button>

          <button
            type="button"
            className={`btn ${mode === "register" ? "btn-primary" : ""}`}
            onClick={() => {
              setMode("register");
              resetForm();
            }}
            disabled={loading}
          >
            Registrarme
          </button>
        </div>

        {/* FORM */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* CORREO / USUARIO */}
          <div className="form-row">
            <label className="label">{labelIdentidad}</label>
            <input
              className="input"
              type={inputType}
              placeholder={placeholderIdentidad}
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* CONTRASEÑA */}
          <div className="form-row">
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* ROL / NOMBRE */}
          <div className="form-row form-row-inline">
            <div className="form-col">
              <label className="label">Rol</label>
              <select
                className="select"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                disabled={loading}
              >
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="ORGANIZADOR">Organizador</option>
              </select>
            </div>

            {mode === "register" && (
              <div className="form-col">
                <label className="label">Nombre completo</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Tu nombre y apellidos"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* FACULTAD + TEL PARA ESTUDIANTE */}
          {mode === "register" && isEstudiante && (
            <>
              <div className="form-row">
                <label className="label">Facultad</label>
                <select
                  className="select"
                  value={facultad}
                  onChange={(e) => setFacultad(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione...</option>
                  {FACULTADES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="label">Número de teléfono</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="999 999 999"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div style={{ marginTop: "12px" }} />

          <button
            className="btn btn-primary login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Ingresar"
              : "Registrarme"}
          </button>
        </form>

        {/* LOGS DEBUG (opcional) */}
        {logs.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h4>Logs recientes</h4>
            <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
              {logs
                .map(
                  (l) =>
                    `[${l.time}]\n${l.message}\n${l.details ?? ""}\n---------`
                )
                .join("\n")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
