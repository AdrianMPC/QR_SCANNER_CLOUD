import React, { useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "../api/supabaseClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parsePayload(raw) {
  try { return JSON.parse(raw); } catch {}
  const qs = raw.replace(/;/g, "&");
  const params = new URLSearchParams(qs);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return Object.keys(obj).length ? obj : null;
}
const notExpired = (expIso) => !expIso || (Number.isFinite(Date.parse(expIso)) && Date.now() < Date.parse(expIso));

export default function QRScanner() {
  const [status, setStatus] = useState("Apunta la cámara al QR…");
  const [lastValue, setLastValue] = useState("");
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");

  const isSecure =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost");

  // carga devices solo si el contexto permite enumerateDevices
  React.useEffect(() => {
    if (!isSecure || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices()
      .then(list => setDevices(list.filter(d => d.kind === "videoinput")))
      .catch(() => {}); // silencioso
  }, [isSecure]);

  const cameraOptions = useMemo(
    () => devices.map(d => ({ id: d.deviceId, label: d.label || `Cámara ${d.deviceId.slice(0,6)}…` })),
    [devices]
  );

  const handleScan = async (det) => {
    if (!det?.length || busy) return;
    const raw = det[0]?.rawValue?.trim();
    if (!raw || raw === lastValue) return;
    setLastValue(raw);
    setBusy(true);
    setStatus("📡 Procesando QR…");
    try {
      const p = parsePayload(raw);
      if (!p) throw new Error("Formato de QR no reconocido.");
      const evento_id = p.event_id || p.evento_id;
      const usuario_id = p.user_id || p.usuario_id;
      if (!evento_id || !usuario_id) throw new Error("QR incompleto: faltan event_id/usuario_id.");
      if (!UUID_RE.test(evento_id) || !UUID_RE.test(usuario_id)) throw new Error("IDs inválidos (UUID).");
      if (!notExpired(p.exp)) throw new Error("QR expirado. Pide uno nuevo.");

      const { error } = await supabase.from("asistencias").insert([{
        evento_id, usuario_id,
        hora_checkin: new Date().toISOString(),
        metodo: "QR",
        estado: "presente",
        valido: true,
        origen: "qr_scanner_web",
      }]);
      if (error) {
        if (error.code === "23505") setStatus("ℹ️ Ya existe check-in para este alumno y evento.");
        else throw error;
      } else {
        setStatus("✅ Asistencia registrada");
      }
      setPaused(true); setTimeout(() => setPaused(false), 1500);
    } catch (e) {
      setStatus(`❌ ${e.message || "Error al procesar el QR"}`);
      setPaused(true); setTimeout(() => setPaused(false), 2000);
    } finally { setBusy(false); }
  };

  if (!isSecure) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>📷 Escáner de Asistencia</h2>
        <div className="card">
          Para usar la cámara, abre el sitio en <b>HTTPS</b> (GitHub Pages/ngrok) o desde <b>localhost</b>.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>📷 Escáner de Asistencia</h2>
      <p className="small">{status}</p>

      {cameraOptions.length > 0 && (
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom: 12 }}>
          <select className="select" value={deviceId} onChange={(e)=>setDeviceId(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="">Cámara por defecto</option>
            {cameraOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={()=>setPaused(p=>!p)}>
            {paused ? "Reanudar" : "Pausar"} cámara
          </button>
        </div>
      )}

      <div className="card" style={{ marginTop: 8, overflow:"hidden" }}>
        <Scanner
          onScan={handleScan}
          onError={() => setStatus("⚠️ Error al acceder a la cámara.")}
          paused={paused}
          scanDelay={700}
          formats={["qr_code"]}
          constraints={{
            deviceId: deviceId || undefined,
            facingMode: deviceId ? undefined : "environment",
          }}
          components={{ audio: true, onOff: true, torch: true, zoom: true, finder: true }}
        />
      </div>

      {lastValue && (
        <div className="card" style={{ marginTop:12 }}>
          <div className="small"><b>Último QR leído:</b></div>
          <div className="codebox" style={{ marginTop: 6 }}>{lastValue}</div>
        </div>
      )}
    </div>
  );
}
