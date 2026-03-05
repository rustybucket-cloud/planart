export interface CanvasElement {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  rotation?: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  viewport: ViewportState;
  elements: CanvasElement[];
}

export interface CanvasSummary {
  id: string;
  name: string;
  updatedAt: string;
  elementCount: number;
}
