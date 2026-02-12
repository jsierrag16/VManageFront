import { createContext, useContext, useState, ReactNode } from 'react';
import { trasladosData as initialTrasladosData, Traslado } from '../../data/traslados';
import { Producto } from '../../data/productos';

interface TrasladosContextType {
  traslados: Traslado[];
  addTraslado: (traslado: Traslado) => void;
  updateTraslado: (id: string, traslado: Partial<Traslado>) => void;
  updateProductos: (productos: Producto[]) => void;
}

const TrasladosContext = createContext<TrasladosContextType | undefined>(undefined);

export function TrasladosProvider({ children }: { children: ReactNode }) {
  const [traslados, setTraslados] = useState<Traslado[]>(initialTrasladosData);

  const addTraslado = (traslado: Traslado) => {
    setTraslados(prev => [traslado, ...prev]);
  };

  const updateTraslado = (id: string, updates: Partial<Traslado>) => {
    setTraslados(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateProductos = (productos: Producto[]) => {
    // Esta función se puede usar para sincronizar el inventario si es necesario
    // Implementación futura si se requiere
  };

  return (
    <TrasladosContext.Provider value={{ traslados, addTraslado, updateTraslado, updateProductos }}>
      {children}
    </TrasladosContext.Provider>
  );
}

export function useTraslados() {
  const context = useContext(TrasladosContext);
  if (!context) {
    throw new Error('useTraslados must be used within a TrasladosProvider');
  }
  return context;
}