// MenuIntro.jsx
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
import { preloader } from "../../utils/imagePreloader";
import { extractImageUrls } from "../../utils/extractImages";
import {
  getPreloadStrategy,
  getConnectionQuality,
} from "../../utils/networkDetector";
import { getProductTagsByClient } from "../../firebase/tags/getTagsByClient";

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
    setProductTags,
    setSlugEmpresa,
    setSlugSucursal,
    setEmpresaId,
    setSucursalId,
  } = useClient();

  const [introGif, setIntroGif] = useState(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaType, setMediaType] = useState(null);
  const [preloadStats, setPreloadStats] = useState(null);

  const detectMediaType = (url) => {
    if (!url) return null;
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    const imageExtensions = [".gif", ".png", ".jpg", ".jpeg", ".webp"];
    const urlLower = url.toLowerCase();

    if (videoExtensions.some((ext) => urlLower.includes(ext))) return "video";
    if (imageExtensions.some((ext) => urlLower.includes(ext))) return "image";
    return "image";
  };

  useEffect(() => {
    setSlugEmpresa(slugEmpresa);
    setSlugSucursal(slugSucursal);

    const fetchData = async () => {
      try {
        // Detectar calidad de conexión y ajustar estrategia
        const connectionQuality = getConnectionQuality();
        const strategy = getPreloadStrategy();

        console.log(`Conexion detectada: ${connectionQuality}`);
        console.log(`Estrategia de precarga:`, strategy);

        // Ajustar concurrencia del preloader dinámicamente
        preloader.maxConcurrent = strategy.concurrency;

        const ids = await getClientIds(slugEmpresa, slugSucursal);
        if (!ids) {
          console.error("Empresa o sucursal no encontrada");
          return;
        }

        const { empresaId, sucursalId } = ids;
        setEmpresaId(empresaId);
        setSucursalId(sucursalId);

        // 1. Cargar assets primero (necesario para intro)
        const assets = await getClientAssets(empresaId, sucursalId);
        setClientAssets(assets);

        const loadingMedia = assets?.loading || null;
        setIntroGif(loadingMedia);
        setMediaType(detectMediaType(loadingMedia));

        // 2. Precarga FASE 1: Hero + intro (delay adaptativo según conexión)
        setTimeout(() => {
          const heroUrls = extractImageUrls.fromAssets(assets);
          preloader.preload(heroUrls, "high");
        }, strategy.heroDelay);

        // 3. Cargar resto de datos en paralelo
        const [
          data,
          config,
          categories,
          productTags,
          productsData,
          sortedProducts,
        ] = await Promise.all([
          getClientData(empresaId, sucursalId),
          getClientConfig(empresaId, sucursalId),
          getCategoriesByClient(empresaId, sucursalId),
          getProductTagsByClient(empresaId, sucursalId), // ✅ Nuevo
          getProductsByClient(empresaId, sucursalId),
          getProductsByCategoryPosition(empresaId, sucursalId),
        ]);

        setClientData(data);
        setClientConfig(config);
        setCategories(categories);
        setProductTags(productTags);

        // Ordenar productos alfabéticamente UNA SOLA VEZ aquí
        // Section.jsx consumirá directamente sin re-ordenar
        const sortedByCategory = {};
        Object.keys(productsData.porCategoria).forEach((catId) => {
          sortedByCategory[catId] = [...productsData.porCategoria[catId]].sort(
            (a, b) => {
              const nameA = (a.name || "").toLowerCase();
              const nameB = (b.name || "").toLowerCase();
              return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
            }
          );
        });

        setProductsByCategory(sortedByCategory);
        setProductsSorted(sortedProducts);

        // 4. Precarga FASE 2: Categorías (delay adaptativo)
        setTimeout(() => {
          const categoryUrls = extractImageUrls.fromCategories(categories);
          preloader.preload(categoryUrls, "high");
        }, strategy.categoriesDelay);

        // 5. Funciones para determinar categorías
        const getFirstCategoryByPosition = () => {
          if (!categories || categories.length === 0) return null;

          const sortedByPosition = [...categories]
            .filter((cat) => cat.position !== undefined)
            .sort((a, b) => a.position - b.position);

          return sortedByPosition[0]?.id || categories[0]?.id || null;
        };

        const findCategoryWithProducts = () => {
          if (!categories || !sortedByCategory) return "default";

          const sortedCategories = [...categories]
            .filter((cat) => cat.position !== undefined)
            .sort((a, b) => a.position - b.position);

          const categoriesToCheck =
            sortedCategories.length > 0 ? sortedCategories : categories;

          for (const category of categoriesToCheck) {
            const categoryProducts = sortedByCategory[category.id];
            if (categoryProducts && categoryProducts.length > 0) {
              return category.id;
            }
          }

          return categoriesToCheck[0]?.id || "default";
        };

        // Categoría para PRECARGA: la de position más bajo
        const firstCategoryByPosition = getFirstCategoryByPosition();

        // Categoría para NAVEGACIÓN: la primera con productos
        const firstCategoryWithProducts = findCategoryWithProducts();

        console.log(`Precargando productos de: ${firstCategoryByPosition}`);
        console.log(`Navegara a: ${firstCategoryWithProducts}`);

        // 6. Procesar productos relacionados
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

        // 7. Validar productos
        const validProducts = allProducts
          .filter((product) => {
            const isValidPrice =
              product.price &&
              typeof product.price === "number" &&
              product.price >= 0;
            return isValidPrice;
          })
          .map((product) => {
            if (product.variants && Array.isArray(product.variants)) {
              const basePrice = product.price || 0;
              const validVariants = product.variants.filter((variant) => {
                if (!variant.price && variant.price !== 0) return true;
                if (typeof variant.price !== "number") return false;
                const finalPrice = basePrice + variant.price;
                return finalPrice >= 0;
              });
              return { ...product, variants: validVariants };
            }
            return product;
          });

        setProducts(validProducts);

        // 8. Precarga FASE 3: Productos prioritarios (adaptativo según conexión)
        setTimeout(() => {
          if (
            firstCategoryByPosition &&
            sortedByCategory[firstCategoryByPosition]
          ) {
            const priorityProducts = sortedByCategory[firstCategoryByPosition];

            console.log(
              `Primeros ${strategy.maxProducts} productos a precargar:`,
              priorityProducts.slice(0, strategy.maxProducts).map((p) => p.name)
            );

            // Above fold (máximo 6 productos)
            const aboveFoldUrls = extractImageUrls.fromProducts(
              priorityProducts.slice(0, Math.min(6, strategy.maxProducts))
            );
            preloader.preload(aboveFoldUrls, "high");

            // Siguiente scroll (solo si la conexión lo permite)
            if (strategy.maxProducts > 6) {
              const nextScrollUrls = extractImageUrls.fromProducts(
                priorityProducts.slice(6, strategy.maxProducts)
              );
              preloader.preload(nextScrollUrls, "normal");
            }
          } else {
            console.warn(
              `No se encontraron productos en la categoria priority: ${firstCategoryByPosition}`
            );
          }
        }, strategy.productsDelay);

        // 9. Precarga FASE 4: Resto de categorías (solo si conexión rápida y hay tiempo)
        const introDuration = assets?.loadingDuration || DEFAULT_INTRO_DURATION;
        if (!strategy.skipLowPriority && introDuration > 3000) {
          setTimeout(() => {
            categories.forEach((cat) => {
              if (cat.id !== firstCategoryByPosition) {
                const otherCategoryProducts = sortedByCategory[cat.id] || [];
                const otherUrls = extractImageUrls.fromProducts(
                  otherCategoryProducts.slice(0, 10)
                );
                preloader.preload(otherUrls, "low");
              }
            });
          }, 2000);
        }

        // 10. Monitoreo de precarga
        const statsInterval = setInterval(() => {
          const stats = preloader.getStats();
          setPreloadStats(stats);
          console.log(
            `Precarga: ${stats.loaded}/${stats.total} (${stats.successRate}%)`
          );

          if (stats.loaded + stats.failed >= stats.total) {
            clearInterval(statsInterval);
          }
        }, 2000);

        // 11. Navegación después de intro
        const normalizePath = (path) =>
          path.endsWith("/") ? path.slice(0, -1) : path;

        setTimeout(() => {
          setIsLoaded(true);
          const rootPath = `/${slugEmpresa}/${slugSucursal}`;
          if (normalizePath(location.pathname) === rootPath) {
            navigate(`menu/${firstCategoryWithProducts}`, { replace: true });
          } else {
            navigate(location.pathname, { replace: true });
          }
        }, introDuration + REDIRECT_BUFFER);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();

    return () => {
      preloader.reset();
    };
  }, []);

  const renderMedia = () => {
    if (!introGif) return null;

    if (mediaType === "video") {
      return (
        <video
          src={introGif}
          className={`w-full h-full object-cover absolute top-0 left-0 z-10 transition-opacity duration-700 ${
            mediaLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ minHeight: "100vh", minWidth: "100vw" }}
          onLoadedData={() => setMediaLoaded(true)}
          onCanPlay={() => setMediaLoaded(true)}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
      );
    }

    return (
      <img
        src={introGif}
        className={`w-full h-full object-cover absolute top-0 left-0 z-10 transition-opacity duration-700 ${
          mediaLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ minHeight: "100vh", minWidth: "100vw" }}
        onLoad={() => setMediaLoaded(true)}
        alt="Loading animation"
      />
    );
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-50 relative overflow-hidden">
      {introGif ? (
        renderMedia()
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-50">
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
