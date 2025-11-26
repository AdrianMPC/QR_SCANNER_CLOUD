// src/pages/AlumnoMisEventos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";
import AlumnoQRScanner from "./AlumnoQRScanner";   // 👈 NUEVO IMPORT

export default function AlumnoMisEventos({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]); // filas de eventos_asistentes
  const [eventos, setEventos] = useState([]);     // filas de eventos
  const [error, setError] = useState(null);
  const [scannerEventoId, setScannerEventoId] = useState(null); // 👈 qué evento tiene el escáner abierto
  const navigate = useNavigate();

  // Cargar registros de este alumno + detalles de eventos
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Traer mis registros en eventos_asistentes
        const { data: regs, error: regsErr } = await supabase
          .from("eventos_asistentes")
          .select("evento_id, usuario_id, registrado_en, estado")
          .eq("usuario_id", currentUser.id);

        if (regsErr) {
          console.error("Error cargando eventos_asistentes:", regsErr);
          setError("No se pudieron cargar tus eventos registrados.");
          setRegistros([]);
          setEventos([]);
          setLoading(false);
          return;
        }

        if (!regs || regs.length === 0) {
          setRegistros([]);
          setEventos([]);
          setLoading(false);
          return;
        }

        setRegistros(regs);

        // 2) Obtener IDs únicos de eventos
        const ids = [...new Set(regs.map((r) => r.evento_id))];

        // 3) Traer detalles de esos eventos
        const { data: evs, error: evsErr } = await supabase
          .from("eventos")
          .select(
            "id, nombre, fecha_evento, limite_asistentes, facultad_id, modelo_negocio_id"
          )
          .in("id", ids);

        if (evsErr) {
          console.error("Error cargando eventos:", evsErr);
          setError("No se pudieron cargar los detalles de los eventos.");
          setEventos([]);
        } else {
          setEventos(evs || []);
        }
      } catch (e) {
        console.error("Fallo de conexión al cargar mis eventos:", e);
        setError("No se pudo conectar con la base de datos.");
        setRegistros([]);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Mapeo rápido evento_id → evento
  const eventosMap = useMemo(() => {
    const map = new Map();
    eventos.forEach((ev) => map.set(ev.id, ev));
    return map;
  }, [eventos]);

  const registrosEnriquecidos = useMemo(
    () =>
      registros.map((r) => ({
        ...r,
        evento: eventosMap.get(r.evento_id) || null,
      })),
    [registros, eventosMap]
  );

  return (
    <div className="page">
      <header className="page-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 className="page-header-title">Mis eventos</h2>
            <p className="page-header-subtitle">
              Aquí verás los eventos en los que te has registrado y podrás
              marcar tu asistencia escaneando un QR.
            </p>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => navigate("/alumno/eventos")}
            style={{ padding: "8px 14px" }}
          >
            ← Volver a eventos
          </button>
        </div>
      </header>

      <div className="page-main">
        {loading ? (
          <div className="empty-state">Cargando tus eventos…</div>
        ) : error ? (
          <div className="card">
            <p className="small" style={{ color: "#f97373", margin: 0 }}>
              {error}
            </p>
          </div>
        ) : registrosEnriquecidos.length === 0 ? (
          <div className="empty-state">
            Aún no te has registrado en ningún evento.
          </div>
        ) : (
          <div className="grid">
            {registrosEnriquecidos.map((r) => {
              const ev = r.evento;
              const fecha = ev?.fecha_evento
                ? new Date(ev.fecha_evento).toLocaleDateString()
                : "Sin fecha";

              const estado = r.estado || "REGISTRADO";
              const isScannerOpen = scannerEventoId === r.evento_id;

              return (
                <div
                  key={`${r.evento_id}-${r.usuario_id}`}
                  className="card"
                >
                  <h4 style={{ margin: "0 0 4px" }}>
                    {ev?.nombre || "Evento sin nombre"}
                  </h4>
                  <p className="small" style={{ margin: "0 0 4px" }}>
                    {fecha}
                  </p>
                  <p className="small" style={{ margin: "0 0 6px" }}>
                    Registro creado el{" "}
                    {r.registrado_en
                      ? new Date(r.registrado_en).toLocaleString()
                      : "N/D"}
                  </p>
                  <p className="small" style={{ margin: "0 0 8px" }}>
                    Estado: <b>{estado}</b>
                  </p>

                  {/* BOTÓN PARA MOSTRAR / OCULTAR ESCÁNER */}
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() =>
                      setScannerEventoId((prev) =>
                        prev === r.evento_id ? null : r.evento_id
                      )
                    }
                  >
                    {isScannerOpen
                      ? "Cerrar escáner"
                      : "Escanear QR de asistencia"}
                  </button>

                  {/* ESCÁNER INLINE PARA ESTE EVENTO */}
                  {isScannerOpen && (
                    <div style={{ marginTop: 12 }}>
                      <AlumnoQRScanner
                        currentUser={currentUser}
                        eventoId={r.evento_id}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
