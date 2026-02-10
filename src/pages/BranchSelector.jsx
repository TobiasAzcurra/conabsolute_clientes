

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
           if (assets?.loading) {
             const url = assets.loading;
             // Guardamos la URL en el mapa local
             assetsMap[branch.slugSucursal] = url;

             const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
             
             if (isVideo) {
                // Precargar video
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'video';
                link.href = url;
                document.head.appendChild(link);
                console.log(`🎥 Precargando video sucursal ${branch.slugSucursal}`);
             } else {
                // Precargar imagen
                const img = new Image();
                img.src = url;
                console.log(`🖼️ Precargando imagen sucursal ${branch.slugSucursal}`);
             }
           }
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
    
    // Obtenemos la URL precargada si existe
    const preloadedUrl = preloadedAssets[branchSlug];

    navigate(`/${slugEmpresa}/${branchSlug}`, { 
      state: { preloadUrl: preloadedUrl } 
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
      className="min-h-screen flex flex-col items-center justify-start pt-16 px-6 transition-colors duration-500 relative overflow-hidden"
    >
      <Helmet>
        <title>Selecciona una sucursal | {empresaName}</title>
      </Helmet>

      {/* Background blobs for premium feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-30">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)` }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${colors?.secondary || '#86868b'}20 0%, transparent 70%)` }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          {empresaLogo ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <img 
                src={empresaLogo} 
                alt={empresaName} 
                className="h-16 object-contain" // Ajusta h-16 según tamaño deseado (64px)
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
            className="text-4xl font-bold tracking-tight text-[#1D1D1F]"
          >
           Elige tu sucursal
          </motion.h1>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {branches.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectBranch(branch.slugSucursal)}
                className="group cursor-pointer bg-white/80 backdrop-blur-md border border-white/40 shadow-sm rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                   <FontAwesomeIcon icon={faStore} className="opacity-90" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1D1D1F]">
                      {branch.name || branch.slugSucursal}
                    </h3>
                    {branch.address && (
                      <p className="text-sm text-[#86868b] mt-0.5 flex items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1.5 w-3 h-3 opacity-70" />
                        {branch.address}
                      </p>
                    )}
                  </div>
                </div>
                <div 
                  className="text-[#86868b] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                  style={{ color: primaryColor }}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
       
      </motion.div>
    </div>
  );
};

export default BranchSelector;
