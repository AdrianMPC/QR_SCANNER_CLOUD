// src/pages/OrganizadorEventos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import QRGenerator from "./QRGenerator";

export default function OrganizadorEventos({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedEventId = location.state?.preselectedEventId || null;

  const [eventos, setEventos] = useState([]);
  const [filtroFac, setFiltroFac] = useState("Todas");
  const [filtroMod, setFiltroMod] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Carga eventos donde el usuario es ORGANIZADOR (creado o enrolado)
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userId = currentUser.id;

        // 1️⃣ Eventos CREADOS por este usuario
        const { data: ownData, error: ownErr } = await supabase
          .from("eventos")
          .select(`
            id,
            nombre,
            fecha_evento,
            limite_asistentes,
            facultad_id,
            modelo_negocio_id,
            facultades ( nombre ),
            modelos_negocio ( nombre )
          `)
          .eq("usuario_creador_id", userId);

        if (ownErr) {
          console.error("Error cargando eventos creados:", ownErr);
          throw ownErr;
        }

        const ownMapped =
          ownData?.map((ev) => ({
            id: ev.id,
            nombre: ev.nombre,
            fecha_evento: ev.fecha_evento,
            limite_asistentes: ev.limite_asistentes,
            facultadNombre: ev.facultades?.nombre || "Sin facultad",
            modeloNombre: ev.modelos_negocio?.nombre || "Sin modelo",
          })) || [];

        // 2️⃣ Eventos donde está ENROLADO como organizador
        const { data: enrolledData, error: evOrgErr } = await supabase
          .from("eventos_organizadores")
          .select(`
            evento_id,
            eventos (
              id,
              nombre,
              fecha_evento,
              limite_asistentes,
              facultad_id,
              modelo_negocio_id,
              facultades ( nombre ),
              modelos_negocio ( nombre )
            )
          `)
          .eq("usuario_id", userId);

        if (evOrgErr) {
          console.error("Error cargando eventos enrolados:", evOrgErr);
          throw evOrgErr;
        }

        const enrolledMapped =
          enrolledData?.map((row) => {
            const ev = row.eventos;
            if (!ev) return null;
            return {
              id: ev.id,
              nombre: ev.nombre,
              fecha_evento: ev.fecha_evento,
              limite_asistentes: ev.limite_asistentes,
              facultadNombre: ev.facultades?.nombre || "Sin facultad",
              modeloNombre: ev.modelos_negocio?.nombre || "Sin modelo",
            };
          }).filter(Boolean) || [];

        // 3️⃣ Unimos ambos sin duplicados
        const mapById = new Map();
        [...ownMapped, ...enrolledMapped].forEach((ev) => {
          if (!mapById.has(ev.id)) mapById.set(ev.id, ev);
        });

        const combined = Array.from(mapById.values());
        setEventos(combined);
      } catch (e) {
        console.error("Fallo de conexión al cargar eventos organizador:", e);
        setError("No se pudo conectar con la base de datos.");
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Opciones dinámicas de filtros
  const facultadesOptions = useMemo(() => {
    const set = new Set(eventos.map((e) => e.facultadNombre));
    return ["Todas", ...Array.from(set)];
  }, [eventos]);

  const modelosOptions = useMemo(() => {
    const set = new Set(eventos.map((e) => e.modeloNombre));
    return ["Todos", ...Array.from(set)];
  }, [eventos]);

  // Eventos filtrados
  const filtrados = useMemo(() => {
    return eventos.filter((ev) => {
      const okFac =
        filtroFac === "Todas" || ev.facultadNombre === filtroFac;
      const okMod =
        filtroMod === "Todos" || ev.modeloNombre === filtroMod;
      return okFac && okMod;
    });
  }, [eventos, filtroFac, filtroMod]);

  return (
    <div className="page">
      {/* HEADER */}
      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 12 }}>
          <div>
            <h2 className="page-header-title">🎛️ Panel del organizador</h2>
            <p className="page-header-subtitle">
              Consulta tus eventos (creados o enrolados) y genera códigos QR de asistencia.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/alumno/eventos")}
            >
              Ver como alumno
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/alumno/mis-eventos")}
            >
              Mis eventos (alumno)
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (onLogout) onLogout();
                navigate("/login");
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO: dos columnas */}
      <div className="page-columns">
        {/* Columna izquierda: eventos del organizador */}
        <div className="page-main">
          {loading ? (
            <div className="empty-state">
              Cargando tus eventos como organizador…
            </div>
          ) : error ? (
            <div className="card">
              <p className="small" style={{ color: "#f97373", margin: 0 }}>
                {error}
              </p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              No tienes eventos (creados o enrolados) que coincidan con estos filtros.
            </div>
          ) : (
            <div className="grid">
              {filtrados.map((ev) => {
                const fecha = ev.fecha_evento
                  ? new Date(ev.fecha_evento).toLocaleDateString()
                  : "Sin fecha";
                return (
                  <div key={ev.id} className="card">
                    <h4 style={{ margin: "0 0 4px" }}>{ev.nombre}</h4>
                    <p className="small" style={{ margin: "0 0 4px" }}>
                      {ev.facultadNombre} · {ev.modeloNombre}
                    </p>
                    <p className="small" style={{ margin: "0 0 8px" }}>
                      {fecha}
                    </p>

                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        setSelectedEventId(
                          selectedEventId === ev.id ? null : ev.id
                        )
                      }
                    >
                      {selectedEventId === ev.id ? "Cerrar QR" : "Generar QR"}
                    </button>

                    {/* Generador inline para este evento */}
                    {selectedEventId === ev.id && (
                    <div style={{ marginTop: "14px" }}>
                        <QRGenerator eventId={ev.id} eventName={ev.nombre} />
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna derecha: filtros + generador QR */}
        <aside className="page-sidebar">
          <div className="card">
            <label className="label">Filtrar por facultad</label>
            <select
              className="select"
              value={filtroFac}
              onChange={(e) => setFiltroFac(e.target.value)}
              style={{ marginTop: 6 }}
            >
              {facultadesOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <label className="label">Filtrar por modelo de negocio</label>
            <select
              className="select"
              value={filtroMod}
              onChange={(e) => setFiltroMod(e.target.value)}
              style={{ marginTop: 6 }}
            >
              {modelosOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}
