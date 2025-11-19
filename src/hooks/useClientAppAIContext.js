// hooks/useClientAppAIContext.js
import { useMemo, useEffect } from "react";

const DAY_NAMES = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DEFAULT_CONFIG = {
  enabled: true,
  customInstructions: "",
  systemPrompt: null,
  includeProducts: true,
  includeSchedules: true,
  includeCategories: true,
};

const DEFAULT_SYSTEM_PROMPT = `Eres un asistente virtual de atención al cliente. Tu objetivo es ayudar a los clientes a realizar pedidos, responder preguntas sobre productos, horarios y servicios.

IMPORTANTES:
- Responde en español de Argentina, de manera amigable y profesional
- Usa "vos" en lugar de "tú" (tuteo argentino)
- Si no tenés información sobre algo, decilo honestamente
- Siempre confirmá detalles importantes del pedido
- Sé conciso pero completo en tus respuestas`;

export const useClientAppAIContext = ({
  products = [],
  categories = [],
  businessHours,
  aiBotConfig,
}) => {
  // Usar config recibida o default
  const config = aiBotConfig || DEFAULT_CONFIG;
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const context = useMemo(() => {
    console.log("🔄 Generando contexto para AI Bot...");

    let contextString = `═══════════════════════════════════════
🤖 ASISTENTE VIRTUAL DE ATENCIÓN AL CLIENTE
═══════════════════════════════════════

`;

    // ✅ Instrucciones personalizadas
    if (config.customInstructions && config.customInstructions.trim()) {
      contextString += `📋 INSTRUCCIONES PERSONALIZADAS:
${config.customInstructions.trim()}

`;
    }

    // ✅ Horarios de atención
    if (config.includeSchedules && businessHours) {
      contextString += `⏰ HORARIOS DE ATENCIÓN:
${formatBusinessHours(businessHours)}

`;
    }

    // ✅ Categorías disponibles
    if (config.includeCategories && categories.length > 0) {
      contextString += `📂 CATEGORÍAS DISPONIBLES:
${formatCategories(categories)}

`;
    }

    // ✅ Productos disponibles
    if (config.includeProducts && products.length > 0) {
      contextString += `🛍️ PRODUCTOS DISPONIBLES:
${formatProducts(products, categories)}

`;
    }

    // Footer con instrucciones para la IA
    contextString += `═══════════════════════════════════════
🎯 INSTRUCCIONES IMPORTANTES PARA EL ASISTENTE
═══════════════════════════════════════

SOBRE PRODUCTOS CON VARIANTES:
Algunos productos tienen muchas variantes (colores, talles, tamaños, etc.). Para estos productos:
- Verás los ATRIBUTOS disponibles (ej: "Talles: M, L, XL")
- Verás los COLORES/OPCIONES disponibles (ej: "Colores: Rojo, Azul")
- Pero NO todas las combinaciones específicas están detalladas

CÓMO RESPONDER:
- Si un cliente pregunta por un atributo NO listado: "Los [atributos] disponibles que tengo registrados son: [lista]. No veo [atributo pedido] en mi información, pero podría estar disponible. ¿Querés que consulte con el equipo?"
- Si un cliente pregunta por atributos SÍ listados: Respondé con confianza usando la información disponible

REGLAS GENERALES:
- Solo podés responder sobre los productos, horarios y servicios listados arriba
- Si te preguntan algo que no está en la información, decile al cliente que necesitás consultar con el equipo
- Siempre confirmá los detalles importantes (dirección, método de pago, productos)
- Sé amable, profesional y conciso
- Usá el tuteo argentino ("vos" en lugar de "tú")

¿En qué puedo ayudarte?
`;

    console.log("✅ Contexto generado:", {
      length: contextString.length,
      hasInstructions: !!config.customInstructions,
      productsCount: products.length,
      categoriesCount: categories.length,
      hasSchedules: !!businessHours,
    });

    // 🔍 DEBUG: Mostrar contexto completo
    console.log("\n═══════════════════════════════════════");
    console.log("📋 CONTEXTO COMPLETO ENVIADO AL BOT:");
    console.log("═══════════════════════════════════════");
    console.log(contextString);
    console.log("═══════════════════════════════════════\n");

    return contextString;
  }, [config, products, categories, businessHours]);

  const debugInfo = useMemo(() => {
    return {
      productsCount: products.length,
      categoriesCount: categories.length,
      hasSchedules: !!businessHours,
      hasCustomInstructions: !!config.customInstructions?.trim(),
      contextLength: context.length,
      includeProducts: config.includeProducts,
      includeCategories: config.includeCategories,
      includeSchedules: config.includeSchedules,
    };
  }, [products, categories, businessHours, config, context]);

  useEffect(() => {
    console.log("═══════════════════════════════════════");
    console.log("🤖 CONTEXTO AI BOT GENERADO");
    console.log("═══════════════════════════════════════");
    console.log("Productos:", debugInfo.productsCount);
    console.log("Categorías:", debugInfo.categoriesCount);
    console.log("Horarios:", debugInfo.hasSchedules ? "Sí" : "No");
    console.log(
      "Instrucciones custom:",
      debugInfo.hasCustomInstructions ? "Sí" : "No"
    );
    console.log(
      "Longitud contexto:",
      context.length.toLocaleString(),
      "caracteres"
    );
    console.log("\nPrimeros 500 caracteres del contexto:");
    console.log(context.substring(0, 500) + "...");
    console.log("═══════════════════════════════════════\n");
  }, [context, debugInfo]);

  return {
    context,
    systemPrompt,
    debugInfo,
  };
};

// ═══════════════════════════════════════
// FUNCIONES DE FORMATEO
// ═══════════════════════════════════════

function formatBusinessHours(businessHours) {
  let hoursText = "";

  // Horarios regulares por día
  Object.entries(businessHours.schedule).forEach(([dayKey, daySchedule]) => {
    const dayName = DAY_NAMES[dayKey] || dayKey;

    if (!daySchedule.isOpen) {
      hoursText += `  ${dayName}: Cerrado\n`;
    } else if (daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
      const slots = daySchedule.timeSlots
        .map((slot) => `${slot.openTime} - ${slot.closeTime}`)
        .join(", ");
      hoursText += `  ${dayName}: ${slots}\n`;
    }
  });

  // Fechas especiales
  if (businessHours.specialDates && businessHours.specialDates.length > 0) {
    hoursText += "\n  FECHAS ESPECIALES:\n";
    businessHours.specialDates.forEach((specialDate) => {
      const date = formatDate(specialDate.date);
      if (!specialDate.isOpen) {
        hoursText += `  • ${date} (${specialDate.reason}): Cerrado\n`;
      } else {
        const slots = specialDate.timeSlots
          .map((slot) => `${slot.openTime} - ${slot.closeTime}`)
          .join(", ");
        hoursText += `  • ${date} (${specialDate.reason}): ${slots}\n`;
      }
    });
  }

  return hoursText.trim();
}

function formatCategories(categories) {
  const activeCategories = categories
    .filter((cat) => cat.active !== false)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  if (activeCategories.length === 0) {
    return "  No hay categorías activas\n";
  }

  return activeCategories.map((cat) => `  • ${cat.name}`).join("\n");
}

function formatProducts(products, categories) {
  // Filtrar solo productos activos
  const activeProducts = products.filter((p) => p.active !== false);

  if (activeProducts.length === 0) {
    return "  No hay productos activos en este momento\n";
  }

  // Agrupar por categoría
  const productsByCategory = {};

  activeProducts.forEach((product) => {
    const categoryName =
      categories.find((c) => c.id === product.category)?.name ||
      product.category ||
      "Sin categoría";

    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = [];
    }
    productsByCategory[categoryName].push(product);
  });

  // Ordenar categorías alfabéticamente
  const sortedCategories = Object.keys(productsByCategory).sort();

  let productsText = "";

  sortedCategories.forEach((categoryName) => {
    productsText += `\n  ${categoryName.toUpperCase()}:\n`;

    const categoryProducts = productsByCategory[categoryName];

    categoryProducts.forEach((product) => {
      productsText += formatSingleProduct(product);
    });
  });

  return productsText.trim();
}

// ═══════════════════════════════════════
// FORMATEO INTELIGENTE DE PRODUCTOS
// ═══════════════════════════════════════

function formatSingleProduct(product) {
  const activeVariants =
    product.variants?.filter((v) => v.active !== false) || [];
  const productType = detectProductType(product, activeVariants);

  // 🔍 DEBUG: Log para cada producto
  console.log(`\n🔍 Formateando producto: ${product.name}`);
  console.log(`   Tipo detectado: ${productType}`);
  console.log(`   Variantes activas: ${activeVariants.length}`);
  if (activeVariants.length > 0) {
    console.log(`   Primera variante:`, {
      default: activeVariants[0].default,
      hasModifiers: activeVariants[0].hasModifiers,
      modifierGroupsCount: activeVariants[0].modifierGroups?.length || 0,
    });
  }

  switch (productType) {
    case "SIMPLE":
      return formatSimpleProduct(product);
    case "WITH_MODIFIERS":
      console.log(`   ✅ Formateando como WITH_MODIFIERS`);
      return formatProductWithModifiers(product, activeVariants);
    case "FEW_VARIANTS":
      return formatProductWithFewVariants(product, activeVariants);
    case "MANY_VARIANTS":
      return formatProductWithManyVariants(product, activeVariants);
    default:
      return formatSimpleProduct(product);
  }
}

function detectProductType(product, activeVariants) {
  // Tipo 1: Simple (solo default sin modifiers)
  if (
    activeVariants.length === 1 &&
    activeVariants[0].default &&
    !activeVariants[0].hasModifiers
  ) {
    return "SIMPLE";
  }

  // Tipo 2: Con modifiers
  if (
    activeVariants.some((v) => v.hasModifiers && v.modifierGroups?.length > 0)
  ) {
    return "WITH_MODIFIERS";
  }

  // Tipo 3: Con variantes
  const realVariants = activeVariants.filter((v) => !v.default);
  if (realVariants.length > 0) {
    return realVariants.length <= 8 ? "FEW_VARIANTS" : "MANY_VARIANTS";
  }

  return "SIMPLE";
}

// TIPO 1: Productos simples
function formatSimpleProduct(product) {
  const name = capitalizeFirst(product.name);
  const price = formatPrice(product.price || 0);
  const stock = getStockInfo(product);
  const description = getDescription(product);
  const tags = getTags(product);

  let text = `    • ${name} - ${price}`;
  if (stock) text += ` (${stock})`;
  text += "\n";
  if (description) text += `      ${description}\n`;
  if (tags) text += `      Tags: ${tags}\n`;

  return text;
}

// TIPO 2: Productos con modifiers
function formatProductWithModifiers(product, activeVariants) {
  const name = capitalizeFirst(product.name);
  const price = formatPrice(product.price || 0);
  const stock = getStockInfo(product);
  const description = getDescription(product);
  const tags = getTags(product);

  let text = `    • ${name} - ${price}`;
  if (stock) text += ` (${stock})`;
  text += "\n";
  if (description) text += `      ${description}\n`;

  // Formatear modifiers
  const variantWithModifiers = activeVariants.find((v) => v.hasModifiers);
  if (variantWithModifiers?.modifierGroups) {
    const modifiersText = formatModifiers(variantWithModifiers.modifierGroups);
    if (modifiersText) {
      text += `      Personalizá con: ${modifiersText}\n`;
    }
  }

  if (tags) text += `      Tags: ${tags}\n`;

  return text;
}

// TIPO 3A: Pocas variantes (2-8) - Listar todas
function formatProductWithFewVariants(product, activeVariants) {
  const name = capitalizeFirst(product.name);
  const stock = getStockInfo(product);
  const description = getDescription(product);
  const tags = getTags(product);

  let text = `    • ${name}`;
  if (stock) text += ` (${stock})`;
  text += "\n";

  // Listar cada variante
  const realVariants = activeVariants.filter((v) => !v.default);
  realVariants.forEach((variant) => {
    const variantName = variant.name || "Estándar";
    const variantPrice = calculateVariantPrice(product, variant);
    const variantStock = variant.stockSummary?.totalStock || 0;

    text += `      → ${variantName}: ${formatPrice(variantPrice)}`;
    if (!product.infiniteStock && variantStock > 0) {
      text += ` (${variantStock} unidades)`;
    }
    text += "\n";
  });

  if (description) text += `      ${description}\n`;
  if (tags) text += `      Tags: ${tags}\n`;

  return text;
}

// TIPO 3B: Muchas variantes (9+) - Agrupar inteligente
function formatProductWithManyVariants(product, activeVariants) {
  const name = capitalizeFirst(product.name);
  const description = getDescription(product);
  const tags = getTags(product);

  const realVariants = activeVariants.filter((v) => !v.default);
  const totalStock = getTotalStock(product, realVariants);

  // Obtener rango de precios
  const prices = realVariants
    .map((v) => calculateVariantPrice(product, v))
    .filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price || 0;

  let text = `    • ${name} - Desde ${formatPrice(minPrice)}`;
  if (totalStock > 0) {
    text += ` (Stock: ${totalStock} unidades)`;
  }
  text += "\n";

  // Extraer y agrupar atributos
  const attributes = extractAttributes(realVariants);

  Object.entries(attributes).forEach(([attrName, values]) => {
    if (attrName !== "id" && attrName !== "default") {
      const valueList = Array.from(values).join(", ");
      text += `      ${attrName}: ${valueList}\n`;
    }
  });

  // Detectar patrón de precios (ej: por cantidad)
  const pricePattern = detectPricePattern(realVariants, attributes);
  if (pricePattern) {
    text += `      ${pricePattern}\n`;
  }

  text += `      (${realVariants.length} variantes totales, atributos principales listados)\n`;

  if (description) text += `      ${description}\n`;
  if (tags) text += `      Tags: ${tags}\n`;

  return text;
}

// ═══════════════════════════════════════
// FUNCIONES HELPER
// ═══════════════════════════════════════

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatPrice(price) {
  return `$${new Intl.NumberFormat("es-AR").format(price)}`;
}

function calculateVariantPrice(product, variant) {
  // Si la variante tiene precio, usar ese
  if (variant.price && variant.price > 0) {
    return variant.price;
  }
  // Si no, usar el precio base del producto
  return product.price || 0;
}

function getStockInfo(product) {
  if (product.infiniteStock) {
    return "Stock disponible";
  }

  if (product.variants && product.variants.length > 0) {
    const totalStock = product.variants.reduce(
      (sum, v) => sum + (v.stockSummary?.totalStock || 0),
      0
    );
    return totalStock > 0 ? "Stock disponible" : "Sin stock";
  }

  return "";
}

function getTotalStock(product, variants) {
  if (product.infiniteStock) return 999;

  return variants.reduce(
    (sum, v) => sum + (v.stockSummary?.totalStock || 0),
    0
  );
}

function getDescription(product) {
  const desc =
    product.detailDescription ||
    product.cardDescription ||
    product.description ||
    "";

  if (desc.length === 0) return "";

  // Truncar a infinitos caracteres
  if (desc.length <= 99999999999999) return desc;

  return desc.substring(0, 117) + "...";
}

function getTags(product) {
  if (!product.tags || product.tags.length === 0) return "";
  return product.tags.join(", ");
}

function formatModifiers(modifierGroups) {
  return modifierGroups
    .map((group) => {
      const options = group.options || [];

      // Separar gratis vs con precio
      const free = options.filter((o) => !o.price || o.price === 0);
      const paid = options.filter((o) => o.price > 0);

      let text = group.label;

      // Opciones gratis
      if (free.length > 0) {
        const freeNames = free.map((o) => o.name).join(", ");
        text += `: ${freeNames} (gratis)`;
      }

      // Opciones con precio
      if (paid.length > 0) {
        const uniquePrices = [...new Set(paid.map((o) => o.price))];
        if (uniquePrices.length === 1) {
          // Todas al mismo precio
          const paidNames = paid.map((o) => o.name).join(", ");
          text += ` | ${paidNames} (+${formatPrice(uniquePrices[0])})`;
        } else {
          // Precios variados
          text += ` | Extras desde ${formatPrice(Math.min(...uniquePrices))}`;
        }
      }

      return text;
    })
    .join(" | ");
}

function extractAttributes(variants) {
  const attrs = {};

  variants.forEach((v) => {
    if (v.attributes) {
      Object.entries(v.attributes).forEach(([key, value]) => {
        if (key !== "default" && key !== "id" && key !== "hasModifiers") {
          if (!attrs[key]) {
            attrs[key] = new Set();
          }
          attrs[key].add(String(value));
        }
      });
    }
  });

  return attrs;
}

function detectPricePattern(variants, attributes) {
  // Detectar si hay un atributo que define rangos de precio
  // Por ejemplo: "Unidades" con "1-4", "5-14", "+15"

  const quantityKeys = ["Unidades", "Cantidad", "unidades", "cantidad"];
  const quantityAttr = quantityKeys.find((key) => attributes[key]);

  if (!quantityAttr) return null;

  // Agrupar variantes por el atributo de cantidad
  const pricesByQuantity = {};

  variants.forEach((v) => {
    if (v.attributes && v.attributes[quantityAttr]) {
      const qty = v.attributes[quantityAttr];
      const price = v.price || 0;

      if (!pricesByQuantity[qty]) {
        pricesByQuantity[qty] = [];
      }
      if (price > 0) {
        pricesByQuantity[qty].push(price);
      }
    }
  });

  // Calcular precio promedio por rango
  const ranges = Object.entries(pricesByQuantity).map(([qty, prices]) => {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { quantity: qty, price: avg };
  });

  if (ranges.length === 0) return null;

  // Ordenar por precio descendente
  ranges.sort((a, b) => b.price - a.price);

  // Formatear
  const rangesText = ranges
    .map((r) => {
      if (r.price === 0) {
        return `${r.quantity} (consultar precio)`;
      }
      return `${r.quantity} (${formatPrice(r.price)})`;
    })
    .join(" | ");

  return `Precios según ${quantityAttr.toLowerCase()}: ${rangesText}`;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}
