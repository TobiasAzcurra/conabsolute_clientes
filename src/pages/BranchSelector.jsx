

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBranches } from "../firebase/clients/getBranches";
import { getClientAssets } from "../firebase/clients/getClientAssets"; // Helper para obtener assets
import { useClient } from "../contexts/ClientContext";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faMapMarkerAlt, faStore } from "@fortawesome/free-solid-svg-icons";

const BranchSelector = () => {
  const { slugEmpresa } = useParams();
  const navigate = useNavigate();
  const { 
    setEmpresaId, 
    setSucursalId,
    setIsLoaded, 
    colors,
    typography 
  } = useClient();
  

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empresaName, setEmpresaName] = useState("");
  const [empresaLogo, setEmpresaLogo] = useState(null); // ✅ Estado para el logo
  // Estado para guardar las URLs de los assets precargados
  const [preloadedAssets, setPreloadedAssets] = useState({});

  useEffect(() => {
    // ✅ Resetear isLoaded para asegurar que MenuIntro corra al navegar a una sucursal
    setIsLoaded(false);

    const fetchBranches = async () => {
      if (!slugEmpresa) return;

      try {
        setLoading(true);
        const result = await getBranches(slugEmpresa);

        if (!result || !result.branches || result.branches.length === 0) {
          console.warn("No se encontraron sucursales");
          setLoading(false);
          return;
        }

        const { empresaId, branches: fetchedBranches, empresaData } = result;
        
        setBranches(fetchedBranches);
        setEmpresaId(empresaId);
        setEmpresaName(empresaData?.name || slugEmpresa.toUpperCase());

        // Intentar obtener logo de datos básicos
        let logoToUse = empresaData?.logo || null;

        // Lógica de Branding: usar la primera sucursal para estilos
        if (fetchedBranches.length > 0) {
          const mainBranch = fetchedBranches.find(b => b.slugSucursal === 'central' || b.slugSucursal === 'main') || fetchedBranches[0];
          setSucursalId(mainBranch.id);

          // Si no hay logo en data básica, buscamos en los assets de la sucursal principal
          if (!logoToUse) {
             try {
                const mainAssets = await getClientAssets(empresaId, mainBranch.id);
                if (mainAssets?.logo) {
                   logoToUse = mainAssets.logo;
                }
             } catch (err) {
                console.warn("No se pudo obtener logo de assets principales", err);
             }
          }

          // 🚀 PERFORMANCE: Precargar animaciones de intro en segundo plano
          // No esperamos a que termine para quitar el loading, esto corre en background
          preloadBranchAssets(empresaId, fetchedBranches);
        }

        if (logoToUse) {
           setEmpresaLogo(logoToUse);
        }

        setLoading(false);

      } catch (error) {
        console.error("Error en BranchSelector:", error);
        setLoading(false);
      }
    };

    fetchBranches();
  }, [slugEmpresa, setEmpresaId, setSucursalId, setIsLoaded]);

  // Función para precargar assets
  const preloadBranchAssets = async (empresaId, branches) => {
    try {
      console.log("🚀 Iniciando precarga de assets de sucursales...");
      const assetsMap = {};
      
      const promises = branches.map(async (branch) => {
        try {
           const assets = await getClientAssets(empresaId, branch.id);
           const branchData = {};

           // Precargar Hero (para el card)
           if (assets?.hero) {
             let heroUrl = Array.isArray(assets.hero) ? assets.hero[0] : assets.hero;
             if (typeof heroUrl === 'string') {
               branchData.hero = heroUrl;
               const isVideo = heroUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
               if (isVideo) {
                 const link = document.createElement('link');
                 link.rel = 'preload';
                 link.as = 'video';
                 link.href = heroUrl;
                 document.head.appendChild(link);
               } else {
                 const img = new Image();
                 img.src = heroUrl;
               }
             }
           }

           // Precargar Loading (para la intro)
           if (assets?.loading) {
             let loadingUrl = Array.isArray(assets.loading) ? assets.loading[0] : assets.loading;
             if (typeof loadingUrl === 'string') {
               branchData.loading = loadingUrl;
               const isVideo = loadingUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
               if (isVideo) {
                 const link = document.createElement('link');
                 link.rel = 'preload';
                 link.as = 'video';
                 link.href = loadingUrl;
                 document.head.appendChild(link);
                 console.log(`🎥 Precargando video loading sucursal ${branch.slugSucursal}`);
               } else {
                 const img = new Image();
                 img.src = loadingUrl;
                 console.log(`🖼️ Precargando imagen loading sucursal ${branch.slugSucursal}`);
               }
             }
           }
           
           assetsMap[branch.slugSucursal] = branchData;

        } catch (err) {
           console.warn(`Error precargando assets para ${branch.slugSucursal}`, err);
        }
      });

      await Promise.allSettled(promises);
      setPreloadedAssets(prev => ({ ...prev, ...assetsMap }));
      console.log("✅ Precarga de sucursales finalizada", assetsMap);

    } catch (error) {
      console.error("Error general en precarga:", error);
    }
  };

  const handleSelectBranch = (branch) => {
    // Si la sucursal no está activa, no hacemos nada
    if (branch.active === false) return;

    // setIsLoaded(false) ya se llamó al montar, pero por seguridad:
    setIsLoaded(false);
    
    // Obtenemos la URL de carga precargada (intro)
    const branchAssets = preloadedAssets[branch.slugSucursal];
    const preloadUrl = branchAssets?.loading || branchAssets?.hero;

    navigate(`/${slugEmpresa}/${branch.slugSucursal}`, { 
      state: { preloadUrl } 
    });
  };

  // Estilos dinámicos "Apple-like"
  // Priorizar limpieza, tipografía, espacios blancos y sutiles sombras
  const primaryColor = colors?.primary || '#000000';
  const fontFamily = typography?.primary?.name || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const backgroundColor = colors?.background || '#F5F5F7'; // Típico gris claro de Apple

  if (loading) {
     return (
        <div 
          style={{ backgroundColor, fontFamily }} 
          className="min-h-screen flex flex-col pt-16 px-4 pb-4 transition-colors duration-500"
        >
          {/* Header Skeleton */}
          <div className="pb-8 animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded-lg mx-auto mb-2" />
          </div>
          <div className="animate-pulse mb-8">
            <div className="h-4 w-64 bg-gray-200 rounded-md" />
          </div>

          {/* Cards Skeleton */}
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div 
                key={i}
                className="relative overflow-hidden rounded-3xl bg-gray-200 animate-pulse transition-all duration-300 shadow-lg shadow-gray-100"
                style={{ height: '280px' }}
              >
                {/* Simulated Content Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-4 h-24" />
                </div>
                {/* Simulated Indicator Area */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm" />
              </div>
            ))}
          </div>
        </div>
     );
  }

  return (
    <div 
      style={{ backgroundColor, fontFamily, color: '#1D1D1F' }} 
      className="min-h-screen flex flex-col pt-16 px-4 pb-4 transition-colors duration-500 "
    >
      <Helmet>
        <title>Selecciona una sucursal | {empresaName}</title>
      </Helmet>


      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-md"
      >
        <div className="pb-8">
          {empresaLogo ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-2"
            >
              <img 
                src={empresaLogo} 
                alt={empresaName} 
                className="h-8 object-contain" // Ajusta h-16 según tamaño deseado (64px)
              />
            </motion.div>
          ) : (
             <motion.h2 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.6 }}
               transition={{ delay: 0.2 }}
               className="text-xs font-semibold tracking-widest uppercase text-gray-500"
             >
               {empresaName}
             </motion.h2>
          )}
        </div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-primary  pr-8 mb-4  text-sm text-gray-900 leading-tight"

          >
           Selecciona en que sucursal queres pedir
          </motion.h1>

        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {branches.map((branch, index) => {
              const heroUrl = preloadedAssets[branch.slugSucursal]?.hero || null;
              const isActive = branch.active !== false;
              
              return (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.4, duration: 0.5 }}
                  whileHover={isActive ? { scale: 1.02 } : {}}
                  whileTap={isActive ? { scale: 0.98 } : {}}
                  onClick={() => handleSelectBranch(branch)}
                  className={`group relative overflow-hidden rounded-3xl shadow-lg shadow-gray-200  transition-all duration-300 ${
                    isActive ? "cursor-pointer" : "cursor-default opacity-60 grayscale-[0.2]"
                  }`}
                  style={{ height: '280px' }}
                >
                  {/* Hero Image Background */}
                  <div className="absolute inset-0">
                    {heroUrl ? (
                      <img 
                        src={heroUrl} 
                        alt={branch.name}
                        className={`w-full h-full object-cover transition-transform duration-500 pointer-events-none ${
                          isActive ? "group-hover:scale-105" : ""
                        }`}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <FontAwesomeIcon icon={faStore} className="text-white text-6xl opacity-30" />
                      </div>
                    )}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 ">
                      <h3 className=" text-white mb-2">
                        {branch.name || branch.slugSucursal}
                      </h3>
                      {branch.address && (
                        <p className="text-xs text-white flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 mr-2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
</svg>

                          {branch.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator (Chevron or NO DISPONIBLE) */}
                  <div className="absolute top-4 right-4">

                  <div className={`h-10 rounded-full  backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
                    !isActive ? "px-4 bg-red-300/80" : "w-10 bg-white/20"
                  }`}>
                    {isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 text-white">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
</svg>

                      <span className="text-xs font-bold font-light  ">
                        No disponible
                      </span>
                      </div>
                    )}
                  </div>
                    </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        
       
      </motion.div>
    </div>
  );
};

export default BranchSelector;
