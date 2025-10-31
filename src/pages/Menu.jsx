import { Link } from "react-router-dom";

export default function Menu() {
  return (
    <div style={styles.wrap}>
      <h1 style={{ marginBottom: 8 }}>UEP – Asistencia</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Elige una opción para continuar.
      </p>

      <div style={styles.grid}>
        <Link to="/generador" style={{ ...styles.card, borderColor: "#004FB7" }}>
          <span style={styles.emoji}>🧾</span>
          <h3 style={styles.title}>Generar QR</h3>
          <p style={styles.desc}>Crea códigos QR para eventos y alumnos (con expiración y nonce).</p>
        </Link>

        <Link to="/scanner" style={{ ...styles.card, borderColor: "#0a7" }}>
          <span style={styles.emoji}>📷</span>
          <h3 style={styles.title}>Escanear QR</h3>
          <p style={styles.desc}>Usa la cámara para registrar asistencias en Supabase.</p>
        </Link>
      </div>

      <div style={styles.note}>
        <b>Nota:</b> Para usar la cámara en móviles necesitas abrir el sitio por <b>HTTPS</b> o desde <b>localhost</b>.
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 900, margin: "40px auto", padding: "0 16px", textAlign: "center" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    marginTop: 20,
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    border: "2px solid",
    borderRadius: 12,
    padding: 20,
    textAlign: "left",
    background: "#fff",
    boxShadow: "0 4px 14px rgba(0,0,0,.06)",
    transition: "transform .1s ease, box-shadow .1s ease",
  },
  emoji: { fontSize: 28 },
  title: { margin: "8px 0" },
  desc: { margin: 0, color: "#444" },
  note: { marginTop: 16, color: "#555" },
};
