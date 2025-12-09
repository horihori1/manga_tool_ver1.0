export interface GeneratedImageResult {
  imageUrl: string | null;
  error?: string;
}

export interface DrawingCanvasRef {
  getCanvasDataUrl: () => string;
  clearCanvas: () => void;
  isEmpty: () => boolean;
}