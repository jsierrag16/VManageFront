import { Routes, Route, Navigate } from "react-router-dom";
import Bodegas from "../../src/features/bodegas/pages/Bodegas";
import Dashboard from "../../src/features/dashboard/pages/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* /app -> Dashboard principal */}
      <Route index element={<Dashboard />} />

      {/* BODEGAS */}
      <Route path="bodegas" element={<Bodegas />} />
      <Route path="bodegas/crear" element={<Bodegas />} />
      <Route path="bodegas/:id/editar" element={<Bodegas />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
