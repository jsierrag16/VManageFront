import { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, Package, Clock, Truck, CheckCircle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../../shared/components/ui/dialog';
import { Badge } from '../../../shared/components/ui/badge';
import { ScrollArea } from '../../../shared/components/ui/scroll-area';
import { toast } from 'sonner';
import { Traslado } from '../../../data/traslados';
import { Producto } from '../../../data/productos';

interface NotificacionesProps {
  traslados: Traslado[];
  productos: Producto[];
  selectedBodega: string;
  onNavigateToTraslados?: () => void;
  onNavigateToExistencias?: () => void;
}

export interface Notificacion {
  id: string;
  tipo: 'traslado' | 'vencimiento' | 'stockBajo';
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: 'alta' | 'media' | 'baja';
  leida: boolean;
  datos?: any;
}

export default function Notificaciones({ 
  traslados, 
  productos, 
  selectedBodega,
  onNavigateToTraslados,
  onNavigateToExistencias 
}: NotificacionesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // Generar notificaciones basadas en los datos
  const generarNotificaciones = useMemo(() => {
    const notifs: Notificacion[] = [];
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);

    // Filtrar por bodega si no es "Todas las bodegas"
    const trasladosFiltrados = selectedBodega === 'Todas las bodegas' 
      ? traslados 
      : traslados.filter(t => 
          t.bodegaOrigen === selectedBodega || t.bodegaDestino === selectedBodega
        );

    // 1. Notificaciones de traslados pendientes (estado Enviado)
    trasladosFiltrados
      .filter(t => t.estado === 'Enviado')
      .forEach(traslado => {
        const diasTranscurridos = Math.floor(
          (hoy.getTime() - new Date(traslado.fecha).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        notifs.push({
          id: `traslado-${traslado.id}`,
          tipo: 'traslado',
          titulo: `Traslado pendiente: ${traslado.codigo}`,
          descripcion: `De ${traslado.bodegaOrigen} a ${traslado.bodegaDestino} - ${traslado.items.length} productos - ${diasTranscurridos} día(s) en tránsito`,
          fecha: traslado.fecha,
          prioridad: diasTranscurridos > 3 ? 'alta' : diasTranscurridos > 1 ? 'media' : 'baja',
          leida: false,
          datos: traslado
        });
      });

    // 2. Notificaciones de productos próximos a vencer (próximos 30 días)
    productos.forEach(producto => {
      producto.lotes.forEach(lote => {
        // Filtrar por bodega si no es "Todas las bodegas"
        if (selectedBodega !== 'Todas las bodegas' && lote.bodega !== selectedBodega) {
          return;
        }

        const fechaVencimiento = new Date(lote.fechaVencimiento);
        const diasParaVencer = Math.floor(
          (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diasParaVencer >= 0 && diasParaVencer <= 30 && lote.cantidadDisponible > 0) {
          notifs.push({
            id: `vencimiento-${lote.id}`,
            tipo: 'vencimiento',
            titulo: `Producto próximo a vencer: ${producto.nombre}`,
            descripcion: `Lote ${lote.numeroLote} - ${lote.cantidadDisponible} unidades - Vence en ${diasParaVencer} día(s) - ${lote.bodega}`,
            fecha: lote.fechaVencimiento,
            prioridad: diasParaVencer <= 7 ? 'alta' : diasParaVencer <= 15 ? 'media' : 'baja',
            leida: false,
            datos: { producto, lote }
          });
        }
      });
    });

    // 3. Notificaciones de stock bajo (menos de 50 unidades por bodega)
    productos.forEach(producto => {
      // Agrupar stock por bodega
      const stockPorBodega: { [key: string]: number } = {};
      producto.lotes.forEach(lote => {
        if (!stockPorBodega[lote.bodega]) {
          stockPorBodega[lote.bodega] = 0;
        }
        stockPorBodega[lote.bodega] += lote.cantidadDisponible;
      });

      Object.entries(stockPorBodega).forEach(([bodega, stock]) => {
        // Filtrar por bodega si no es "Todas las bodegas"
        if (selectedBodega !== 'Todas las bodegas' && bodega !== selectedBodega) {
          return;
        }

        if (stock > 0 && stock < 50) {
          notifs.push({
            id: `stock-${producto.id}-${bodega}`,
            tipo: 'stockBajo',
            titulo: `Stock bajo: ${producto.nombre}`,
            descripcion: `Solo ${stock} unidades disponibles en ${bodega}`,
            fecha: hoy.toISOString(),
            prioridad: stock < 20 ? 'alta' : 'media',
            leida: false,
            datos: { producto, bodega, stock }
          });
        }
      });
    });

    // Ordenar por prioridad y fecha
    return notifs.sort((a, b) => {
      const prioridadPeso = { alta: 3, media: 2, baja: 1 };
      const pesoDiff = prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad];
      if (pesoDiff !== 0) return pesoDiff;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }, [traslados, productos, selectedBodega]);

  useEffect(() => {
    setNotificaciones(generarNotificaciones);
  }, [generarNotificaciones]);

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarComoLeida = (id: string) => {
    setNotificaciones(prev => 
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const handleNotificacionClick = (notif: Notificacion) => {
    marcarComoLeida(notif.id);
    
    if (notif.tipo === 'traslado' && onNavigateToTraslados) {
      setIsOpen(false);
      onNavigateToTraslados();
      toast.info(`Navegando a traslado ${notif.datos.codigo}`);
    } else if ((notif.tipo === 'vencimiento' || notif.tipo === 'stockBajo') && onNavigateToExistencias) {
      setIsOpen(false);
      onNavigateToExistencias();
      toast.info('Navegando a existencias');
    }
  };

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'traslado':
        return <Truck className="w-5 h-5" />;
      case 'vencimiento':
        return <Clock className="w-5 h-5" />;
      case 'stockBajo':
        return <Package className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors text-white"
      >
        <Bell size={20} />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full shadow-sm">
            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </DialogTitle>
              <DialogDescription className="sr-only">
                Lista de notificaciones del sistema
              </DialogDescription>
              {notificacionesNoLeidas > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={marcarTodasComoLeidas}
                  className="text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p>No hay notificaciones</p>
                <p className="text-sm mt-1">Todo está bajo control</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificacionClick(notif)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      notif.leida 
                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                        : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getColorPrioridad(notif.prioridad)}`}>
                        {getIcono(notif.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm mb-1 ${notif.leida ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notif.titulo}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${getColorPrioridad(notif.prioridad)}`}
                          >
                            {notif.prioridad.charAt(0).toUpperCase() + notif.prioridad.slice(1)}
                          </Badge>
                        </div>
                        <p className={`text-xs ${notif.leida ? 'text-gray-500' : 'text-gray-600'} mb-2`}>
                          {notif.descripcion}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notif.fecha).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      {!notif.leida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}