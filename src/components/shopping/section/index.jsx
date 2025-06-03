import React, { useEffect, useRef } from "react";
import { items } from "../../../pages/menu/MenuPage";
import Card from "../card";
import { useSelector } from "react-redux";

const Section = ({ products = [], path }) => {
  const cart = useSelector((state) => state.cartState.cart);
  const containerRef = useRef(null);

  // Función para normalizar los productos de Firebase al formato esperado
  const normalizeProduct = (product) => {
    console.log(`🔄 Normalizando producto:`, product);

    // Estructura de Firebase: { id, categoria, data: { name, price, img }, stock }
    const normalized = {
      id: product.id,
      name: product.data?.name || product.name || "Producto sin nombre",
      description: product.data?.description || product.description || "",
      price: product.data?.price || product.price || 0,
      img: product.data?.img || product.img || "",
      category: product.categoria || product.category || path,
      rating: product.rating || 0,
      type: product.type || "regular",
      // Pasar el objeto data completo para el componente Card
      data: product.data || product,
    };

    console.log(`✅ Producto normalizado:`, {
      id: normalized.id,
      name: normalized.name,
      price: normalized.price,
      hasImage: !!normalized.img,
      imageUrl: normalized.img,
    });

    return normalized;
  };

  // Normalizar todos los productos
  const normalizedProducts = products.map(normalizeProduct);

  let originalsBurgers = [];
  let ourCollection = [];
  let satisfyer = [];
  let promo = [];

  if (items.burgers === path) {
    // Filtrar por tipo para burgers (manteniendo la lógica original)
    promo = normalizedProducts.filter((product) =>
      product.type.includes("promo")
    );
    originalsBurgers = normalizedProducts.filter((product) =>
      product.type.includes("originals")
    );
    ourCollection = normalizedProducts.filter((product) =>
      product.type.includes("our")
    );
    satisfyer = normalizedProducts.filter((product) =>
      product.type.includes("satisfyer")
    );
  } else {
    // Para otras categorías, usar todos los productos normalizados
    ourCollection = normalizedProducts;
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Componente Card helper para evitar repetición de código
  const renderCard = (product, index) => (
    <Card
      key={product.id || index}
      img={product.img}
      name={product.name}
      category={product.category}
      description={product.description}
      price={product.price}
      path={path}
      id={product.id}
      rating={product.rating}
      type={product.type}
      data={product.data} // 🔥 IMPORTANTE: Pasar el objeto data
    />
  );

  return (
    <div className="relative">
      <div ref={containerRef}>
        {items.burgers === path ? (
          <div className="mt-8 mb-4 mr-4 ml-4">
            {promo.length > 0 && (
              <div className="section">
                <p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
                  Promos
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center ">
                  {promo.map((product, i) => renderCard(product, i))}
                </div>
              </div>
            )}
            {satisfyer.length > 0 && (
              <div className="section">
                <p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
                  Satisfyers
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center ">
                  {satisfyer.map((product, i) => renderCard(product, i))}
                </div>
              </div>
            )}
            {originalsBurgers.length > 0 && (
              <div className="section">
                <p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
                  Originals
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center ">
                  {originalsBurgers.map((product, i) => renderCard(product, i))}
                </div>
              </div>
            )}
            {ourCollection.length > 0 && (
              <div className="section">
                <p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
                  Masterpieces
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  {ourCollection.map((product, i) => renderCard(product, i))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center mb-8 mt-10 px-4">
            {normalizedProducts.length > 0 ? (
              normalizedProducts.map((product, i) => renderCard(product, i))
            ) : (
              <span className="font-coolvetica text-xs text-center">
                Aun no hay productos en esta categoria
              </span>
            )}
          </div>
        )}
        {cart.length > 0 && <div className="w-full h-20 bg-black"></div>}
      </div>
    </div>
  );
};

export default Section;
