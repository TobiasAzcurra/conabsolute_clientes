// components/shopping/detail/ModifierGroupSelector.jsx
import { useState, useEffect } from "react";

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const ModifierGroupSelector = ({
  modifierGroups,
  onSelectionChange,
  className = "",
}) => {
  const [selections, setSelections] = useState({});
  const [errors, setErrors] = useState({});

  // Inicializar selecciones vacías
  useEffect(() => {
    const initialSelections = {};
    modifierGroups.forEach((group) => {
      initialSelections[group.id] = [];
    });
    setSelections(initialSelections);
  }, [modifierGroups]);

  // Validar selecciones y notificar cambios
  useEffect(() => {
    const newErrors = {};
    let isValid = true;

    modifierGroups.forEach((group) => {
      const selected = selections[group.id] || [];

      // Validar mínimo
      if (group.required && selected.length < group.minSelection) {
        newErrors[group.id] = `Seleccioná al menos ${group.minSelection}`;
        isValid = false;
      }

      // Validar máximo
      if (group.maxSelection !== null && selected.length > group.maxSelection) {
        newErrors[group.id] = `Máximo ${group.maxSelection} opciones`;
        isValid = false;
      }
    });

    setErrors(newErrors);

    // Calcular precio adicional total
    const additionalPrice = modifierGroups.reduce((total, group) => {
      const selected = selections[group.id] || [];
      const groupPrice = selected.reduce((sum, optionId) => {
        const option = group.options.find((opt) => opt.id === optionId);
        return sum + (option?.price || 0);
      }, 0);
      return total + groupPrice;
    }, 0);

    // Notificar al padre
    onSelectionChange({
      selections,
      additionalPrice,
      isValid,
    });
  }, [selections, modifierGroups, onSelectionChange]);

  const handleOptionToggle = (groupId, optionId, group) => {
    setSelections((prev) => {
      const currentSelections = prev[groupId] || [];
      const isSelected = currentSelections.includes(optionId);

      let newSelections;

      if (isSelected) {
        // Deseleccionar
        newSelections = currentSelections.filter((id) => id !== optionId);
      } else {
        // Seleccionar
        if (group.maxSelection === 1) {
          // Radio button behavior (solo uno)
          newSelections = [optionId];
        } else if (
          group.maxSelection === null ||
          currentSelections.length < group.maxSelection
        ) {
          // Checkbox behavior (múltiple)
          newSelections = [...currentSelections, optionId];
        } else {
          // Ya alcanzó el máximo
          return prev;
        }
      }

      return {
        ...prev,
        [groupId]: newSelections,
      };
    });
  };

  const isOptionSelected = (groupId, optionId) => {
    return (selections[groupId] || []).includes(optionId);
  };

  const canSelectMore = (group) => {
    const currentCount = (selections[group.id] || []).length;
    return group.maxSelection === null || currentCount < group.maxSelection;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {modifierGroups.map((group) => {
        const currentSelections = selections[group.id] || [];
        const hasError = errors[group.id];

        return (
          <div key={group.id} className="space-y-3">
            {/* Header del grupo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h5 className="font-primary font-medium text-sm text-gray-900">
                  {group.label}
                </h5>
                {group.required && (
                  <span className="text-xs text-red-500 font-light">*</span>
                )}
              </div>
              <span className="text-xs text-gray-400 font-light">
                {group.minSelection > 0 && `Min: ${group.minSelection}`}
                {group.minSelection > 0 && group.maxSelection !== null && " • "}
                {group.maxSelection !== null && `Máx: ${group.maxSelection}`}
                {group.maxSelection === null &&
                  group.minSelection === 0 &&
                  "Opcional"}
              </span>
            </div>

            {/* Error message */}
            {hasError && (
              <p className="text-xs text-red-500 font-light">{hasError}</p>
            )}

            {/* Opciones */}
            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected = isOptionSelected(group.id, option.id);
                const canSelect = canSelectMore(group) || isSelected;

                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      canSelect &&
                      handleOptionToggle(group.id, option.id, group)
                    }
                    disabled={!canSelect}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : canSelect
                        ? "border-gray-200 bg-gray-50 hover:border-gray-300"
                        : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox/Radio indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      <span className="font-primary text-sm font-light text-gray-900">
                        {capitalizeWords(option.name)}
                      </span>
                    </div>

                    {option.price > 0 && (
                      <span className="font-primary text-sm font-light text-gray-600">
                        +${option.price}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Contador de selecciones */}
            {currentSelections.length > 0 && (
              <p className="text-xs text-gray-500 font-light">
                {currentSelections.length} seleccionada
                {currentSelections.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ModifierGroupSelector;
