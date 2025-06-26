import React, { useState } from 'react';
import { addProduct } from '../../firebase/products/addProducts';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import heic2any from 'heic2any';

const ProductForm = ({ empresa, sucursal, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    img: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    setError(''); // Limpia el error anterior
    const files = Array.from(e.target.files);
    const processedFiles = [];

    for (const file of files) {
      if (
        file.type === 'image/heic' ||
        file.name.toLowerCase().endsWith('.heic')
      ) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          const jpgFile = new File(
            [convertedBlob],
            file.name.replace(/\.heic$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
          processedFiles.push(jpgFile);
        } catch (err) {
          setError(
            (prev) =>
              prev +
              `No se pudo convertir la imagen ${file.name}. Usa JPG o PNG. `
          );
          // No agregues el archivo si falla la conversión
        }
      } else {
        processedFiles.push(file);
      }
    }
    setFormData({ ...formData, img: processedFiles });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const storage = getStorage();
      const urls = [];
      for (const file of formData.img) {
        const storageRef = ref(
          storage,
          `conabsoluteClientes/${empresa}/sucursales/${sucursal}/productos/${Date.now()}_${
            file.name
          }`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }

      const productData = {
        ...formData,
        img: urls,
        price: Number(formData.price),
        createdAt: new Date(),
        active: true,
      };

      await addProduct(empresa, sucursal, productData);
      setFormData({ name: '', price: '', category: '', img: [] });
      onSuccess?.();
    } catch (err) {
      setError('Error al guardar el producto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border rounded shadow space-y-4"
    >
      <div>
        <label>Nombre:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label>Precio:</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label>Categoría:</label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label>Imágenes (URLs):</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Guardando...' : 'Agregar Producto'}
      </button>
    </form>
  );
};

export default ProductForm;
