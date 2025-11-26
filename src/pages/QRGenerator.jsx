// src/pages/QRGenerator.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../api/supabaseClient";

// Utils
const isoPlusSeconds = (s) =>
  new Date(Date.now() + Number(s || 0) * 1000).toISOString();
const newNonce = (seed) =>
  (crypto?.randomUUID?.() || `${Date.now()}-${seed}`);

const TTL_24H_SECONDS = 24 * 60 * 60; // 24 horas

export default function QRGenerator({ eventId, eventName }) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [userId, setUserId] = useState("");
  const [seed, setSeed] = useState(0); // fuerza nuevo nonce
  const canvasRef = useRef(null);

  // Carga inicial de alumnos
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: st, error: stErr } = await supabase
          .from("usuarios")
          .select("id, nombres, apellidos")
          .order("nombres", { ascending: true })
          .limit(1000);

        if (stErr) throw stErr;

        setStudents(st || []);
        if (st?.[0]?.id) setUserId(st[0].id);
      } catch (e) {
        console.error("Error cargando estudiantes para QR:", e);
        alert("No se pudieron cargar los estudiantes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Payload del QR (fijo 24h, estado ASISTIO)
  const payload = useMemo(() => {
    if (!eventId || !userId) return "";

    const issued_at = new Date().toISOString();
    const exp = isoPlusSeconds(TTL_24H_SECONDS);
    const nonce = newNonce(seed);

    return JSON.stringify({
      type: "attendance",
      table: "eventos_asistentes",
      action: "SET_ESTADO",
      new_status: "ASISTIO",
      evento_id: eventId,
      usuario_id: userId,
      issued_at,
      exp,
      nonce,
    });
  }, [eventId, userId, seed]);

  const copyToClipboard = async () => {
    try {
      if (!payload) return;
      await navigator.clipboard.writeText(payload);
      alert("Contenido del QR copiado al portapapeles.");
    } catch {
      alert("No se pudo copiar.");
    }
  };

  const downloadPng = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    let filename = "qr_asistencia";

    if (eventName) {
      filename += `_${eventName.slice(0, 20)}`;
    }

    a.href = pngUrl;
    a.download = `${filename}.png`;
    a.click();
  };

  // Si no nos pasan eventId desde el botón → empty state
  if (!eventId) {
    return (
      <div className="card">
        <h4 style={{ margin: "0 0 6px 0" }}>Generador de QR</h4>
        <p className="small" style={{ margin: 0 }}>
          Aún no se ha definido ningún evento. Selecciona un evento en el panel
          del organizador y luego abre el generador de QR.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>🧾 Generador de QR</h2>
        <p className="small" style={{ margin: "6px 0 0 0" }}>
          Este QR marca al alumno como <b>"ASISTIO"</b> en{" "}
          <code>eventos_asistentes</code>. Validez fija de{" "}
          <b>24 horas</b>.
        </p>
        <p className="small" style={{ margin: "4px 0 0 0" }}>
          Evento: <b>{eventName || `ID ${eventId}`}</b>
        </p>
      </header>

      {loading ? (
        <div className="grid">
          <div className="card" style={{ height: 120, opacity: 0.7 }} />
          <div className="card" style={{ height: 120, opacity: 0.7 }} />
        </div>
      ) : (
        <>
          {/* Selección de alumno */}
          <div className="grid" style={{ marginBottom: 12 }}>
            <div className="card">
              <label className="label">Alumno</label>
              <select
                className="select"
                style={{ marginTop: 6 }}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nombres} {st.apellidos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* QR + acciones */}
          <div className="grid" style={{ alignItems: "start" }}>
            <div
              ref={canvasRef}
              className="card qr-card"
            >
              {payload ? (
                <QRCodeCanvas value={payload} size={220} includeMargin />
              ) : (
                <div className="small" style={{ opacity: 0.8 }}>
                  Selecciona un alumno para generar el QR…
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ margin: "0 0 6px 0" }}>🎟 Detalles del QR</h4>
              <p className="small" style={{ marginBottom: 10 }}>
                • Validez fija: <b>24 horas</b> desde su generación. <br />
                • El backend/escáner debe leer el JSON y ejecutar un{" "}
                <code>UPDATE eventos_asistentes</code> donde coincidan{" "}
                <code>evento_id</code> y <code>usuario_id</code>, cambiando{" "}
                <code>estado</code> a <b>"ASISTIO"</b>.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setSeed((s) => s + 1)}
                  disabled={!payload}
                >
                  🔄 Nuevo nonce
                </button>

                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={copyToClipboard}
                  disabled={!payload}
                >
                  📋 Copiar contenido del QR
                </button>

                <button
                  className="btn btn-green"
                  type="button"
                  onClick={downloadPng}
                  disabled={!payload}
                >
                  ⬇️ Descargar PNG
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
