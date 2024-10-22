import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./firebase/config";

import { Provider } from "react-redux";
import store from "./redux/index";

import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";

// Registro del Service Worker
const registerServiceWorker = async () => {
	// Removemos temporalmente la verificación del entorno
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register(
				"/serviceWorker.js",
				{
					scope: "/",
				}
			);
			console.log("SW registered:", registration.scope);
		} catch (error) {
			console.log("SW registration failed:", error);
		}
	}
};

// Registrar el SW cuando la ventana cargue
window.addEventListener("load", () => {
	registerServiceWorker();
});

const persistor = persistStore(store);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<App />
			</PersistGate>
		</Provider>
	</React.StrictMode>
);
