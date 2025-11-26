// src/pages/OrganizadorHome.jsx
import { Link } from "react-router-dom";

export default function OrganizadorHome({ eventos }) {
  return (
    <div className="page">
      {/* HEADER */}
      <header className="page-header">
        <div>
          <h2 className="page-header-title">🎛️ Panel del Organizador</h2>
          <p className="page-header-subtitle">
            Gestiona la generación de QRs y el escaneo de asistencias.
          </p>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="page-columns">
        {/* COLUMNA PRINCIPAL */}
        <div className="page-main">
          <div className="grid">
            {/* Generar QR */}
            <Link
              to="/organizador/generar-qr"
              className="card"
              style={{
                borderColor: "rgba(56,189,248,.45)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 34 }}>🧾</div>
                <div>
                  <h3 style={{ margin: 0 }}>Generar QR</h3>
                  <p className="small" style={{ margin: 0 }}>
                    Crea códigos QR temporales para asistencia.
                  </p>
                </div>
              </div>
            </Link>

            {/* Simular escaneo */}
            <Link
              to="/organizador/simular-escaneo"
              className="card"
              style={{
                borderColor: "rgba(129,140,248,.5)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 34 }}>🎯</div>
                <div>
                  <h3 style={{ margin: 0 }}>Simular escaneo</h3>
                  <p className="small" style={{ margin: 0 }}>
                    Prueba el flujo de asistencia sin usar cámara.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* SIDEBAR DERECHA */}
        <aside className="page-sidebar">
          <div className="card">
            <h4>Acerca del panel</h4>
            <p className="small">
              Desde aquí puedes:
              <br />• Generar QRs únicos y temporales para asistencia.
              <br />• Simular el escaneo y validar el payload.
              <br />• Integrar luego con Streamlit para ver los reportes.
            </p>
          </div>

          <div className="card">
            <h4>Tip rápido</h4>
            <p className="small">
              Usa el modo pantalla completa para mostrar el QR al público.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
