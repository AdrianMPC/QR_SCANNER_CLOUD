import React, { useState } from "react";

export default function OrganizadorEscaneoSimulado({ registros, marcarAsistencia }) {
  const [eventoId, setEventoId] = useState("");
  const [userId, setUserId] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h2>Simular escaneo QR</h2>

      <input
        placeholder="Evento ID"
        value={eventoId}
        onChange={e => setEventoId(e.target.value)}
      />
      <input
        placeholder="User ID"
        value={userId}
        onChange={e => setUserId(e.target.value)}
      />

      <button onClick={() => marcarAsistencia(eventoId, userId)}>
        Marcar asistencia
      </button>

      <p style={{ marginTop: 20 }}>
        Esta vista simula lo que hará el scanner QR real.
      </p>
    </div>
  );
}
