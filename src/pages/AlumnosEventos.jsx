// src/pages/AlumnoEventos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AlumnoEventos({ currentUser }) {
  const [eventos, setEventos] = useState([]);
  const [misRegistros, setMisRegistros] = useState([]); // filas de eventos_asistentes del alumno
  const [filtroFac, setFiltroFac] = useState("Todas");
  const [filtroMod, setFiltroMod] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [loadingReg, setLoadingReg] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();        

  // Cargar eventos + mis registros desde Supabase
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Eventos con nombre de facultad y modelo de negocio
        const { data: evs, error: evsErr } = await supabase
          .from("eventos")
          .select(
            `
            id,
            nombre,
            fecha_evento,
            limite_asistentes,
            facultad_id,
            modelo_negocio_id,
            facultades ( nombre ),
            modelos_negocio ( nombre )
          `
          )
          .order("fecha_evento", { ascending: true });

        if (evsErr) {
          console.error("Error cargando eventos:", evsErr);
          setError("No se pudieron cargar los eventos.");
          setEventos([]);
          setMisRegistros([]);
          setLoading(false);
          return;
        }

        const mappedEvents =
          evs?.map((ev) => ({
            id: ev.id,
            nombre: ev.nombre,
            fecha_evento: ev.fecha_evento,
            limite_asistentes: ev.limite_asistentes,
            facultadNombre: ev.facultades?.nombre || "Sin facultad",
            modeloNombre: ev.modelos_negocio?.nombre || "Sin modelo",
          })) || [];

        setEventos(mappedEvents);

        // 2) Mis registros en eventos_asistentes
        const { data: regs, error: regsErr } = await supabase
          .from("eventos_asistentes")
          .select("evento_id, usuario_id, registrado_en")
          .eq("usuario_id", currentUser.id);

        if (regsErr) {
          console.error("Error cargando registros:", regsErr);
          setError("No se pudieron cargar tus registros.");
          setMisRegistros([]);
        } else {
          setMisRegistros(regs || []);
        }
      } catch (e) {
        console.error("Fallo de conexión a la BD (AlumnoEventos):", e);
        setError("No se pudo conectar con la base de datos.");
        setEventos([]);
        setMisRegistros([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Opciones de filtros basadas en los datos
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

  // Saber si ya estoy registrado a un evento
  const estoyRegistrado = (eventoId) =>
    misRegistros.some((r) => r.evento_id === eventoId);

  // Registrar en Supabase
  const registrarEvento = async (eventoId) => {
    if (!currentUser?.id) return;
    if (estoyRegistrado(eventoId)) return;

    setLoadingReg(true);
    try {
      const { error: insertErr } = await supabase
        .from("eventos_asistentes")
        .insert([
          {
            evento_id: eventoId,
            usuario_id: currentUser.id,
            registrado_en: new Date().toISOString(),
          },
        ]);

      if (insertErr) {
        console.error("Error registrando en evento:", insertErr);
        alert("No se pudo registrar en el evento.");
        return;
      }

      // Actualizamos estado local para reflejarlo de inmediato
      setMisRegistros((prev) => [
        ...prev,
        {
          evento_id: eventoId,
          usuario_id: currentUser.id,
          registrado_en: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error("Fallo de conexión al registrar evento:", e);
      alert("No se pudo conectar con la base de datos.");
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div>
            <h2 className="page-header-title">📅 Eventos disponibles</h2>
            <p className="page-header-subtitle">
              Selecciona y regístrate en eventos según tu interés.
            </p>
          </div>

          {/* BOTONES ACCIÓN DERECHA */}
          <div style={{ display: "flex", gap: 8 }}>
            {/* Mis eventos (alumno) */}
            <button
              className="btn btn-outline"
              onClick={() => navigate("/alumno/mis-eventos")}
              style={{ padding: "8px 14px" }}
            >
              Mis eventos
            </button>

            {/* Volver a organizador solo si tiene ese rol */}
            {currentUser?.rol === "ORGANIZADOR" && (
              <button
                className="btn btn-outline"
                onClick={() => navigate("/organizador")}
                style={{ padding: "8px 14px" }}
              >
                ← Volver a organizador
              </button>
            )}
          </div>
        </div>
      </header>



      <div className="page-columns">
        {/* COLUMNA PRINCIPAL: lista de eventos */}
        <div className="page-main">
          {loading ? (
            <div className="empty-state">Cargando eventos…</div>
          ) : error ? (
            <div className="card">
              <p className="small" style={{ color: "#f97373", margin: 0 }}>
                {error}
              </p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              No hay eventos con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid">
              {filtrados.map((ev) => {
                const registrado = estoyRegistrado(ev.id);
                const fecha = ev.fecha_evento
                  ? new Date(ev.fecha_evento).toLocaleDateString()
                  : "Sin fecha";

                return (
                  <div key={ev.id} className="card">
                    <h4 style={{ margin: "0 0 4px" }}>{ev.nombre}</h4>
                    <p className="small" style={{ margin: "0 0 6px" }}>
                      {ev.facultadNombre} · {ev.modeloNombre}
                    </p>
                    <p className="small" style={{ margin: "0 0 8px" }}>
                      {fecha}
                    </p>

                    <button
                      className={`btn ${
                        registrado ? "btn-outline" : "btn-primary"
                      }`}
                      onClick={() => registrarEvento(ev.id)}
                      disabled={registrado || loadingReg}
                    >
                      {registrado ? "Registrado ✔️" : "Registrarme"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SIDEBAR: filtros */}
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
            <label className="label">Filtrar por modelo</label>
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

          <div className="card">
            <h4>Tip</h4>
            <p className="small">
              Una vez registrado, podrás ver tus eventos en la sección{" "}
              <b>“Mis eventos”</b>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
