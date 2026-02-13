
// Section.jsx - REFACTORIZADO
import React from "react";
import { useParams } from "react-router-dom";
import { useClient } from "../../../contexts/ClientContext";
import { useProducts } from "../../../hooks/useProducts"; 
import Card from "../card/Card";
import { motion } from "framer-motion"; // ✅ Importar framer-motion

const Section = () => {
  const { category } = useParams();
  const { activeFilters, activeSortOption } = useClient();

  // ✅ CAMBIO: Usar el hook useProducts
  const products = useProducts({
    categoryId: category,
    filterBy: activeFilters,
    sortBy: activeSortOption,
  });


  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Efecto cascada rápido
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  return (
    <motion.div 
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-4 gap-2 px-4 mb-10"
    >
      {products.length > 0 ? (
        products.map((p) => (
          <motion.div key={p.id} variants={cardVariants}>
            <Card data={p} path={category} />
          </motion.div>
        ))
      ) : (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="font-primary text-center text-xs font-light text-gray-400 px-8 pt-4 col-span-full"
        >
          {activeFilters.length > 0 || activeSortOption
            ? "No hay productos que coincidan con los filtros seleccionados."
            : "No hay productos en esta categoría."}
        </motion.p>
      )}
    </motion.div>
  );
};

export default Section;
