// src/services/bodegas.service.ts

import { Bodega, bodegasData } from "../../../data/bodegas";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Service "mock" (temporal).
 * Cuando conectes backend, SOLO cambias este archivo por fetch/axios.
 */

// Simulamos una "BD" en memoria
let bodegasDB: Bodega[] = [...bodegasData];

export async function getBodegas(): Promise<Bodega[]> {
  await delay(150);
  return [...bodegasDB];
}

export async function createBodega(payload: Omit<Bodega, "id">): Promise<Bodega> {
  await delay(150);
  const nextId = bodegasDB.length ? Math.max(...bodegasDB.map(b => b.id)) + 1 : 1;
  const newBodega: Bodega = { id: nextId, ...payload };
  bodegasDB = [newBodega, ...bodegasDB];
  return newBodega;
}

export async function updateBodega(id: number, payload: Omit<Bodega, "id">): Promise<Bodega> {
  await delay(150);
  const index = bodegasDB.findIndex(b => b.id === id);
  if (index === -1) throw new Error("Bodega no encontrada");

  const updated: Bodega = { id, ...payload };
  bodegasDB = bodegasDB.map(b => (b.id === id ? updated : b));
  return updated;
}

export async function deleteBodega(id: number): Promise<void> {
  await delay(150);
  bodegasDB = bodegasDB.filter(b => b.id !== id);
}

export async function toggleEstadoBodega(id: number): Promise<Bodega> {
  await delay(150);
  const bodega = bodegasDB.find(b => b.id === id);
  if (!bodega) throw new Error("Bodega no encontrada");

  const updated: Bodega = { ...bodega, estado: !bodega.estado };
  bodegasDB = bodegasDB.map(b => (b.id === id ? updated : b));
  return updated;
}
