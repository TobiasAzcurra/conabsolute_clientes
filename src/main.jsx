import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./firebase/config";

import { Provider } from "react-redux";
import store from "./redux/index";

import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";

// Función para limpiar SWs antiguos
const clearServiceWorkers = async () => {
	if ("serviceWorker" in navigator) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (let registration of registrations) {
			await registration.unregister();
		}
	}
};

// Registro del Service Worker
const registerServiceWorker = async () => {
	if ("serviceWorker" in navigator) {
		try {
			// Primero limpiamos todos los SWs anteriores
			await clearServiceWorkers();

			// Esperamos un momento antes de registrar el nuevo
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Registramos el nuevo SW
			const registration = await navigator.serviceWorker.register(
				"/serviceWorker.js",
				{
					scope: "/",
					updateViaCache: "none",
				}
			);

			// Forzar la activación inmediata
			if (registration.waiting) {
				registration.waiting.postMessage({ type: "SKIP_WAITING" });
			}

			console.log("SW registered:", registration.scope);
		} catch (error) {
			console.log("SW registration failed:", error);
		}
	}
};

// Inicialización
const init = async () => {
	try {
		// Primero limpiamos
		await clearServiceWorkers();
		// Luego registramos el nuevo
		await registerServiceWorker();
	} catch (error) {
		console.error("Error during initialization:", error);
	}
};

// Ejecutar la inicialización cuando la ventana cargue
window.addEventListener("load", init);

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
