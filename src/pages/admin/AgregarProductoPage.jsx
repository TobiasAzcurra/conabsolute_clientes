import ClientLayout from '../../layouts/ClientLayout';
import ProductForm from '../../components/form/ProductForm';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../../contexts/ClientContext';
import { getClientIds } from '../../firebase/clients/getClientIds';
import { useEffect, useState } from 'react';

const AgregarProductoPage = () => {
  const { slugEmpresa: slugEmpresaFromURL, slugSucursal: slugSucursalFromURL } =
    useParams();
  const {
    slugEmpresa: slugEmpresaFromContext,
    slugSucursal: slugSucursalFromContext,
  } = useClient();
  const navigate = useNavigate();

  const empresa = slugEmpresaFromURL || slugEmpresaFromContext;
  const sucursal = slugSucursalFromURL || slugSucursalFromContext;

  const [ids, setIds] = useState(null);

  useEffect(() => {
    const resolveIds = async () => {
      const result = await getClientIds(empresa, sucursal);
      if (!result) {
        console.error('❌ No se encontraron IDs');
        return;
      }
      setIds(result);
    };
    resolveIds();
  }, [empresa, sucursal]);

  const handleSuccess = () => {
    navigate(`/${empresa}/${sucursal}/menu`);
  };

  return (
    <ClientLayout>
      <div className="p-4 bg-white max-w-xl mx-auto mt-10 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Agregar Producto</h2>
        {ids ? (
          <ProductForm
            empresa={ids.empresaId}
            sucursal={ids.sucursalId}
            onSuccess={handleSuccess}
          />
        ) : (
          <p>Cargando...</p>
        )}
      </div>
    </ClientLayout>
  );
};

export default AgregarProductoPage;
