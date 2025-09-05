import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useClient } from "../../contexts/ClientContext";
import { getClientData } from "../../firebase/clients/getClientData";
import { getClientAssets } from "../../firebase/clients/getClientAssets";
import { getCategoriesByClient } from "../../firebase/categories/getCategories";
import { getProductsByClient } from "../../firebase/products/getProductsByClient";
import { getProductsByCategoryPosition } from "../../firebase/products/getProductsByCategory";
import { getClientIds } from "../../firebase/clients/getClientIds";
import { getClientConfig } from "../../firebase/clients/getClientConfig";

const DEFAULT_INTRO_DURATION = 0;
const REDIRECT_BUFFER = 300;

const MenuIntro = () => {
  const { slugEmpresa, slugSucursal } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setIsLoaded,
    setClientData,
    setClientAssets,
    setClientConfig,
    setProducts,
    setProductsByCategory,
    setCategories,
    setProductsSorted,
    setSlugEmpresa,
    setSlugSucursal,
    setEmpresaId,
    setSucursalId,
  } = useClient();

  const [introGif, setIntroGif] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setSlugEmpresa(slugEmpresa);
    setSlugSucursal(slugSucursal);

    const fetchData = async () => {
      try {
        const ids = await getClientIds(slugEmpresa, slugSucursal);
        if (!ids) {
          console.error("❌ Empresa o sucursal no encontrada");
          return;
        }

        const { empresaId, sucursalId } = ids;

        setEmpresaId(empresaId);
        setSucursalId(sucursalId);

        const assets = await getClientAssets(empresaId, sucursalId);
        setClientAssets(assets);
        setIntroGif(assets?.loading || null);

        const [data, config, categories, productsData, sortedProducts] =
          await Promise.all([
            getClientData(empresaId, sucursalId),
            getClientConfig(empresaId, sucursalId),
            getCategoriesByClient(empresaId, sucursalId),
            getProductsByClient(empresaId, sucursalId),
            getProductsByCategoryPosition(empresaId, sucursalId),
          ]);

        setClientData(data);
        setClientConfig(config);
        setCategories(categories);
        setProductsByCategory(productsData.porCategoria);
        setProductsSorted(sortedProducts);

        const relatedStores = config?.logistics?.relatedStores;
        let relatedProducts = [];

        if (relatedStores && Object.keys(relatedStores).length > 0) {
          for (const storeId of Object.keys(relatedStores)) {
            const delay = relatedStores[storeId].deliveryDelay;

            const extraProducts = await getProductsByClient(empresaId, storeId);

            const enriched = extraProducts.todos.map((p) => ({
              ...p,
              sourceStoreId: storeId,
              deliveryDelay: delay,
            }));

            relatedProducts = [...relatedProducts, ...enriched];
          }
        }

        const allProducts = [...productsData.todos, ...relatedProducts];

        const validProducts = allProducts.filter(product => {
          const isValidPrice = product.price && typeof product.price === 'number' && product.price >= 0;
          return isValidPrice;
        }).map(product => {
          if (product.variants && Array.isArray(product.variants)) {
            const basePrice = product.price || 0;
            
            const validVariants = product.variants.filter((variant) => {
              if (!variant.price && variant.price !== 0) {
                return true;
              }
              
              if (typeof variant.price !== 'number') {
                return false;
              }
              
              const finalPrice = basePrice + variant.price;
              return finalPrice >= 0;
            });
            
            return {
              ...product,
              variants: validVariants
            };
          }
          
          return product;
        });

        setProducts(validProducts);

        const findCategoryWithProducts = () => {
          if (!categories || !productsData.porCategoria) return 'default';
          
          for (const category of categories) {
            const categoryProducts = productsData.porCategoria[category.id];
            if (categoryProducts && categoryProducts.length > 0) {
              return category.id;
            }
          }
          
          return categories[0]?.id || 'default';
        };

        const introDuration = assets?.loadingDuration || DEFAULT_INTRO_DURATION;

        const normalizePath = (path) =>
          path.endsWith("/") ? path.slice(0, -1) : path;

        setTimeout(() => {
          setIsLoaded(true);
          const rootPath = `/${slugEmpresa}/${slugSucursal}`;
          if (normalizePath(location.pathname) === rootPath) {
            const categoryWithProducts = findCategoryWithProducts();
            navigate(`menu/${categoryWithProducts}`, {
              replace: true,
            });
          } else {
            navigate(location.pathname, { replace: true });
          }
        }, introDuration + REDIRECT_BUFFER);
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-white relative overflow-hidden">
      {introGif ? (
        <img
          src={introGif}
          className={`w-full h-full object-cover absolute top-0 left-0 z-10 transition-opacity duration-700 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ minHeight: "100vh", minWidth: "100vw" }}
          onLoad={() => setImgLoaded(true)}
          alt="Loading animation"
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
