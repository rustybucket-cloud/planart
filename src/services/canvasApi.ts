import { invoke } from "@tauri-apps/api/core";
import type { CanvasData, CanvasSummary } from "@/types/canvas";

export const canvasApi = {
  create: (name: string) => invoke<CanvasData>("create_canvas", { name }),
  save: (canvas: CanvasData) => invoke<void>("save_canvas", { canvas }),
  load: (id: string) => invoke<CanvasData>("load_canvas", { id }),
  list: () => invoke<CanvasSummary[]>("list_canvases"),
  delete: (id: string) => invoke<void>("delete_canvas", { id }),
};
