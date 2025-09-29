import { BrowserRouter } from "react-router-dom";
import AppRouter from "./Router";
import { HelmetProvider } from "react-helmet-async";
import { ClientProvider } from "./contexts/ClientContext";
import { CartProvider } from "./contexts/CartContext";
import "./fontAwesome";

function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <ClientProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </ClientProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}

export default App;
