import { db } from "./db";
import type { ArtworkRecord } from "../types/lesson";

export async function saveArtwork(itemId: string, dataUrl: string, nowMs: number = Date.now()): Promise<ArtworkRecord> {
  const id = await db.artwork.add({ itemId, dataUrl, createdMs: nowMs });
  return { id, itemId, dataUrl, createdMs: nowMs };
}

export async function getArtworkForItem(itemId: string): Promise<ArtworkRecord[]> {
  return db.artwork.where("itemId").equals(itemId).toArray();
}
