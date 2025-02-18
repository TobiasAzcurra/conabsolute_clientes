import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import AppleModal from './AppleModal';

const VersionChecker = ({ children }) => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(localStorage.getItem('app_version') || '1.0.0');

  useEffect(() => {
    // console.log('VersionChecker montado');
    // console.log('Versión actual app:', localStorage.getItem('app_version'));
    // console.log('Versión actual assets:', localStorage.getItem('asset_version'));

    const checkAssetVersion = async () => {
      try {
        // console.log('Verificando versión de assets...');
        const response = await fetch('/version.json?t=' + new Date().getTime());
        const { version: deployedVersion } = await response.json();
        const currentAssetVersion = localStorage.getItem('asset_version');

        // console.log('Versión deployada:', deployedVersion);
        // console.log('Versión actual en localStorage:', currentAssetVersion);

        if (currentAssetVersion && deployedVersion !== currentAssetVersion) {
          // console.log('Nueva versión de assets detectada, actualizando...');
          localStorage.setItem('asset_version', deployedVersion);
          window.location.reload(true);
          return;
        }

        localStorage.setItem('asset_version', deployedVersion);
        // console.log('Assets actualizados correctamente');
      } catch (error) {
        console.error('Error verificando version de assets:', error);
      }
    };

    // Verificar versión de datos (precios, etc)
    const firestore = getFirestore();
    // console.log('Iniciando escucha de versión en Firestore...');

    const versionRef = doc(firestore, 'config', 'version');
    const unsubscribe = onSnapshot(versionRef, (docSnap) => {
      // console.log('Cambio detectado en version de Firestore');

      if (docSnap.exists()) {
        const { current: latestVersion, forceReload } = docSnap.data();
        // console.log('Datos de version:', { latestVersion, forceReload });

        if (!localStorage.getItem('app_version')) {
          // console.log('Primera inicialización de versión');
          localStorage.setItem('app_version', latestVersion);
          setCurrentVersion(latestVersion);
          return;
        }

        if (latestVersion !== currentVersion) {
          // console.log('Nueva versión detectada:', latestVersion);
          setNeedsUpdate(true);

          setTimeout(() => {
            // console.log('Actualizando a nueva versión...');
            localStorage.setItem('app_version', latestVersion);

            if (forceReload) {
              // console.log('Forzando recarga completa');
              window.location.reload(true);
            } else {
              // console.log('Recarga normal');
              window.location.reload();
            }
          }, 10000);
        }
      } else {
        // console.log('No existe documento de versión en Firestore');
      }
    }, (error) => {
      console.error('Error en listener de Firestore:', error);
    });

    checkAssetVersion();
    // console.log('Configurando intervalo de verificación de assets');
    const assetCheckInterval = setInterval(checkAssetVersion, 30 * 60 * 1000);

    return () => {
      // console.log('Limpiando VersionChecker...');
      unsubscribe();
      clearInterval(assetCheckInterval);
    };
  }, [currentVersion]);

  if (needsUpdate) {
    return (
      <AppleModal
        isOpen={true}
        onClose={() => { }} // No permitimos cerrar manualmente
        title="Nueva versión disponible"
      >
        <p className="text-center">
          Se han actualizado partes importantes de la app. <br />
          Se actualizará automáticamente en unos segundos para que uses la ultima version.
        </p>
      </AppleModal>
    );
  }

  return children;
};

export default VersionChecker;