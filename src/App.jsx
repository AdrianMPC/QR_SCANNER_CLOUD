import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import QRGenerator from "./pages/QRGenerator";
import QRScanner from "./pages/QRScanner";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/generador" element={<QRGenerator />} />
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="*" element={<div style={{ padding: 24 }}>404 - Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}
