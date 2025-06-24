import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useClient } from '../../contexts/ClientContext';
import { getClientData } from '../../firebase/clients/getClientData';
import { getClientAssets } from '../../firebase/clients/getClientAssets';
import { getCategoriesByClient } from '../../firebase/categories/getCategories';
import { getProductsByClient } from '../../firebase/products/getProductsByClient';
import { getProductsByCategoryPosition } from '../../firebase/products/getProductsByCategory';

const MenuIntro = () => {
  const { slugEmpresa, slugSucursal } = useParams();
  const navigate = useNavigate();
  const {
    setIsLoaded,
    setClientData,
    setClientAssets,
    setProducts,
    setProductsByCategory,
    setCategories,
    setProductsSorted,
    setSlugEmpresa,
    setSlugSucursal,
  } = useClient();

  const [introGif, setIntroGif] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setSlugEmpresa(slugEmpresa);
    setSlugSucursal(slugSucursal);

    Promise.all([
      getClientData(slugEmpresa, slugSucursal),
      getClientAssets(slugEmpresa, slugSucursal),
      getCategoriesByClient(slugEmpresa, slugSucursal),
      getProductsByClient(slugEmpresa, slugSucursal),
      getProductsByCategoryPosition(slugEmpresa, slugSucursal),
    ])
      .then(([data, assets, categories, productsData, sortedProducts]) => {
        setClientData(data);
        setClientAssets(assets);
        setIntroGif(assets?.loading || null);
        setCategories(categories);
        setProducts(productsData.todos);
        setProductsByCategory(productsData.porCategoria);
        setProductsSorted(sortedProducts);

        setTimeout(() => {
          setIsLoaded(true);
          navigate(`menu/${categories?.[0]?.id || 'default'}`, {
            replace: true,
          });
        }, 3000);
      })
      .catch((e) => {
        console.error('❌ Error cargando intro o data:', e);
      });
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-white relative overflow-hidden">
      {introGif ? (
        <img
          src={introGif}
          className={`w-full h-full object-cover absolute top-0 left-0 z-10 transition-opacity duration-700 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ minHeight: '100vh', minWidth: '100vw' }}
          onLoad={() => setImgLoaded(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white">
          <div className="relative flex items-center justify-center w-32 h-32">
            <span className="absolute w-28 h-28 rounded-full border border-neutral-300 animate-pulseOrbit" />
            <span className="absolute w-20 h-20 rounded-full border border-neutral-400 animate-pulseOrbit delay-200" />
            <span className="absolute w-12 h-12 rounded-full border border-neutral-500 animate-pulseOrbit delay-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuIntro;
