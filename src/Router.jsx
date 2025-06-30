import EmpresaRouter from './EmpresaRouter';
import { Routes, Route } from 'react-router-dom';
import AgregarProductoPage from './pages/admin/AgregarProductoPage';

const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/:slugEmpresa/:slugSucursal/admin/agregar-producto"
        element={<AgregarProductoPage />}
      />
      <Route path="/:slugEmpresa/:slugSucursal/*" element={<EmpresaRouter />} />
    </Routes>
  );
};

export default AppRouter;
