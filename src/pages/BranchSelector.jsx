

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

  const handleSelectBranch = (branchSlug) => {
    // setIsLoaded(false) ya se llamó al montar, pero por seguridad:
    setIsLoaded(false);
    
    // Obtenemos la URL de carga precargada (intro)
    const branchAssets = preloadedAssets[branchSlug];
    const preloadUrl = branchAssets?.loading || branchAssets?.hero;

    navigate(`/${slugEmpresa}/${branchSlug}`, { 
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
        <div style={{ backgroundColor, fontFamily }} className="flex items-center justify-center h-screen transition-colors duration-500">
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
             style={{ borderColor: `${primaryColor} transparent transparent transparent` }}
           />
        </div>
     );
  }

  return (
    <div 
      style={{ backgroundColor, fontFamily, color: '#1D1D1F' }} 
      className="min-h-screen flex flex-col items-center justify-start pt-16 px-2 pb-4 transition-colors duration-500 relative overflow-hidden"
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
        <div className="text-center pb-16">
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
               className="text-xs font-semibold tracking-widest uppercase mb-2 text-gray-500"
             >
               {empresaName}
             </motion.h2>
          )}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-light "
          >
           Selecciona tu sucursal preferida
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <AnimatePresence>
            {branches.map((branch, index) => {
              const heroUrl = preloadedAssets[branch.slugSucursal]?.hero || null;
              
              return (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.4, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectBranch(branch.slugSucursal)}
                  className="group cursor-pointer relative overflow-hidden rounded-3xl shadow-lg shadow-black/20  transition-all duration-300"
                  style={{ height: '280px' }}
                >
                  {/* Hero Image Background */}
                  <div className="absolute inset-0">
                    {heroUrl ? (
                      <img 
                        src={heroUrl} 
                        alt={branch.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
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
                    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-4 ">
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

                  {/* Chevron Icon */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 text-white">
  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg>

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
