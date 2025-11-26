import React, { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

// Utils locales
const isoPlusSeconds = (s) =>
  new Date(Date.now() + Number(s || 0) * 1000).toISOString();

const newNonce = (seed) =>
  (crypto?.randomUUID?.() || `${Date.now()}-${seed}`);

export default function OrganizadorGenerarQR({ eventos }) {
  const [ttl, setTtl] = useState(30);
  const [format, setFormat] = useState("json");
  const [seed, setSeed] = useState(0); // fuerza nuevo nonce

  const [eventId, setEventId] = useState(eventos?.[0]?.id || "");

  const canvasRef = useRef(null);

  const selectedEvent = useMemo(
    () => eventos.find((e) => e.id === eventId),
    [eventos, eventId]
  );

  // Construye el payload que irá dentro del QR
  const payload = useMemo(() => {
    if (!eventId) return "";
    const issued = new Date().toISOString();
    const exp = isoPlusSeconds(ttl);
    const nonce = newNonce(seed);

    if (format === "json") {
      return JSON.stringify({
        type: "attendance",
        event_id: eventId,
        issued_at: issued,
        exp,
        nonce,
      });
    }

    // formato clave=valor
    return [
      `event_id=${eventId}`,
      `issued_at=${issued}`,
      `exp=${exp}`,
      `nonce=${nonce}`,
    ].join(";");
  }, [eventId, ttl, format, seed]);

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
    if (selectedEvent?.titulo)
      filename += `_${selectedEvent.titulo.slice(0, 20)}`;
    a.href = pngUrl;
    a.download = `${filename}.png`;
    a.click();
  };

  // Si no hay eventos (empty state) con layout bonito
  if (!eventos || eventos.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h2 className="page-header-title">🧾 Generador de QR</h2>
            <p className="page-header-subtitle">
              No hay eventos disponibles todavía. Crea un evento primero para
              poder generar códigos de asistencia.
            </p>
          </div>
        </header>

        <div className="page-main">
          <div className="empty-state">
            Aún no se ha definido ningún evento en el sistema. Cuando tengas al
            menos uno, aparecerá aquí para generar su QR.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2 className="page-header-title">🧾 Generador de QR</h2>
          <p className="page-header-subtitle">
            Genera códigos QR temporales para registrar asistencia a un evento.
          </p>
        </div>
      </header>

      <div className="page-columns">
        {/* Columna principal: filtros y opciones */}
        <div className="page-main">
          {/* Selector de evento + opciones */}
          <div className="grid" style={{ marginBottom: 12 }}>
            <div className="card">
              <label className="label">Evento</label>
              <select
                className="select"
                style={{ marginTop: 6 }}
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo} — {ev.facultad} — {ev.fecha || "sin fecha"}
                  </option>
                ))}
              </select>
              {selectedEvent && (
                <div className="small" style={{ marginTop: 6 }}>
                  <span style={{ opacity: 0.9 }}>Facultad:</span>{" "}
                  {selectedEvent.facultad} ·{" "}
                  <span style={{ opacity: 0.9 }}>Modelo:</span>{" "}
                  {selectedEvent.modeloNegocio || "N/A"}
                </div>
              )}
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
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
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

          {/* Ayuda / tips abajo en la columna principal */}
          <div className="card" style={{ marginTop: 4 }}>
            <b>Tips:</b> Puedes compartir el PNG por correo o WhatsApp. Si un
            alumno llega tarde, genera un QR con TTL corto para evitar reuso.
            Mantén el navegador en <b>pantalla completa</b> al mostrar QRs.
          </div>
        </div>

        {/* Sidebar: QR + payload */}
        <aside className="page-sidebar">
          <div ref={canvasRef} className="qr-card">
            {payload ? (
              <QRCodeCanvas value={payload} size={220} includeMargin />
            ) : (
              <div className="small" style={{ opacity: 0.8 }}>
                Selecciona un evento para generar el QR…
              </div>
            )}
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <label className="label">Payload</label>
              <span className="small" style={{ opacity: 0.85 }}>
                {format.toUpperCase()} · TTL: {ttl}s
              </span>
            </div>

            <textarea
              className="codebox"
              rows={8}
              value={payload}
              readOnly
              style={{ marginTop: 6, width: "100%" }}
            />

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
              >
                🔄 Nuevo nonce
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={copyToClipboard}
                disabled={!payload}
              >
                📋 Copiar
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

            <div className="small" style={{ marginTop: 10 }}>
              Más adelante, el escáner validará <code>exp</code> y actualizará
              el estado de asistencia en la BD. Por ahora es solo demo en
              memoria.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
