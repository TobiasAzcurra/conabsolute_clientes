import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductsByClientV2 } from '../../firebase/getProducts';
import { getClientConfig } from '../../firebase/getClientConfig';

const MenuIntro = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [introGif, setIntroGif] = useState(null);
  const [redirectPath, setRedirectPath] = useState(null);
  const [hasWaited, setHasWaited] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = await getClientConfig(slug);
        if (config?.intro) {
          setIntroGif(config.intro);
        }

        const data = await getProductsByClientV2(slug);
        const categorias = Object.keys(data?.porCategoria || {});
        const primeraCategoria = categorias[0] || null;

        if (primeraCategoria) {
          setRedirectPath(`/${slug}/menu/${primeraCategoria}`);
        } else {
          setRedirectPath(`/${slug}/menu`);
        }
      } catch (error) {
        console.error('❌ Error cargando tienda:', error);
        setRedirectPath(`/${slug}/menu`);
      } finally {
        setHasLoaded(true);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasWaited && hasLoaded && redirectPath) {
      navigate(redirectPath);
    }
  }, [hasWaited, hasLoaded, redirectPath, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      {introGif ? (
        <img
          src={introGif}
          alt="Intro"
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <>
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-purple-500 border-t-transparent mb-6" />
          <p className="text-lg font-semibold text-gray-700">
            Cargando tu tienda...
          </p>
        </>
      )}
    </div>
  );
};

export default MenuIntro;
