// src/pages/AlumnoQRScanner.jsx
import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "../api/supabaseClient";

// Solo JSON o formato clave=valor; devolvemos { evento_id, usuario_id, ... }
function parsePayload(raw) {
  if (!raw) return null;

  // 1) Intentar JSON
  try {
    const obj = JSON.parse(raw);
    return obj;
  } catch (_) {}

  // 2) Fallback: "a=1;b=2" o "a=1&b=2"
  try {
    const qs = raw.replace(/;/g, "&");
    const params = new URLSearchParams(qs);
    const obj = {};
    for (const [k, v] of params.entries()) obj[k] = v;
    return Object.keys(obj).length ? obj : null;
  } catch {
    return null;
  }
}

// Pequeño helper para expiración
const notExpired = (expIso) =>
  !expIso ||
  (Number.isFinite(Date.parse(expIso)) &&
    Date.now() < Date.parse(expIso));

export default function AlumnoQRScanner({ currentUser, eventoId }) {
  const [status, setStatus] = useState("Apunta la cámara al QR…");
  const [lastValue, setLastValue] = useState("");
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!currentUser?.id) return null;

  const isSecure =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost");

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

      const evento_id = p.evento_id || p.event_id;
      const usuario_id = p.usuario_id || p.user_id;

      if (!evento_id || !usuario_id) {
        throw new Error("QR incompleto (faltan evento_id / usuario_id).");
      }

      // 🧍 Validamos que el QR sea para ESTE alumno
      if (String(usuario_id) !== String(currentUser.id)) {
        throw new Error("Este QR pertenece a otro alumno.");
      }

      // 🎫 Validamos que el QR sea del evento esperado (la tarjeta donde está abierto)
      if (eventoId && String(evento_id) !== String(eventoId)) {
        throw new Error("Este QR corresponde a otro evento.");
      }

      // ⏱️ Validar expiración si viene exp
      if (!notExpired(p.exp)) {
        throw new Error("El QR ha expirado. Pide uno nuevo.");
      }

      // ✅ Actualizar asistencia en eventos_asistentes → estado = "ASISTIDO"
      const { data, error } = await supabase
        .from("eventos_asistentes")
        .update({ estado: "ASISTIDO" })
        .eq("evento_id", evento_id)
        .eq("usuario_id", currentUser.id)
        .select("evento_id, usuario_id, estado")
        .maybeSingle();

      if (error) {
        console.error("Error actualizando eventos_asistentes:", error);
        throw new Error("No se pudo actualizar tu asistencia.");
      }

      if (!data) {
        throw new Error("No estabas registrado en este evento.");
      }

      setStatus("Asistencia marcada como ASISTIDO");
      setPaused(true);
      setTimeout(() => setPaused(false), 1800);
    } catch (e) {
      setStatus(`${e.message || "Error al procesar el QR"}`);
      setPaused(true);
      setTimeout(() => setPaused(false), 2200);
    } finally {
      setBusy(false);
    }
  };

  if (!isSecure) {
    return (
      <div className="card">
        <p className="small">
          Para usar la cámara, abre la app en <b>HTTPS</b> o desde{" "}
          <b>localhost</b>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="small">{status}</p>

      <div className="card" style={{ marginTop: 8, overflow: "hidden" }}>
        <Scanner
          onScan={handleScan}
          onError={() =>
            setStatus("Error al acceder a la cámara.")
          }
          paused={paused}
          scanDelay={900}
          formats={["qr_code"]}
          constraints={{ facingMode: "environment" }}
          components={{ audio: true }}
        />
      </div>

      {lastValue && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="small">
            <b>Último QR leído (debug):</b>
          </div>
          <div className="codebox" style={{ marginTop: 6 }}>
            {lastValue}
          </div>
        </div>
      )}
    </div>
  );
}
