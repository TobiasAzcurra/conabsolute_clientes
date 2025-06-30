import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { v4 as uuidv4 } from 'uuid';
import { useClient } from '../contexts/ClientContext';

const StickerCanvas = ({ containerWidth, containerHeight }) => {
  const { clientAssets } = useClient();

  const [stickers, setStickers] = useState([]);

  const MIN_DISTANCE = 40;
  const MAX_ATTEMPTS = 100;

  const distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const getRandomPosition = (stickerWidth, stickerHeight, existingStickers) => {
    const padding = 20;
    const maxX = containerWidth - stickerWidth - padding;
    const maxY = Math.min(containerHeight - stickerHeight - padding, 1000);

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const x = Math.floor(Math.random() * (maxX - padding)) + padding;
      const y = Math.floor(Math.random() * (maxY - padding)) + padding;

      const isTooClose = existingStickers.some((sticker) => {
        return distance(x, y, sticker.x, sticker.y) < MIN_DISTANCE;
      });

      if (!isTooClose) {
        return { x, y };
      }
    }

    const fallbackX = Math.floor(Math.random() * (maxX - padding)) + padding;
    const fallbackY = Math.floor(Math.random() * (maxY - padding)) + padding;
    console.warn(
      `Sticker colocado en posición fallback (${fallbackX}, ${fallbackY})`
    );
    return { x: fallbackX, y: fallbackY };
  };

  useEffect(() => {
    if (containerWidth === 0 || containerHeight === 0) {
      return;
    }

    const initialStickers = [];
    const availableStickers = Array.isArray(clientAssets?.stickers)
      ? clientAssets.stickers
      : [];

    availableStickers.forEach((src, index) => {
      const { x, y } = getRandomPosition(48, 48, initialStickers);
      initialStickers.push({
        id: uuidv4(),
        src,
        x,
        y,
      });
    });

    setStickers(initialStickers);
  }, [containerWidth, containerHeight, clientAssets]);

  const updatePosition = (id, data) => {
    setStickers((prevStickers) =>
      prevStickers.map((sticker) =>
        sticker.id === id ? { ...sticker, x: data.x, y: data.y } : sticker
      )
    );
  };

  const removeSticker = (id) => {
    setStickers((prevStickers) =>
      prevStickers.filter((sticker) => sticker.id !== id)
    );
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
      <div className="w-full h-full">
        {stickers.map((sticker) => (
          <Draggable
            key={sticker.id}
            position={{ x: sticker.x, y: sticker.y }}
            onStop={(e, data) => updatePosition(sticker.id, data)}
            bounds="parent"
          >
            <img
              src={sticker.src}
              alt="Sticker"
              className="h-24 sm:w-24 sm:h-24 md:w-24 md:h-24 cursor-move pointer-events-auto"
              onDoubleClick={() => removeSticker(sticker.id)}
            />
          </Draggable>
        ))}
      </div>
    </div>
  );
};

export default StickerCanvas;
