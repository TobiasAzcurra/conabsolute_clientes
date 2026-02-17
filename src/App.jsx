import { BrowserRouter } from "react-router-dom";
import AppRouter from "./Router";
import { HelmetProvider } from "react-helmet-async";
import { ClientProvider } from "./contexts/ClientContext";
import { CartProvider } from "./contexts/CartContext";
import "./fontAwesome";
import ThemeProvider from "./components/ThemeProvider";
import DebugOverlay from "./components/DebugOverlay";

function App() {
  return (
    <BrowserRouter>
      <ClientProvider>
        <HelmetProvider>
          <ThemeProvider>
            <CartProvider>
              <AppRouter />
            </CartProvider>
          </ThemeProvider>
        </HelmetProvider>
        {/* <DebugOverlay /> */}
      </ClientProvider>
    </BrowserRouter>
  );
}

export default App;
