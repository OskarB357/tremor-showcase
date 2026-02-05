import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

// Backend URL - defaults to localhost:8000, can be overridden with VITE_BACKEND_URL env var
const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:8000';

interface DrawingPoint {
  x: number;
  y: number;
  t: number;
}

interface SpiralParams {
  a: number;
  b: number;
}

interface QuestionnaireData {
  age: string;
  hasMovementDisorder: string;
  disorderType: string;
}

interface ScoreData {
  spiral_id: number;
  severity_score: number;
  classification: string;
  features: any;
  spiral_image_png_base64?: string;
}

interface ProcessingScreenProps {
  patientInfo: QuestionnaireData;
  spiralPoints: DrawingPoint[];
  spiralParams: SpiralParams;
  onComplete: (score: ScoreData) => void;
}

export default function ProcessingScreen({ patientInfo, spiralPoints, spiralParams, onComplete }: ProcessingScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const sendSpiralToBackend = async () => {
      if (!patientInfo || spiralPoints.length === 0 || !spiralParams) {
        setError('Missing patient data, spiral points, or spiral parameters');
        setIsProcessing(false);
        return;
      }

      try {
        // Build payload to match backend schema
        const mmPerUnit = 0.264583; // Default conversion for 96dpi (mm per pixel)
        
        const payload = {
          user_id: 1, // Default user - create user first in production
          device_name: 'Web Browser',
          dpi: 96.0, // Default DPI for web
          mm_per_unit: mmPerUnit,
          form_json: {
            age: parseInt(patientInfo.age) || 0,
            has_tremor: patientInfo.hasMovementDisorder === 'yes',
            on_medication: false, // Not collected in current questionnaire
            movement_disorder: patientInfo.disorderType || 'None',
            // Convert spiral parameters from pixels to millimeters
            a: spiralParams.a * mmPerUnit,
            b: spiralParams.b * mmPerUnit,
          },
          raw_json: {
            points: spiralPoints.map(p => ({ x: p.x, y: p.y, t_ms: p.t })),
          },
          normalized_json: {
            // Convert pixels to millimeters for normalized_json
            points: spiralPoints.map(p => ({ 
              x: p.x * mmPerUnit, 
              y: p.y * mmPerUnit, 
              t_ms: p.t 
            })),
          },
          png_path: '',
        };

        // 1. Create the spiral
        const createResponse = await fetch(`${BACKEND_URL}/spirals/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Backend error (create spiral): ${createResponse.status} - ${errorText}`);
        }

        const savedSpiralData = await createResponse.json();

        // 2. Score the newly created spiral
        const scoreResponse = await fetch(`${BACKEND_URL}/spirals/${savedSpiralData.id}/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!scoreResponse.ok) {
          const errorText = await scoreResponse.text();
          throw new Error(`Backend error (score spiral): ${scoreResponse.status} - ${errorText}`);
        }

        const scoredResult: ScoreData = await scoreResponse.json();
        console.log('Scoring result:', scoredResult);

        setIsProcessing(false);
        
        // Go to report screen after successful save and scoring
        setTimeout(() => {
          onComplete(scoredResult);
        }, 1000);
      } catch (err) {
        console.error('Error sending spiral to backend:', err);
        setError(err instanceof Error ? err.message : 'Failed to process spiral');
        setIsProcessing(false);
      }
    };

    sendSpiralToBackend();
  }, [patientInfo, spiralPoints, spiralParams, onComplete]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated decorative elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 right-20 w-96 h-96 bg-[#B8A1E8] rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        className="absolute bottom-20 left-20 w-80 h-80 bg-[#5BA3E8] rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.05, 0.1, 0.05],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#E8A1DE] rounded-full blur-3xl"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Animated Spiral Loader */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          className="mb-8"
        >
          <svg width="160" height="160" viewBox="0 0 180 180" fill="none">
            <defs>
              <linearGradient id="circle-loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9B7EDE" />
                <stop offset="50%" stopColor="#7B9DE8" />
                <stop offset="100%" stopColor="#5BA3E8" />
              </linearGradient>
              <filter id="soft-shadow-loading">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="url(#circle-loading-gradient)"
              filter="url(#soft-shadow-loading)"
            />
            <motion.path
              d="M 85 90 
                 C 85 85, 87 83, 90 83
                 C 93 83, 95 85, 95 88
                 C 95 93, 91 97, 85 97
                 C 78 97, 72 91, 72 83
                 C 72 74, 79 67, 88 67
                 C 99 67, 108 76, 108 88
                 C 108 102, 97 113, 83 113
                 C 67 113, 54 100, 54 83
                 C 54 64, 69 49, 88 49
                 C 109 49, 126 66, 126 88
                 C 126 112, 107 131, 83 131
                 C 57 131, 36 110, 36 83
                 C 36 54, 59 31, 88 31
                 C 119 31, 144 56, 144 88
                 C 144 122, 117 149, 83 149"
              stroke="white"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4 bg-gradient-to-r from-[#9B7EDE] to-[#4A90E2] bg-clip-text text-transparent text-center"
          style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          Processing Results
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#5A6A7A] text-center"
          style={{ fontSize: '1.125rem' }}
        >
          {error ? `Error: ${error}` : 'Analyzing your spiral drawing...'}
        </motion.p>

        {/* Animated dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-[#9B7EDE] to-[#5BA3E8]"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
