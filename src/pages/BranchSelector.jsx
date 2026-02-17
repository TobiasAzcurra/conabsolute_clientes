import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBranches } from "../firebase/clients/getBranches";
import { getClientAssets } from "../firebase/clients/getClientAssets";
import { useClient } from "../contexts/ClientContext";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";
import { useMediaQuery } from "react-responsive";
import PcBlock from "../components/PcBlock";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { app } from "../firebase/config";

// ─── DIAGNÓSTICO ───────────────────────────────────────────────────────────────
const TAG = "🔍 [BranchSelector]";
const t = () => new Date().toISOString().split("T")[1].split("Z")[0];
const log = (...args) => console.log(TAG, `[${t()}]`, ...args);
const warn = (...args) => console.warn(TAG, `[${t()}]`, ...args);
const err = (...args) => console.error(TAG, `[${t()}]`, ...args);
// ──────────────────────────────────────────────────────────────────────────────

// ─── Helper: mata una promesa si tarda más de `ms` milisegundos ───────────────
const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), ms),
  );
  return Promise.race([promise, timeout]);
};
// ──────────────────────────────────────────────────────────────────────────────

// ─── Helper: resetea la conexión WebSocket de Firestore ───────────────────────
const db = getFirestore(app);

const resetFirestoreConnection = async () => {
  try {
    await withTimeout(
      disableNetwork(db).then(() => enableNetwork(db)),
      3000,
    );
    log("🔌 Conexión Firestore reseteada");
  } catch (e) {
    warn(
      "Reset de Firestore falló o tardó demasiado, continuando igual:",
      e.message,
    );
    enableNetwork(db).catch(() => {});
  }
};
// ──────────────────────────────────────────────────────────────────────────────

const BranchSelector = () => {
  const { slugEmpresa } = useParams();
  const navigate = useNavigate();
  const { setEmpresaId, setSucursalId, setIsLoaded, colors, typography } =
    useClient();

  const renderCount = useRef(0);
  renderCount.current += 1;
  log(`RENDER #${renderCount.current} | slugEmpresa=${slugEmpresa}`);

  const prevSetEmpresaId = useRef(setEmpresaId);
  const prevSetSucursalId = useRef(setSucursalId);
  const prevSetIsLoaded = useRef(setIsLoaded);
  if (prevSetEmpresaId.current !== setEmpresaId) {
    warn(
      "⚠️  setEmpresaId cambió de referencia → puede causar loop en useEffect",
    );
    prevSetEmpresaId.current = setEmpresaId;
  }
  if (prevSetSucursalId.current !== setSucursalId) {
    warn(
      "⚠️  setSucursalId cambió de referencia → puede causar loop en useEffect",
    );
    prevSetSucursalId.current = setSucursalId;
  }
  if (prevSetIsLoaded.current !== setIsLoaded) {
    warn(
      "⚠️  setIsLoaded cambió de referencia → puede causar loop en useEffect",
    );
    prevSetIsLoaded.current = setIsLoaded;
  }

  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [empresaName, setEmpresaName] = useState("");
  const [empresaLogo, setEmpresaLogo] = useState(null);
  const [preloadedAssets, setPreloadedAssets] = useState({});

  useEffect(() => {
    setIsLoaded(false);
    setFetchError(false);

    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 8000;

    const fetchBranches = async (attempt = 1) => {
      if (!slugEmpresa) {
        warn("slugEmpresa es falsy, abortando fetch");
        return;
      }

      try {
        setLoading(true);
        log(
          `🟡 Intento ${attempt}/${MAX_RETRIES} | reseteando conexión Firestore...`,
        );
        await resetFirestoreConnection();
        log(`   → Conexión lista, ejecutando getBranches...`);

        const result = await withTimeout(getBranches(slugEmpresa), TIMEOUT_MS);
        log(`   → getBranches resolvió: ${result ? "OK" : "null/undefined"}`);

        if (!result || !result.branches || result.branches.length === 0) {
          warn("No se encontraron sucursales, result:", result);
          setLoading(false);
          return;
        }

        const { empresaId, branches: fetchedBranches, empresaData } = result;
        log(
          `   → empresaId: ${empresaId} | branches: ${fetchedBranches.length}`,
        );

        setBranches(fetchedBranches);
        setEmpresaId(empresaId);
        setEmpresaName(empresaData?.name || slugEmpresa.toUpperCase());

        let logoToUse = empresaData?.logo || null;
        log(`   → logo en empresaData: ${logoToUse ? "SÍ" : "NO"}`);

        if (fetchedBranches.length > 0) {
          const mainBranch =
            fetchedBranches.find(
              (b) => b.slugSucursal === "central" || b.slugSucursal === "main",
            ) || fetchedBranches[0];

          log(
            `   → mainBranch: ${mainBranch.slugSucursal} (id: ${mainBranch.id})`,
          );
          setSucursalId(mainBranch.id);

          if (!logoToUse) {
            log("   → Sin logo en data, buscando en background...");
            getClientAssets(empresaId, mainBranch.id)
              .then((assets) => {
                if (assets?.logo) {
                  setEmpresaLogo(assets.logo);
                  log("   → Logo cargado en background");
                } else {
                  log("   → No hay logo en assets tampoco");
                }
              })
              .catch((e) =>
                warn("No se pudo cargar logo en background:", e.message),
              );
          }

          log("   → Iniciando preloadBranchAssets en background...");
          preloadBranchAssets(empresaId, fetchedBranches);
        }

        if (logoToUse) setEmpresaLogo(logoToUse);

        log(`✅ Intento ${attempt} exitoso`);
        setLoading(false);
      } catch (error) {
        if (error.message === "TIMEOUT") {
          warn(`⏱️ Timeout en intento ${attempt}/${MAX_RETRIES}`);
        } else {
          err(`❌ Error en intento ${attempt}:`, error);
        }

        if (attempt < MAX_RETRIES) {
          const delay = attempt * 1000;
          log(`🔄 Reintentando en ${delay}ms...`);
          setTimeout(() => fetchBranches(attempt + 1), delay);
        } else {
          err("💀 Máximos reintentos alcanzados");
          setFetchError(true);
          setLoading(false);
        }
      }
    };

    fetchBranches();
  }, [slugEmpresa, retryKey, setEmpresaId, setSucursalId, setIsLoaded]);

  const preloadBranchAssets = async (empresaId, branches) => {
    try {
      log(
        "🚀 preloadBranchAssets iniciando para",
        branches.length,
        "sucursales",
      );
      const assetsMap = {};

      const promises = branches.map(async (branch) => {
        try {
          const assets = await getClientAssets(empresaId, branch.id);
          const branchData = {};

          if (assets?.hero) {
            let heroUrl = Array.isArray(assets.hero)
              ? assets.hero[0]
              : assets.hero;
            if (typeof heroUrl === "string") {
              branchData.hero = heroUrl;
              const isVideo = heroUrl
                .toLowerCase()
                .match(/\.(mp4|webm|ogg|mov)$/);
              if (isVideo) {
                const link = document.createElement("link");
                link.rel = "preload";
                link.as = "video";
                link.href = heroUrl;
                document.head.appendChild(link);
              } else {
                const img = new Image();
                img.src = heroUrl;
              }
            }
          }

          if (assets?.loading) {
            let loadingUrl = Array.isArray(assets.loading)
              ? assets.loading[0]
              : assets.loading;
            if (typeof loadingUrl === "string") {
              branchData.loading = loadingUrl;
              const isVideo = loadingUrl
                .toLowerCase()
                .match(/\.(mp4|webm|ogg|mov)$/);
              if (isVideo) {
                const link = document.createElement("link");
                link.rel = "preload";
                link.as = "video";
                link.href = loadingUrl;
                document.head.appendChild(link);
              } else {
                const img = new Image();
                img.src = loadingUrl;
              }
            }
          }

          assetsMap[branch.slugSucursal] = branchData;
        } catch (preloadErr) {
          warn(
            `Error precargando assets para ${branch.slugSucursal}:`,
            preloadErr,
          );
        }
      });

      await Promise.allSettled(promises);
      setPreloadedAssets((prev) => ({ ...prev, ...assetsMap }));
      log("✅ preloadBranchAssets finalizado", assetsMap);
    } catch (error) {
      err("Error general en precarga:", error);
    }
  };

  const handleSelectBranch = (branch) => {
    if (branch.active === false) return;
    log("👆 handleSelectBranch:", branch.slugSucursal);
    setIsLoaded(false);
    const branchAssets = preloadedAssets[branch.slugSucursal];
    const preloadUrl = branchAssets?.loading || branchAssets?.hero;
    navigate(`/${slugEmpresa}/${branch.slugSucursal}`, {
      state: { preloadUrl },
    });
  };

  const primaryColor = colors?.primary || "#000000";
  const fontFamily =
    typography?.primary?.name ||
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const backgroundColor = colors?.background || "#F5F5F7";

  if (isDesktop) return <PcBlock />;

  if (loading) {
    log("🟠 Renderizando SKELETON (loading=true)");
    return (
      <div
        style={{ backgroundColor, fontFamily }}
        className="min-h-screen flex flex-col pt-16 px-4 pb-4 transition-colors duration-500"
      >
        <div className="pb-8 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded-lg mx-auto mb-2" />
        </div>
        <div className="animate-pulse mb-8">
          <div className="h-4 w-64 bg-gray-200 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-3xl bg-gray-200 animate-pulse transition-all duration-300 shadow-lg shadow-gray-100"
              style={{ height: "280px" }}
            >
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-4 h-24" />
              </div>
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        style={{ backgroundColor, fontFamily }}
        className="min-h-screen flex flex-col items-center justify-center px-8 gap-6"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-8 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            No pudimos conectarnos. Revisá tu señal e intentá de nuevo.
          </p>
          <button
            onClick={() => {
              setFetchError(false);
              setLoading(true);
              setRetryKey((k) => k + 1);
            }}
            style={{ backgroundColor: primaryColor }}
            className="px-6 py-3 rounded-full text-white text-sm font-medium active:scale-95 transition-transform"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  log("🟢 Renderizando BRANCHES (loading=false) | branches:", branches.length);

  return (
    <div
      style={{ backgroundColor, fontFamily, color: "#1D1D1F" }}
      className="min-h-screen flex flex-col pt-16 px-4 pb-4 transition-colors duration-500"
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
                className="h-8 object-contain"
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
          className="font-primary pr-8 mb-4 text-sm text-gray-900 leading-tight"
        >
          Selecciona en que sucursal queres pedir
        </motion.h1>

        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {branches.map((branch, index) => {
              const heroUrl =
                preloadedAssets[branch.slugSucursal]?.hero || null;
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
                  className={`group relative overflow-hidden rounded-3xl shadow-lg shadow-gray-200 transition-all duration-300 ${
                    isActive
                      ? "cursor-pointer"
                      : "cursor-default opacity-60 grayscale-[0.2]"
                  }`}
                  style={{ height: "280px" }}
                >
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
                        <FontAwesomeIcon
                          icon={faStore}
                          className="text-white text-6xl opacity-30"
                        />
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                      <h3 className="text-white mb-2">
                        {branch.name || branch.slugSucursal}
                      </h3>
                      {branch.address && (
                        <p className="text-xs text-white flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-6 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                            />
                          </svg>
                          {branch.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <div
                      className={`h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
                        !isActive ? "px-4 bg-red-300/80" : "w-10 bg-white/20"
                      }`}
                    >
                      {isActive ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-6 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                          </svg>
                          <span className="text-xs font-bold font-light">
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
