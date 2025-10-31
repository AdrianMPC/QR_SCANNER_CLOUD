import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../api/supabaseClient";

function isoPlusSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}
function newNonce() {
  return crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

export default function QRGenerator() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);

  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [ttl, setTtl] = useState(30); // segundos de validez del QR
  const [format, setFormat] = useState("json"); // 'json' | 'kv'

  const [payload, setPayload] = useState("");
  const canvasRef = useRef(null);

  // Carga lista de eventos y estudiantes
  useEffect(() => {
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
        // autoselección si hay valores
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
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === userId),
    [students, userId]
  );

  const regenerate = () => {
    if (!eventId || !userId) {
      setPayload("");
      return;
    }
    const issued = new Date().toISOString();
    const exp = isoPlusSeconds(Number(ttl || 0));

    if (format === "json") {
      const obj = {
        type: "attendance",
        event_id: eventId,
        user_id: userId,
        issued_at: issued,
        exp,
        nonce: newNonce(),
      };
      setPayload(JSON.stringify(obj));
    } else {
      // kv: compatible con el lector actual
      const kv = [
        `evento_id=${eventId}`,
        `usuario_id=${userId}`,
        `issued_at=${issued}`,
        `exp=${exp}`,
        `nonce=${newNonce()}`,
      ].join(";");
      setPayload(kv);
    }
  };

  // Genera/renueva payload cuando cambian inputs
  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, userId, ttl, format]);

  const copyToClipboard = async () => {
    try {
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
    const link = document.createElement("a");
    link.href = pngUrl;
    let filename = "qr_asistencia";
    if (selectedEvent) filename += `_${selectedEvent.titulo?.slice(0,20)}`;
    link.download = `${filename}.png`;
    link.click();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🧾 Generador de QR — UEP</h2>

      {loading ? (
        <p>Cargando eventos y estudiantes…</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)",
              gap: 16,
              alignItems: "start",
              marginBottom: 16,
            }}
          >
            <div>
              <label style={{ fontWeight: 600 }}>Evento</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo} — {ev.facultad} — {ev.fecha}
                  </option>
                ))}
              </select>

              {selectedEvent && (
                <small style={{ color: "#444" }}>
                  Inicio: {selectedEvent.hora_inicio} | Facultad:{" "}
                  {selectedEvent.facultad}
                </small>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>Alumno</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nombre_completo} — {st.facultad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>Vigencia (segundos)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                style={{ width: 160, padding: 8, marginTop: 6 }}
              />
              <div style={{ marginTop: 6, color: "#555" }}>
                Recomendado: 15–60 s para evitar reuso del QR.
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>Formato</label>
              <div style={{ marginTop: 6 }}>
                <label style={{ marginRight: 12 }}>
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
            </div>
          </div>

          <div
            ref={canvasRef}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <div
              style={{
                padding: 16,
                border: "2px solid #004FB7",
                borderRadius: 12,
                width: 260,
                display: "grid",
                placeItems: "center",
                background: "#fff",
              }}
            >
              {payload ? (
                <QRCodeCanvas value={payload} size={220} includeMargin />
              ) : (
                <div>Selecciona evento y alumno…</div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ fontWeight: 600 }}>Payload</label>
              <textarea
                rows={8}
                value={payload}
                readOnly
                style={{
                  width: "100%",
                  padding: 12,
                  fontFamily: "monospace",
                  marginTop: 6,
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={regenerate}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: 0,
                    background: "#004FB7",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  🔄 Regenerar (nuevo nonce)
                </button>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #004FB7",
                    background: "white",
                    color: "#004FB7",
                    cursor: "pointer",
                  }}
                >
                  📋 Copiar
                </button>
                <button
                  onClick={downloadPng}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: 0,
                    background: "#0a7",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  ⬇️ Descargar PNG
                </button>
              </div>

              <div style={{ marginTop: 10, color: "#555" }}>
                Sugerencia: comparte este QR con el alumno; el escáner valida
                `exp` y registrará su asistencia con <b>metodo: "QR"</b> y{" "}
                <b>estado: "presente"</b>.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
