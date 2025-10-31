import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import Menu from "./pages/Menu";
import QRGenerator from "./pages/QRGenerator";
import QRScanner from "./pages/QRScanner";

function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="brand">UEP · Asistencia</Link>
        <nav className="nav">
          <Link to="/generador">Generar QR</Link>
          <Link to="/scanner">Escanear QR</Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app">
      <div className="bg-gradient" />
      <Router>
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/generador" element={<QRGenerator />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="*" element={<div style={{ padding: 24 }}>404 - Página no encontrada</div>} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}
