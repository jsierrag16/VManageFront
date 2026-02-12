import { createContext, useContext, useState, ReactNode } from 'react';
import { productosData as initialProductosData, Producto } from '../../data/productos';

interface ProductosContextType {
  productos: Producto[];
  addProducto: (producto: Producto) => void;
  updateProducto: (id: string, producto: Producto) => void;
  deleteProducto: (id: string) => void;
  getProductoById: (id: string) => Producto | undefined;
}

const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

export function ProductosProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(initialProductosData);

  const addProducto = (producto: Producto) => {
    setProductos(prev => [...prev, producto]);
  };

  const updateProducto = (id: string, productoActualizado: Producto) => {
    setProductos(prev => prev.map(p => p.id === id ? productoActualizado : p));
  };

  const deleteProducto = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const getProductoById = (id: string) => {
    return productos.find(p => p.id === id);
  };

  return (
    <ProductosContext.Provider value={{ productos, addProducto, updateProducto, deleteProducto, getProductoById }}>
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos() {
  const context = useContext(ProductosContext);
  if (context === undefined) {
    throw new Error('useProductos debe usarse dentro de un ProductosProvider');
  }
  return context;
}