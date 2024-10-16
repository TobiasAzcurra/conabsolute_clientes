// src/components/StickerCanvas.jsx

import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import Bolsaa from "../assets/Bolsaa.png";
import Box from "../assets/IMG-20240130-WA0059-removebg-preview.png";
// Importa más stickers si lo deseas

const availableStickers = [
	Bolsaa,
	Box,
	// Añade más stickers aquí
];

const StickerCanvas = ({ containerWidth, containerHeight }) => {
	const [stickers, setStickers] = useState([]);

	const MIN_DISTANCE = 60; // Distancia mínima en píxeles entre stickers

	// Función para calcular la distancia euclidiana entre dos puntos
	const distance = (x1, y1, x2, y2) => {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
	};

	// Función para generar una posición aleatoria que no esté demasiado cerca de otros stickers
	const getRandomPosition = (stickerWidth, stickerHeight, existingStickers) => {
		const padding = 20; // Espacio desde los bordes
		const maxX = containerWidth - stickerWidth - padding;
		const maxY = Math.min(containerHeight - stickerHeight - padding, 1000); // Limitar a 1000px

		const MAX_ATTEMPTS = 100; // Número máximo de intentos para encontrar una posición válida

		for (let i = 0; i < MAX_ATTEMPTS; i++) {
			const x = Math.floor(Math.random() * (maxX - padding)) + padding;
			const y = Math.floor(Math.random() * (maxY - padding)) + padding;

			// Verificar que la nueva posición no esté demasiado cerca de ninguna existente
			const isTooClose = existingStickers.some((sticker) => {
				return distance(x, y, sticker.x, sticker.y) < MIN_DISTANCE;
			});

			if (!isTooClose) {
				return { x, y };
			}
		}

		// Si no se encuentra una posición válida después de varios intentos, retornar una posición aleatoria
		return {
			x: Math.floor(Math.random() * (maxX - padding)) + padding,
			y: Math.floor(Math.random() * (maxY - padding)) + padding,
		};
	};

	// useEffect para inicializar los stickers al cargar la página
	useEffect(() => {
		if (containerWidth === 0 || containerHeight === 0) {
			// Evitar inicializar si las dimensiones no están disponibles
			return;
		}

		const initialStickers = [];

		availableStickers.forEach((src) => {
			for (let i = 0; i < 100; i++) {
				// Puedes ajustar el número de stickers
				const { x, y } = getRandomPosition(48, 48, initialStickers);
				initialStickers.push({
					id: `${Date.now()}-${Math.random()}`, // ID único
					src,
					x,
					y,
				});
			}
		});

		console.log("Initial Stickers:", initialStickers); // Para depuración
		setStickers(initialStickers);
	}, [containerWidth, containerHeight]);

	// Función para actualizar la posición de un sticker
	const updatePosition = (id, data) => {
		setStickers((prevStickers) =>
			prevStickers.map((sticker) =>
				sticker.id === id ? { ...sticker, x: data.x, y: data.y } : sticker
			)
		);
	};

	// Función para eliminar un sticker
	const removeSticker = (id) => {
		setStickers((prevStickers) =>
			prevStickers.filter((sticker) => sticker.id !== id)
		);
	};

	return (
		<div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
			{/* Área de canvas donde se colocan los stickers */}
			<div className="w-full h-full">
				{stickers.map((sticker) => (
					<Draggable
						key={sticker.id}
						position={{ x: sticker.x, y: sticker.y }}
						onStop={(e, data) => updatePosition(sticker.id, data)}
						bounds="parent" // Limitar el movimiento dentro del contenedor padre
					>
						<img
							src={sticker.src}
							alt="Sticker"
							className="h-52 sm:w-36 sm:h-36 md:w-48 md:h-48 cursor-move pointer-events-auto"
							onDoubleClick={() => removeSticker(sticker.id)}
						/>
					</Draggable>
				))}
			</div>
		</div>
	);
};

export default StickerCanvas;
