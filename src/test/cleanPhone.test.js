const cleanPhoneNumber = (phoneNumber) => {
  // Asegurarse de que phoneNumber es una cadena
  const phoneStr = String(phoneNumber);
  // Remover todo excepto los dígitos
  const digitsOnly = phoneStr.replace(/\D/g, '');
  // Si el número comienza con "54", eliminarlo
  const without54 = digitsOnly.startsWith('54')
    ? digitsOnly.slice(2)
    : digitsOnly;
  // Si el número comienza con "9", eliminarlo
  const without9 = without54.startsWith('9') ? without54.slice(1) : without54;
  // Si el número comienza con "0", eliminarlo
  const without0 = without9.startsWith('0') ? without9.slice(1) : without9;
  // Retornar el número limpio
  return without0;
};

describe('cleanPhoneNumber', () => {
  test('Debe remover el código de país +54', () => {
    const input = '54 11 1234 5678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1112345678');
  });

  test('Debe remover el prefijo 9 si está presente', () => {
    const input = '549 11 1234 5678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1112345678');
  });

  test('Debe remover el 0 inicial', () => {
    const input = '011 1234 5678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1112345678');
  });

  test('Debe remover +54 y 9 juntos', () => {
    const input = '549 261 555 1234';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('2615551234');
  });

  test('No debe modificar un número limpio', () => {
    const input = '3512345678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('3512345678');
  });

  test('Debe eliminar caracteres no numéricos', () => {
    const input = '(54) 9 11 1234-5678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1112345678');
  });

  test('Debe manejar cadenas vacías correctamente', () => {
    const input = '';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('');
  });

  test('Debe manejar números de teléfono largos correctamente', () => {
    const input = '54 911 4444 5555 ext 123';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1144445555');
  });

  test('Debe manejar un número sin prefijo correctamente', () => {
    const input = '11 1234 5678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1112345678');
  });

  test('Debe manejar números con espacios y guiones', () => {
    const input = '54-911-1234 5678';
    const output = cleanPhoneNumber(input);
    expect(output).toBe('1112345678');
  });
});
