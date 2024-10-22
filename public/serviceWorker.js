// Nombre de la caché
const CACHE_NAME = "menu-cache-v1";
const IMAGE_CACHE = "menu-images-v1";

// Arrays de recursos a cachear
const urlsToCache = [
	"/",
	"/index.html",
	"/static/js/main.bundle.js",
	// Agrega aquí otros recursos estáticos importantes
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
	event.waitUntil(
		Promise.all([
			// Cache principal para archivos estáticos
			caches.open(CACHE_NAME).then((cache) => {
				return cache.addAll(urlsToCache);
			}),
			// Cache separado para imágenes
			caches.open(IMAGE_CACHE),
		])
	);
});

// Activación y limpieza de caches antiguas
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

// Estrategia de cache: Cache First, falling back to network
self.addEventListener("fetch", (event) => {
	// Solo manejamos peticiones GET
	if (event.request.method !== "GET") return;

	// Verificamos si es una petición de imagen
	const isImage = event.request.destination === "image";
	const cacheName = isImage ? IMAGE_CACHE : CACHE_NAME;

	event.respondWith(
		caches.open(cacheName).then((cache) => {
			return cache.match(event.request).then((response) => {
				// Cache hit - return response
				if (response) {
					// Actualizamos la caché en segundo plano (cache revalidation)
					const fetchPromise = fetch(event.request).then((networkResponse) => {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
					return response;
				}

				// Cache miss - fetch from network
				return fetch(event.request).then((networkResponse) => {
					cache.put(event.request, networkResponse.clone());
					return networkResponse;
				});
			});
		})
	);
});

// Escuchar mensajes desde la aplicación
self.addEventListener("message", (event) => {
	if (event.data.type === "CACHE_IMAGES") {
		event.waitUntil(
			caches.open(IMAGE_CACHE).then((cache) => {
				return Promise.all(
					event.data.images.map((imageUrl) => {
						return fetch(imageUrl)
							.then((response) => cache.put(imageUrl, response))
							.catch((error) =>
								console.log("Failed to cache:", imageUrl, error)
							);
					})
				);
			})
		);
	}
});
