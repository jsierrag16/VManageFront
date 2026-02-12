import { Routes, Route, Navigate } from "react-router-dom";
import Bodegas from "../../src/features/bodegas/pages/Bodegas";

export default function AppRoutes() {
  return (
    <Routes>
      {/* /app -> Dashboard principal */}
      <Route index element={<div>Dashboard</div>} />

      {/* BODEGAS */}
      <Route path="bodegas" element={<Bodegas />} />
      <Route path="bodegas/crear" element={<Bodegas />} />
      <Route path="bodegas/editar/:id" element={<Bodegas />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
