import EmpresaRouter from "./EmpresaRouter";
import { Routes, Route, Navigate } from "react-router-dom";
import AgregarProductoPage from "./pages/admin/AgregarProductoPage";

const AppRouter = () => {
  return (
    <Routes>
      {/* Redirección desde la raíz a la empresa/sucursal por defecto */}
      <Route
        path="/"
        element={<Navigate to="/a-puro-mate/rio-cuarto" replace />}
      />

      <Route
        path="/:slugEmpresa/:slugSucursal/admin/agregar-producto"
        element={<AgregarProductoPage />}
      />
      <Route path="/:slugEmpresa/:slugSucursal/*" element={<EmpresaRouter />} />
    </Routes>
  );
};

export default AppRouter;
