import { Traslado } from "@/data/traslados";
import { Producto } from "@/data/productos";
import {
  NotificationItem,
  NotificationPriority,
} from "../types/notification.types";

interface GenerateNotificationsParams {
  traslados: Traslado[];
  productos: Producto[];
  selectedBodegaNombre: string;
}

function getPrioridadTraslado(diasTranscurridos: number): NotificationPriority {
  if (diasTranscurridos > 3) return "alta";
  if (diasTranscurridos > 1) return "media";
  return "baja";
}

function getPrioridadVencimiento(diasParaVencer: number): NotificationPriority {
  if (diasParaVencer <= 7) return "alta";
  if (diasParaVencer <= 15) return "media";
  return "baja";
}

function getPrioridadStock(stock: number): NotificationPriority {
  if (stock < 20) return "alta";
  return "media";
}

export function generateNotifications({
  traslados,
  productos,
  selectedBodegaNombre,
}: GenerateNotificationsParams): NotificationItem[] {
  const notifs: NotificationItem[] = [];
  const hoy = new Date();

  const trasladosFiltrados =
    selectedBodegaNombre === "Todas las bodegas"
      ? traslados
      : traslados.filter(
        (t) =>
          t.bodegaOrigen === selectedBodegaNombre ||
          t.bodegaDestino === selectedBodegaNombre
      );

  trasladosFiltrados
    .filter((t) => t.estado === "Enviado")
    .forEach((traslado) => {
      const diasTranscurridos = Math.floor(
        (hoy.getTime() - new Date(traslado.fecha).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      notifs.push({
        id: `traslado-${traslado.id}`,
        tipo: "traslado",
        titulo: `Traslado pendiente: ${traslado.codigo}`,
        descripcion: `De ${traslado.bodegaOrigen} a ${traslado.bodegaDestino} - ${traslado.items.length} productos - ${diasTranscurridos} día(s) en tránsito`,
        fecha: traslado.fecha,
        prioridad: getPrioridadTraslado(diasTranscurridos),
        leida: false,
        datos: traslado,
        action: {
          module: "traslados",
          entityId: traslado.id,
          action: "detalle",
        },
      });
    });

  productos.forEach((producto) => {
    producto.lotes.forEach((lote) => {
      if (
        selectedBodegaNombre !== "Todas las bodegas" &&
        lote.bodega !== selectedBodegaNombre
      ) {
        return;
      }

      const fechaVencimiento = new Date(lote.fechaVencimiento);
      const diasParaVencer = Math.floor(
        (fechaVencimiento.getTime() - hoy.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (diasParaVencer <= 30 && lote.cantidadDisponible > 0) {
        const estaVencido = diasParaVencer < 0;
        const diasTexto = estaVencido
          ? `Vencido hace ${Math.abs(diasParaVencer)} día(s)`
          : `Vence en ${diasParaVencer} día(s)`;

        notifs.push({
          id: `vencimiento-${lote.id}`,
          tipo: "vencimiento",
          titulo: estaVencido
            ? `Producto vencido: ${producto.nombre}`
            : `Producto próximo a vencer: ${producto.nombre}`,
          descripcion: `Lote ${lote.numeroLote} - ${lote.cantidadDisponible} unidades - ${diasTexto} - ${lote.bodega}`,
          fecha: lote.fechaVencimiento,
          prioridad: estaVencido ? "alta" : getPrioridadVencimiento(diasParaVencer),
          leida: false,
          datos: { producto, lote },
          action: {
            module: "existencias",
            entityId: producto.id,
            action: "detalle",
          },
        });
      }
    });
  });

  productos.forEach((producto) => {
    const stockPorBodega: Record<string, number> = {};

    producto.lotes.forEach((lote) => {
      stockPorBodega[lote.bodega] =
        (stockPorBodega[lote.bodega] ?? 0) + lote.cantidadDisponible;
    });

    Object.entries(stockPorBodega).forEach(([bodega, stock]) => {
      if (
        selectedBodegaNombre !== "Todas las bodegas" &&
        bodega !== selectedBodegaNombre
      ) {
        return;
      }

      if (stock > 0 && stock < 50) {
        notifs.push({
          id: `stock-${producto.id}-${bodega}`,
          tipo: "stockBajo",
          titulo: `Stock bajo: ${producto.nombre}`,
          descripcion: `Solo ${stock} unidades disponibles en ${bodega}`,
          fecha: hoy.toISOString(),
          prioridad: getPrioridadStock(stock),
          leida: false,
          datos: { producto, bodega, stock },
          action: {
            module: "existencias",
            entityId: producto.id,
            action: "detalle",
          },
        });
      }
    });
  });

  const prioridadPeso: Record<NotificationPriority, number> = {
    alta: 3,
    media: 2,
    baja: 1,
  };

  return notifs.sort((a, b) => {
    const pesoDiff = prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad];
    if (pesoDiff !== 0) return pesoDiff;
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });
}