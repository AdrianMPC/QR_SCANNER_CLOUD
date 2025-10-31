import React, { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../api/supabaseClient";

// Utils
const isoPlusSeconds = (s) => new Date(Date.now() + Number(s || 0) * 1000).toISOString();
const newNonce = (seed) => (crypto?.randomUUID?.() || `${Date.now()}-${seed}`);

export default function QRGenerator() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);

  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [ttl, setTtl] = useState(30);
  const [format, setFormat] = useState("json");
  const [seed, setSeed] = useState(0); // fuerza nuevo nonce

  const canvasRef = useRef(null);

  // Carga inicial (eventos + alumnos)
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: ev, error: evErr } = await supabase
          .from("eventos")
          .select("id,titulo,fecha,hora_inicio,facultad")
          .order("fecha", { ascending: false })
          .limit(200);
        if (evErr) throw evErr;

        const { data: st, error: stErr } = await supabase
          .from("usuarios")
          .select("id,nombre_completo,facultad,rol")
          .eq("rol", "estudiante")
          .order("nombre_completo", { ascending: true })
          .limit(1000);
        if (stErr) throw stErr;

        setEvents(ev || []);
        setStudents(st || []);
        if (ev?.[0]?.id) setEventId(ev[0].id);
        if (st?.[0]?.id) setUserId(st[0].id);
      } catch (e) {
        console.error(e);
        alert("No se pudieron cargar eventos/estudiantes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );

  // Construye el payload (sin useEffect)
  const payload = useMemo(() => {
    if (!eventId || !userId) return "";
    const issued = new Date().toISOString();
    const exp = isoPlusSeconds(ttl);
    const nonce = newNonce(seed);

    if (format === "json") {
      return JSON.stringify({
        type: "attendance",
        event_id: eventId,
        user_id: userId,
        issued_at: issued,
        exp,
        nonce,
      });
    }
    return [
      `evento_id=${eventId}`,
      `usuario_id=${userId}`,
      `issued_at=${issued}`,
      `exp=${exp}`,
      `nonce=${nonce}`,
    ].join(";");
  }, [eventId, userId, ttl, format, seed]);

  const copyToClipboard = async () => {
    try {
      if (!payload) return;
      await navigator.clipboard.writeText(payload);
      alert("Payload copiado al portapapeles.");
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
    if (selectedEvent?.titulo) filename += `_${selectedEvent.titulo.slice(0, 20)}`;
    a.href = pngUrl;
    a.download = `${filename}.png`;
    a.click();
  };

  return (
    <div>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>🧾 Generador de QR</h2>
        <p className="small" style={{ margin: "6px 0 0 0" }}>
          Genera códigos QR temporales para registrar asistencia de estudiantes en eventos.
        </p>
      </header>

      {loading ? (
        <div className="grid">
          {/* skeletons simples */}
          <div className="card" style={{ height: 120, opacity: .7 }} />
          <div className="card" style={{ height: 120, opacity: .7 }} />
          <div className="card" style={{ height: 120, opacity: .7 }} />
          <div className="card" style={{ height: 120, opacity: .7 }} />
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="grid" style={{ marginBottom: 12 }}>
            <div className="card">
              <label className="label">Evento</label>
              <select
                className="select"
                style={{ marginTop: 6 }}
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo} — {ev.facultad} — {ev.fecha}
                  </option>
                ))}
              </select>
              {selectedEvent && (
                <div className="small" style={{ marginTop: 6 }}>
                  <span style={{ opacity: .9 }}>Inicio:</span> {selectedEvent.hora_inicio} ·{" "}
                  <span style={{ opacity: .9 }}>Facultad:</span> {selectedEvent.facultad}
                </div>
              )}
            </div>

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
                    {st.nombre_completo} — {st.facultad}
                  </option>
                ))}
              </select>
            </div>

            <div className="card">
              <label className="label">Vigencia del QR (segundos)</label>
              <input
                className="input"
                type="number"
                min={5}
                step={5}
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                style={{ marginTop: 6, maxWidth: 180 }}
              />
              <div className="small" style={{ marginTop: 6 }}>
                Recomendado: <b>15–60 s</b> para evitar reuso.
              </div>
            </div>

            <div className="card">
              <label className="label">Formato</label>
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                <label>
                  <input
                    type="radio"
                    name="fmt"
                    value="json"
                    checked={format === "json"}
                    onChange={() => setFormat("json")}
                  />{" "}
                  JSON (recomendado)
                </label>
                <label>
                  <input
                    type="radio"
                    name="fmt"
                    value="kv"
                    checked={format === "kv"}
                    onChange={() => setFormat("kv")}
                  />{" "}
                  clave=valor
                </label>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                JSON es más fácil de validar en el escáner.
              </div>
            </div>
          </div>

          {/* QR + Payload */}
          <div className="grid" style={{ alignItems: "start" }}>
            <div
              ref={canvasRef}
              className="card"
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 280,
                borderColor: "rgba(0,79,183,.35)",
              }}
            >
              {payload ? (
                <QRCodeCanvas value={payload} size={220} includeMargin />
              ) : (
                <div className="small" style={{ opacity: .8 }}>
                  Selecciona evento y alumno para generar el QR…
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <label className="label">Payload</label>
                <span className="small" style={{ opacity: .85 }}>
                  {format.toUpperCase()} · TTL: {ttl}s
                </span>
              </div>

              <textarea
                className="codebox"
                rows={8}
                value={payload}
                readOnly
                style={{ marginTop: 6 }}
              />

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => setSeed((s) => s + 1)}>
                  🔄 Nuevo nonce
                </button>
                <button className="btn btn-outline" onClick={copyToClipboard} disabled={!payload}>
                  📋 Copiar
                </button>
                <button className="btn btn-green" onClick={downloadPng} disabled={!payload}>
                  ⬇️ Descargar PNG
                </button>
              </div>

              <div className="small" style={{ marginTop: 10 }}>
                El escáner valida <code>exp</code> y registrará <b>metodo: "QR"</b>, <b>estado: "presente"</b>.
              </div>
            </div>
          </div>

          {/* Ayuda */}
          <div className="card" style={{ marginTop: 12 }}>
            <b>Tips:</b> Puedes compartir el PNG por correo o WhatsApp. Si un alumno llega tarde,
            genera un QR con TTL corto para evitar reuso. Mantén el navegador en <b>pantalla completa</b> al mostrar QRs.
          </div>
        </>
      )}
    </div>
  );
}
