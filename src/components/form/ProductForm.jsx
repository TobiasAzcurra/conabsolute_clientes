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
    installments: {
      enabled: false,
      interest: 0,
      quantity: 1,
    },
    cashDiscount: {
      enabled: false,
      percentage: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [variants, setVariants] = useState([]);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        color: '',
        size: '',
        price: '',
        stock: '',
        img: [],
        files: [],
        labradoName: '',
        labradoFile: null,
      },
    ]);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleVariantImageChange = async (e, index) => {
    const files = Array.from(e.target.files);
    const processed = [];

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
          processed.push(jpgFile);
        } catch (err) {
          setError(
            (prev) =>
              prev +
              `No se pudo convertir la imagen ${file.name}. Usa JPG o PNG. `
          );
        }
      } else {
        processed.push(file);
      }
    }

    const updated = [...variants];
    updated[index].files = processed;
    setVariants(updated);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e) => {
    setError('');
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
        }
      } else {
        processedFiles.push(file);
      }
    }
    setFormData({ ...formData, img: processedFiles });
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

      const processedVariants = [];
      for (const variant of variants) {
        const urls = [];
        for (const file of variant.files || []) {
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

        let labradoImageUrl = '';
        if (variant.labradoFile) {
          const labradoRef = ref(
            storage,
            `conabsoluteClientes/${empresa}/sucursales/${sucursal}/productos/labrados/${Date.now()}_${
              variant.labradoFile.name
            }`
          );
          await uploadBytes(labradoRef, variant.labradoFile);
          labradoImageUrl = await getDownloadURL(labradoRef);
        }

        const attributes = {};
        if (variant.color) attributes.color = variant.color;
        if (variant.size) attributes.size = variant.size;
        if (variant.labradoName) attributes.labradoName = variant.labradoName;

        const parsedPrice = Number(variant.price);
        const parsedStock = Number(variant.stock);

        const variantData = {
          attributes,
          images: urls,
          price: !isNaN(parsedPrice) ? parsedPrice : Number(formData.price),
        };

        if (!isNaN(parsedStock)) {
          variantData.stock = parsedStock;
        }

        if (variant.labradoName) {
          variantData.labrado = {
            name: variant.labradoName,
            img: labradoImageUrl || '',
          };
        }

        processedVariants.push(variantData);
      }

      const productData = {
        ...formData,
        img: urls,
        price: Number(formData.price),
        createdAt: new Date(),
        active: true,
        variants: processedVariants,
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

      <div className="border p-3 rounded space-y-2">
        <h4 className="font-semibold">Financiación (Installments)</h4>
        <label className="block">
          <input
            type="checkbox"
            checked={formData.installments.enabled}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                installments: {
                  ...prev.installments,
                  enabled: e.target.checked,
                },
              }))
            }
          />
          Habilitar cuotas
        </label>
        <input
          type="number"
          placeholder="Interés (%)"
          value={formData.installments.interest}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              installments: {
                ...prev.installments,
                interest: Number(e.target.value),
              },
            }))
          }
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Cantidad de cuotas"
          value={formData.installments.quantity}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              installments: {
                ...prev.installments,
                quantity: Number(e.target.value),
              },
            }))
          }
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="border p-3 rounded space-y-2">
        <h4 className="font-semibold">Descuento por pago en efectivo</h4>
        <label className="block">
          <input
            type="checkbox"
            checked={formData.cashDiscount.enabled}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cashDiscount: {
                  ...prev.cashDiscount,
                  enabled: e.target.checked,
                },
              }))
            }
          />
          Habilitar descuento en efectivo
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="Porcentaje de descuento (ej: 0.15)"
          value={formData.cashDiscount.percentage}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              cashDiscount: {
                ...prev.cashDiscount,
                percentage: Number(e.target.value),
              },
            }))
          }
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

      <div>
        <h4 className="font-semibold mb-2">Variantes</h4>
        {variants.map((variant, index) => (
          <div key={index} className="border p-3 rounded mb-3 space-y-2">
            <input
              type="text"
              placeholder="Color"
              value={variant.color}
              onChange={(e) =>
                handleVariantChange(index, 'color', e.target.value)
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Tamaño (opcional)"
              value={variant.size}
              onChange={(e) =>
                handleVariantChange(index, 'size', e.target.value)
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Precio (opcional, usa el general si se deja vacío)"
              value={variant.price}
              onChange={(e) =>
                handleVariantChange(index, 'price', e.target.value)
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Stock (opcional)"
              value={variant.stock}
              onChange={(e) =>
                handleVariantChange(index, 'stock', e.target.value)
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Nombre del labrado (opcional)"
              value={variant.labradoName}
              onChange={(e) =>
                handleVariantChange(index, 'labradoName', e.target.value)
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleVariantChange(index, 'labradoFile', e.target.files[0])
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleVariantImageChange(e, index)}
              className="w-full border p-2 rounded"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addVariant}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          + Agregar Variante
        </button>
      </div>

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
