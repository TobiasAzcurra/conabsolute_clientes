import EmpresaRouter from './EmpresaRouter';
import { Routes, Route } from 'react-router-dom';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/:slugEmpresa/:slugSucursal/*" element={<EmpresaRouter />} />
    </Routes>
  );
};

export default AppRouter;
