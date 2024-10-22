const CACHE_NAME = "menu-cache-v2"; // Cambiamos la versión
const IMAGE_CACHE = "menu-images-v2";

self.addEventListener("install", (event) => {
	event.waitUntil(
		Promise.all([caches.open(CACHE_NAME), caches.open(IMAGE_CACHE)]).then(
			() => {
				// Forzar la activación inmediata
				return self.skipWaiting();
			}
		)
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			// Limpiar caches antiguas
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE) {
							return caches.delete(cacheName);
						}
					})
				);
			}),
			// Tomar control inmediatamente
			self.clients.claim(),
		])
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			// Intentar primero desde la caché
			if (cachedResponse) {
				return cachedResponse;
			}

			// Si no está en caché, intentar desde la red
			return fetch(event.request)
				.then((networkResponse) => {
					// Verificar respuesta válida
					if (!networkResponse || networkResponse.status !== 200) {
						return networkResponse;
					}

					// Guardar en caché
					const responseToCache = networkResponse.clone();
					const cacheName = event.request.url.includes("/menu/")
						? IMAGE_CACHE
						: CACHE_NAME;

					caches.open(cacheName).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return networkResponse;
				})
				.catch(() => {
					// Si falla la red y es una navegación, devolver index.html
					if (event.request.mode === "navigate") {
						return caches.match("/");
					}
					return new Response("Offline content");
				});
		})
	);
});
