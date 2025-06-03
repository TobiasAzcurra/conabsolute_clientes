import { useSelector, useDispatch } from "react-redux";
import { addOneItem, removeOneItem } from "../../../redux/cart/cartSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Items from "../../../pages/menu/Items";
import box from "../../../assets/box.png";
import fries from "../../../assets/fries.png";
import { getProductsByClient } from "../../../firebase/getProducts";
import CartCard from "./CartCard";
import carrusel from "../../../assets/carrusel3.jpg";
import MovingRibbon from "../MovingRibbon";
import FormCustom from "../../form";
import LoadingPoints from "../../LoadingPoints";

export const items = {
  mates: "mates",
  termos: "termos",
  bombillas: "bombillas",
  yerbas: "yerbas",
  canastas: "canastas",
  // Mantener compatibilidad con productos legacy
  burgers: "burgers",
  papas: "papas",
  bebidas: "drinks",
};

const CartItems = () => {
  const { cart, total } = useSelector((state) => state.cartState);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // Estados para productos de Firebase
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const deleteItem = (i) => {
    // ... código de Swal.fire para eliminar ítems
  };

  const clearAll = () => {
    // ... código de Swal.fire para vaciar el carrito
  };

  // Cargar productos de Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        console.log("🛒 CartItems: Cargando productos desde Firebase...");

        const productosData = await getProductsByClient();

        // Normalizar productos para compatibilidad con el carrito
        const normalizedProducts = productosData.todos.map((product) => ({
          id: product.id,
          name: product.data?.name || product.name || "Producto sin nombre",
          description: product.data?.description || product.description || "",
          price: product.data?.price || product.price || 0,
          img: product.data?.img || product.img || "",
          category: product.categoria || product.category || "default",
          type: product.type || "regular",
          // Mantener datos originales
          data: product.data || product,
          categoria: product.categoria,
        }));

        setAllProducts(normalizedProducts);

        console.log("✅ CartItems: Productos cargados:", {
          total: normalizedProducts.length,
          porCategoria: {
            mates: normalizedProducts.filter((p) => p.category === "mates")
              .length,
            termos: normalizedProducts.filter((p) => p.category === "termos")
              .length,
            bombillas: normalizedProducts.filter(
              (p) => p.category === "bombillas"
            ).length,
            yerbas: normalizedProducts.filter((p) => p.category === "yerbas")
              .length,
            canastas: normalizedProducts.filter(
              (p) => p.category === "canastas"
            ).length,
          },
        });
      } catch (error) {
        console.error("❌ CartItems: Error al cargar productos:", error);
        setAllProducts([]); // Fallback a array vacío
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    // Verifica si el carrito está vacío y si estamos en la ruta "/carrito"
    if (cart.length <= 0 && pathname === "/carrito") {
      navigate("/menu");
    }
  }, [cart, navigate, pathname]);

  // Desplazar al inicio cuando el componente se monta
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {}, [cart]);

  const decrementQuantity = (index, quantity) => {
    if (quantity > 1) {
      dispatch(removeOneItem(index));
    }
  };

  const incrementQuantity = (index) => {
    dispatch(addOneItem(index));
  };

  // Función para obtener la imagen predeterminada basada en la categoría
  const getDefaultImage = (product) => {
    // Mapear categorías de Firebase a imágenes por defecto
    const categoryImageMap = {
      // Nuevas categorías de Firebase
      mates: "/default-mate.png",
      termos: "/default-termo.png",
      bombillas: "/default-bombilla.png",
      yerbas: "/default-yerba.png",
      canastas: "/default-canasta.png",
      // Categorías legacy
      burger: box,
      burgers: box,
      papas: fries,
      drinks: "/menu/coca.png",
    };

    const defaultImg =
      categoryImageMap[product.category] || categoryImageMap[product.categoria];

    if (defaultImg) {
      console.log(
        `🎭 Imagen por defecto para ${product.name} (${product.category}):`,
        defaultImg
      );
      return defaultImg;
    }

    console.warn(
      `⚠️ No hay imagen por defecto para categoría ${
        product.category || product.categoria
      }`
    );
    return "/default-product.png";
  };

  // Filtrar productos que no están en el carrito
  const availableProducts = allProducts.filter(
    (product) => !cart.some((cartItem) => cartItem.name === product.name)
  );

  console.log("🛒 CartItems render:", {
    cartItems: cart.length,
    availableProducts: availableProducts.length,
    isLoading: isLoadingProducts,
  });

  return (
    <div className="flex flex-col font-coolvetica overflow-x-hidden">
      <div className="flex justify-center flex-col mt-8 items-center w-full">
        <p className="text-2xl font-bold">Tu pedido</p>
        <div
          className="flex flex-col md:flex-row gap-2 w-full mt-2 px-4 overflow-x-auto custom-scrollbar"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex flex-col md:flex-row gap-2 md:w-max">
            {cart.map((item, index) => (
              <CartCard
                key={item.id || index}
                item={item}
                index={index}
                getDefaultImage={getDefaultImage}
                decrementQuantity={decrementQuantity}
                incrementQuantity={incrementQuantity}
                deleteItem={deleteItem}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-col mt-6 items-start w-full">
        <p className="text-2xl font-bold mx-auto mb-2">
          Agrega. Esto no es para tibios.
        </p>

        {isLoadingProducts ? (
          <div className="flex justify-center items-center w-full h-32">
            <LoadingPoints />
          </div>
        ) : availableProducts.length > 0 ? (
          <div
            className="flex gap-2 overflow-x-auto overflow-y-hidden pl-4 pr-4 custom-scrollbar"
            style={{
              maxHeight: "300px",
              paddingBottom: "1rem",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              width: "100%",
            }}
          >
            <div className="flex gap-2" style={{ width: "max-content" }}>
              {availableProducts.map((product, index) => {
                // Determinar la URL de imagen correcta
                let productImg;
                if (product.img && product.img.startsWith("https://")) {
                  // Imagen de Firebase Storage
                  productImg = product.img;
                } else if (product.img && !product.img.startsWith("https://")) {
                  // Imagen local (legacy)
                  productImg = `/menu/${product.img}`;
                } else {
                  // Usar imagen por defecto
                  productImg = getDefaultImage(product);
                }

                console.log(`📷 Imagen para ${product.name}:`, productImg);

                return (
                  <Items
                    key={product.id || index}
                    selectedItem={product}
                    img={productImg}
                    name={product.name}
                    handleItemClick={() => {}}
                    isCart={true}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center w-full h-32">
            <p className="font-coolvetica text-gray-600 text-center">
              {allProducts.length === 0
                ? "No hay productos disponibles"
                : "¡Todos los productos están en tu carrito!"}
            </p>
          </div>
        )}
      </div>

      <FormCustom cart={cart} total={total} />

      <div className="flex justify-center flex-col mt-[-10px] items-center relative w-full">
        <MovingRibbon angle={0} />
        <img src={carrusel} className="w-full mt-28 md:hidden" alt="" />
      </div>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6; /* bg-gray-100 */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f3f4f6; /* bg-gray-100 */
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .custom-scrollbar {
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: #f3f4f6 #f3f4f6; /* Firefox */
          }
        `}
      </style>
    </div>
  );
};

export default CartItems;
