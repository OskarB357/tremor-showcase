import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import FloatingShapes from '@/app/components/FloatingShapes';

interface DrawingPoint {
  x: number;
  y: number;
  t: number;
}

interface SpiralParams {
  a: number;
  b: number;
}

interface SpiralCanvasProps {
  onComplete: (points: DrawingPoint[], a: number, b: number) => void;
}

export default function SpiralCanvas({ onComplete }: SpiralCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<DrawingPoint[]>([]);
  const startTimeRef = useRef<number>(0);
  const spiralParamsRef = useRef<SpiralParams | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw the reference spiral and store a, b parameters
    const params = drawReferenceSpiral(ctx, rect.width, rect.height);
    spiralParamsRef.current = params;

    // Record start time
    startTimeRef.current = Date.now();
  }, []);

  const drawReferenceSpiral = (ctx: CanvasRenderingContext2D, width: number, height: number): SpiralParams => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;

    ctx.beginPath();
    ctx.strokeStyle = '#B8A1E8';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Calculate a and b for Archimedean spiral: r = a + b * θ
    const turns = 3;
    const totalAngle = turns * 2 * Math.PI;
    const a = 0; // Starts at center
    const b = maxRadius / totalAngle; // Expansion rate

    const steps = 500;
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * totalAngle;
      const radius = a + b * angle; // Archimedean formula
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    return { a, b };
  };

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      t: Date.now() - startTimeRef.current
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (coords) {
      setPoints([coords]);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Draw user's trace with smooth bezier curves
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length > 0) {
      ctx.beginPath();
      
      if (points.length < 2) {
        // For the first point, just draw a line
        const lastPoint = points[points.length - 1];
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
      } else {
        // Use quadratic curve for smoothness
        const lastPoint = points[points.length - 1];
        const secondLastPoint = points[points.length - 2];
        
        // Calculate control point
        const controlX = lastPoint.x;
        const controlY = lastPoint.y;
        
        ctx.moveTo(secondLastPoint.x, secondLastPoint.y);
        ctx.quadraticCurveTo(controlX, controlY, coords.x, coords.y);
      }
      
      ctx.stroke();
    }

    setPoints(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleDone = () => {
    if (points.length === 0) {
      alert('Please draw the spiral first');
      return;
    }
    if (spiralParamsRef.current) {
      onComplete(points, spiralParamsRef.current.a, spiralParamsRef.current.b);
    } else {
      alert('Spiral parameters could not be determined.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#9B7EDE] opacity-5 rounded-full blur-3xl" />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-[#5BA3E8] opacity-8 rounded-full blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating decorative elements */}
      <FloatingShapes />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-3xl"
      >
        <h2 className="mb-8 text-center bg-gradient-to-r from-[#9B7EDE] to-[#4A90E2] bg-clip-text text-transparent" style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Trace the Spiral
        </h2>

        {/* Canvas Container */}
        <div className="bg-white rounded-3xl shadow-xl p-4 mb-6 relative overflow-hidden">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#B8A1E8]/10 to-transparent rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#5BA3E8]/10 to-transparent rounded-br-3xl" />
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full aspect-square rounded-2xl cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Done Button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDone}
            disabled={points.length === 0}
            className="px-10 py-3 bg-gradient-to-r from-[#5BA3E8] to-[#4A90E2] text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ fontSize: '1.125rem', fontWeight: 500 }}
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
