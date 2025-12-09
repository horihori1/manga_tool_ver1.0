import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { DrawingCanvasRef } from '../types';
import { TrashIcon, PenIcon } from './Icons';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ width = 512, height = 512 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8;
        ctxRef.current = ctx;
        
        // Fill black background initially
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
      }
    }
  }, [width, height]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getCanvasDataUrl: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL('image/png');
      }
      return '';
    },
    clearCanvas: () => {
      if (canvasRef.current && ctxRef.current) {
        ctxRef.current.fillStyle = '#000000';
        ctxRef.current.fillRect(0, 0, width, height);
        setHasContent(false);
      }
    },
    isEmpty: () => !hasContent
  }));

  // Drawing Handlers
  const startDrawing = (x: number, y: number) => {
    if (!ctxRef.current) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing || !ctxRef.current) return;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!ctxRef.current) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  // Mouse Events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    // Scale coordinates if canvas display size differs from actual size
    const rect = canvasRef.current?.getBoundingClientRect();
    if(rect) {
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        startDrawing(offsetX * scaleX, offsetY * scaleY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const rect = canvasRef.current?.getBoundingClientRect();
    if(rect) {
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        draw(offsetX * scaleX, offsetY * scaleY);
    }
  };

  // Touch Events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (touch.clientX - rect.left) * (width / rect.width);
      const y = (touch.clientY - rect.top) * (height / rect.height);
      startDrawing(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (touch.clientX - rect.left) * (width / rect.width);
      const y = (touch.clientY - rect.top) * (height / rect.height);
      draw(x, y);
    }
  };

  return (
    <div className="relative group w-full aspect-square bg-slate-800 rounded-xl overflow-hidden shadow-inner border-2 border-slate-700">
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white pointer-events-none flex items-center gap-2 z-10">
        <PenIcon className="w-3 h-3" />
        Draw Pose Here
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
      />

      <button
        onClick={() => {
            if (canvasRef.current && ctxRef.current) {
                ctxRef.current.fillStyle = '#000000';
                ctxRef.current.fillRect(0, 0, width, height);
                setHasContent(false);
              }
        }}
        className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-opacity shadow-lg backdrop-blur-sm"
        title="Clear Canvas"
      >
        <TrashIcon className="w-5 h-5" />
      </button>

      {!hasContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
           <div className="text-center">
             <p className="text-slate-400 text-sm">Draw a stick figure...</p>
           </div>
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;