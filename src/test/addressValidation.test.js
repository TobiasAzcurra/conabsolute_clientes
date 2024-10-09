const Yup = require('yup');

const createAddressSchema = () => {
  return Yup.object().shape({
    deliveryMethod: Yup.string(),
    address: Yup.string().when('deliveryMethod', {
      is: 'delivery',
      then: () =>
        Yup.string()
          .test(
            'address-validation',
            'La dirección debe incluir un número de altura',
            (value) => {
              if (!value) return false;

              // Lista de calles que comienzan con números
              const streetNamesStartingWithNumbers = [
                '9 de julio',
                '25 de mayo',
                '20 de junio',
              ];

              // Expresión regular para buscar un número de altura
              const streetNumberPattern = /\b\d+(?:[-\/]\d+)?\b/;

              // Dividimos la dirección en palabras
              const words = value.toLowerCase().split(/\s+/);

              // Verificamos si la dirección comienza con una calle que empieza con número
              const startsWithNumberedStreet =
                streetNamesStartingWithNumbers.some((street) =>
                  value.toLowerCase().startsWith(street)
                );

              if (startsWithNumberedStreet) {
                // Si la calle comienza con número, buscamos otro número más adelante en la dirección
                const remainingAddress = words.slice(3).join(' ');
                if (!streetNumberPattern.test(remainingAddress)) {
                  return new Yup.ValidationError(
                    'Debe incluir un número de altura',
                    value,
                    'address'
                  );
                }
              } else {
                // Para otras calles, buscamos el número de altura normalmente
                if (!streetNumberPattern.test(value)) {
                  return new Yup.ValidationError(
                    'Debe incluir un número de altura',
                    value,
                    'address'
                  );
                }
              }

              return true;
            }
          )
          .min(3, 'Debe ser una dirección válida')
          .required('Dirección obligatoria'),
    }),
  });
};

describe('Address Validation', () => {
  const schema = createAddressSchema();

  const testAddress = async (address, shouldBeValid) => {
    try {
      await schema.validate({ deliveryMethod: 'delivery', address });
      if (!shouldBeValid) {
        console.error(
          `Expected address "${address}" to be invalid, but it passed.`
        );
      }
      expect(shouldBeValid).toBe(true);
    } catch (error) {
      if (shouldBeValid) {
        console.error(
          `Expected address "${address}" to be valid, but it failed with error: ${error.message}`
        );
      }
      expect(shouldBeValid).toBe(false);
      expect(error.message).toBe('Debe incluir un número de altura');
    }
  };

  test('Valid addresses', async () => {
    const validAddresses = [
      'Calle Falsa 123',
      'Avenida Siempreviva 742',
      '9 de Julio 1234, Río Cuarto, Córdoba Province, Argentina',
      'Paseo Colón 850',
      'Ruta 66 Km 7',
      'Iguazú 33, Río Cuarto, Córdoba Province, Argentina',
      'Avenida San Martín 1500',
      'Pasaje del Ángel 7',
      'Av. 9 de Julio 1234, Buenos Aires',
      'Boulevard Roca 1450, Río Cuarto',
      '25 de Mayo 500, Río Cuarto, Córdoba Province, Argentina',
    ];

    for (const address of validAddresses) {
      await testAddress(address, true);
    }
  });

  test('Invalid addresses', async () => {
    const invalidAddresses = [
      'Calle Sin Número',
      'Avenida Principal',
      '9 de Julio, Río Cuarto, Córdoba Province, Argentina',
      'Paseo',
      'Río Cuarto, Córdoba',
      'Iguazú, Misiones',
      'San Martín',
      'Belgrano y Colón',
      'Alvear, Río Cuarto, Córdoba Province, Argentina',
      '25 de Mayo, Río Cuarto, Córdoba Province, Argentina',
    ];

    for (const address of invalidAddresses) {
      await testAddress(address, false);
    }
  });
});
