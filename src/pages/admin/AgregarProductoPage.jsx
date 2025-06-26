import ClientLayout from '../../layouts/ClientLayout';
import ProductForm from '../../components/form/ProductForm';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../../contexts/ClientContext';

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

  console.log(
    'Empresa desde URL o Contexto:',
    empresa,
    'Sucursal desde URL o Contexto:',
    sucursal
  );

  const handleSuccess = () => {
    navigate(`/${empresa}/${sucursal}/menu`);
  };

  return (
    <ClientLayout>
      <div className="p-4 bg-white max-w-xl mx-auto mt-10 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Agregar Producto</h2>
        <ProductForm
          empresa={empresa}
          sucursal={sucursal}
          onSuccess={handleSuccess}
        />
      </div>
    </ClientLayout>
  );
};

export default AgregarProductoPage;
