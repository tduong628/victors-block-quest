import { z } from "zod";

export const lessonItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["letter", "number"]),
  symbolUpper: z.string().min(1),
  symbolLower: z.string().min(1).optional(),
  audioEn: z.string().startsWith("/audio/"),
  audioVi: z.string().startsWith("/audio/"),
  viLabel: z.string().min(1),
  distractorPoolIds: z.array(z.string()).min(1),
});

export const lessonPackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  items: z.array(lessonItemSchema).min(1),
});
