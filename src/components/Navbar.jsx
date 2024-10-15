import React from "react";
import Logo from "../assets/anheloTMblack.png";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { changeLastCart } from "../redux/cart/cartSlice";
import SignInButton from "./google/SignInButton";
import { projectAuth } from "../firebase/config";
import { useState } from "react";
import { useEffect } from "react";

const Navbar = () => {
  const { cart, lastCart } = useSelector((state) => state.cartState);
  const { user } = useSelector((state) => state.userState); // Obtén el usuario del estado de Redux
  const dispatch = useDispatch();
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const unsubscribe = projectAuth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // Si el usuario está autenticado, lo guardamos en Redux
        dispatch(setUser(authUser));
      } else {
        // Si no hay usuario, limpiamos el estado en Redux
        dispatch(clearUser());
      }
    });

    return () => unsubscribe(); // Limpia la suscripción al desmontar
  }, [dispatch]);

  return (
    <nav className="font-sans bg-[#efefef] w-full  shadow m-0">
      <div className="w-full mx-auto px-4">
        <div className="flex items-center justify-between py-3 font-antonio">
          <Link to="/menu">
            <img src={Logo} className="h-5" />
          </Link>
          <SignInButton />
          <h3>Bienvenido a ANHELO</h3>
          {user ? (
            <div>
              <h2>Hola, {user.displayName}!</h2>
              <p>Tu correo: {user.email}</p>
            </div>
          ) : (
            <SignInButton />
          )}
          <div className="flex items-center">
            {lastCart ? (
              <Link
                onClick={() => dispatch(changeLastCart())}
                to={lastCart.length > 0 ? "/carrito" : "#"}
                className={`text-black border-black px-4 border-2 text-xs font-bold hover:text-red-main hover:bg-black  ${
                  lastCart.length > 0 ? "" : "cursor-not-allowed opacity-50 "
                }`}
              >
                Repetir pedido
              </Link>
            ) : (
              <></>
            )}
            <Link
              to={cart.length > 0 ? "/carrito" : "#"}
              className={`text-black border-black px-4 border-2 text-xs font-bold hover:text-red-main hover:bg-black  ${
                cart.length > 0 ? "" : "cursor-not-allowed opacity-50 "
              }`}
            >
              CARRITO ({totalQuantity})
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
