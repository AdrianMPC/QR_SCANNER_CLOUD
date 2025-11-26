// src/pages/Eventos.jsx
import React, { useMemo, useState } from "react";

const MOCK_EVENTOS = [
  {
    id: "e1",
    titulo: "Charla de IA aplicada a la educación",
    facultad: "Ingeniería",
    modeloNegocio: "Universidad",
    fecha: "2025-12-01",
    hora: "18:00",
    lugar: "Auditorio Principal",
  },
  {
    id: "e2",
    titulo: "Feria de emprendimiento universitario",
    facultad: "Administración",
    modeloNegocio: "Startup",
    fecha: "2025-12-03",
    hora: "16:00",
    lugar: "Patio central",
  },
  {
    id: "e3",
    titulo: "Taller de habilidades blandas para abogados",
    facultad: "Derecho",
    modeloNegocio: "Empresa aliada",
    fecha: "2025-12-05",
    hora: "19:00",
    lugar: "Sala 302",
  },
];

const FACULTADES = ["Todas", "Ingeniería", "Administración", "Derecho"];
const MODELOS_NEGOCIO = [
  "Todos",
  "Universidad",
  "Sede / Campus",
  "Empresa aliada",
  "Startup",
  "Proveedor externo",
  "Otro",
];

export default function Eventos({ currentUser }) {
  const [filtroFacultad, setFiltroFacultad] = useState("Todas");
  const [filtroModelo, setFiltroModelo] = useState("Todos");
  const [registrados, setRegistrados] = useState([]);

  const eventosFiltrados = useMemo(() => {
    return MOCK_EVENTOS.filter((ev) => {
      const matchFacultad =
        filtroFacultad === "Todas" || ev.facultad === filtroFacultad;
      const matchModelo =
        filtroModelo === "Todos" || ev.modeloNegocio === filtroModelo;
      return matchFacultad && matchModelo;
    });
  }, [filtroFacultad, filtroModelo]);

  const handleRegistro = (eventoId) => {
    setRegistrados((prev) =>
      prev.includes(eventoId) ? prev : [...prev, eventoId]
    );
  };

  const eventosRegistrados = MOCK_EVENTOS.filter((ev) =>
    registrados.includes(ev.id)
  );

  return (
    <div className="page">
      {/* HEADER */}
      <header className="page-header">
        <div>
          <h2 className="page-header-title">📅 Registro de eventos</h2>
          <p className="page-header-subtitle">
            Hola{" "}
            <b>{currentUser?.nombreCompleto || currentUser?.email}</b>, explora
            y regístrate en eventos disponibles.
          </p>
        </div>
      </header>

      {/* LAYOUT: columna izquierda = eventos, derecha = filtros */}
      <div className="page-columns">
        {/* === COLUMNA PRINCIPAL === */}
        <div className="page-main">
          {/* EVENTOS DISPONIBLES */}
          <section>
            <h3 style={{ marginBottom: 10 }}>Eventos disponibles</h3>

            {eventosFiltrados.length === 0 ? (
              <div className="empty-state">
                No hay eventos que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <div className="grid">
                {eventosFiltrados.map((ev) => {
                  const yaRegistrado = registrados.includes(ev.id);

                  return (
                    <div key={ev.id} className="card">
                      <h4 style={{ margin: "0 0 4px" }}>{ev.titulo}</h4>

                      <p className="small" style={{ margin: "0 0 6px" }}>
                        <b>Facultad:</b> {ev.facultad} · <b>Modelo:</b>{" "}
                        {ev.modeloNegocio}
                      </p>

                      <p className="small" style={{ margin: "0 0 12px" }}>
                        {ev.fecha} · {ev.hora} · {ev.lugar}
                      </p>

                      <button
                        className={`btn ${
                          yaRegistrado ? "btn-outline" : "btn-primary"
                        }`}
                        onClick={() => handleRegistro(ev.id)}
                        disabled={yaRegistrado}
                      >
                        {yaRegistrado ? "Ya registrado ✔️" : "Registrarme"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* MIS EVENTOS */}
          <section style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 10 }}>Mis eventos registrados</h3>

            {eventosRegistrados.length === 0 ? (
              <div className="empty-state">
                Aún no te has registrado en ningún evento. Regístrate desde la
                lista superior.
              </div>
            ) : (
              <div className="grid">
                {eventosRegistrados.map((ev) => (
                  <div key={ev.id} className="card">
                    <h4 style={{ margin: "0 0 4px" }}>{ev.titulo}</h4>
                    <p className="small" style={{ margin: "0 0 4px" }}>
                      {ev.fecha} · {ev.hora} · {ev.lugar}
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      Inscripción registrada en esta sesión ✔️
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* === SIDEBAR DERECHA → FILTROS === */}
        <aside className="page-sidebar">
          <div className="card">
            <label className="label">Filtrar por facultad</label>
            <select
              className="select"
              value={filtroFacultad}
              onChange={(e) => setFiltroFacultad(e.target.value)}
              style={{ marginTop: 6 }}
            >
              {FACULTADES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <label className="label">Filtrar por modelo</label>
            <select
              className="select"
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
              style={{ marginTop: 6 }}
            >
              {MODELOS_NEGOCIO.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <h4>Consejo</h4>
            <p className="small">
              Los filtros te ayudarán a encontrar eventos específicos por
              facultad o tipo de organización.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
