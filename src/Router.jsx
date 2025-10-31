import { useEffect } from "react";
import EmpresaRouter from "./EmpresaRouter";
import { Routes, Route, Navigate } from "react-router-dom";

function NavigateConabsolute() {
  useEffect(() => {
    window.location.href = "https://conabsolute.com/";
  }, []);

  return <div></div>;
}

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<NavigateConabsolute />} />

      <Route path="/:slugEmpresa/:slugSucursal/*" element={<EmpresaRouter />} />
    </Routes>
  );
};

export default AppRouter;
