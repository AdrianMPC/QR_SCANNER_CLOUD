import { Link } from "react-router-dom";

export default function Menu() {
  return (
    <div>
      <section style={{ textAlign:"center", marginBottom: 18 }}>
        <h1 style={{ margin: "4px 0 8px 0", fontSize: "2rem" }}>UEP · Sistema de Asistencia</h1>
        <p className="small">Elige una opción para continuar.</p>
      </section>

      <div className="grid">
        <Link to="/generador" className="card" style={{ borderColor:"rgba(0,79,183,.35)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:28 }}>🧾</div>
            <div>
              <h3 style={{ margin:"4px 0 2px 0" }}>Generar QR</h3>
              <p className="small" style={{ margin:0 }}>Crea códigos QR para eventos y alumnos (expiración + nonce).</p>
            </div>
          </div>
        </Link>

        <Link to="/scanner" className="card" style={{ borderColor:"rgba(10,163,108,.35)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:28 }}>📷</div>
            <div>
              <h3 style={{ margin:"4px 0 2px 0" }}>Escanear QR</h3>
              <p className="small" style={{ margin:0 }}>Usa la cámara para registrar asistencias en Supabase.</p>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ marginTop:18 }}>
        <div className="card" style={{ padding:14 }}>
          <b>Nota:</b> Para usar la cámara en móviles, abre el sitio por <b>HTTPS</b> (GitHub Pages, ngrok) o desde <b>localhost</b>.
        </div>
      </div>
    </div>
  );
}
