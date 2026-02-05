import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

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
    const calculateDemoScore = () => {
      if (!patientInfo || spiralPoints.length === 0 || !spiralParams) {
        setError('Missing patient data, spiral points, or spiral parameters');
        setIsProcessing(false);
        return;
      }

      // Simulate processing delay
      setTimeout(() => {
        try {
          // Calculate basic metrics from the spiral drawing
          const totalPoints = spiralPoints.length;
          const totalTime = spiralPoints.length > 0 ? spiralPoints[spiralPoints.length - 1].t : 0;
          
          // Calculate smoothness (variation in point-to-point distances)
          let variations = 0;
          let totalDistance = 0;
          for (let i = 1; i < spiralPoints.length; i++) {
            const dx = spiralPoints[i].x - spiralPoints[i - 1].x;
            const dy = spiralPoints[i].y - spiralPoints[i - 1].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            totalDistance += dist;
            
            if (i > 1) {
              const prevDx = spiralPoints[i - 1].x - spiralPoints[i - 2].x;
              const prevDy = spiralPoints[i - 1].y - spiralPoints[i - 2].y;
              const prevDist = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
              variations += Math.abs(dist - prevDist);
            }
          }
          
          const avgVariation = variations / Math.max(1, spiralPoints.length - 2);
          const avgDistance = totalDistance / Math.max(1, spiralPoints.length - 1);
          
          // Calculate deviation from ideal spiral (using spiralParams)
          let deviation = 0;
          for (let i = 0; i < Math.min(100, spiralPoints.length); i++) {
            const point = spiralPoints[i];
            const angle = Math.atan2(point.y - spiralParams.a, point.x - spiralParams.a);
            const idealRadius = spiralParams.a + spiralParams.b * angle;
            const actualRadius = Math.sqrt(
              Math.pow(point.x - spiralParams.a, 2) + 
              Math.pow(point.y - spiralParams.a, 2)
            );
            deviation += Math.abs(actualRadius - idealRadius);
          }
          deviation = deviation / Math.min(100, spiralPoints.length);
          
          // Calculate demo score based on smoothness and deviation
          // Lower variation and deviation = better score (closer to 0)
          // Higher variation and deviation = worse score (higher number)
          const smoothnessScore = Math.min(avgVariation / 10, 2.0); // Normalize to 0-2
          const deviationScore = Math.min(deviation / 50, 2.0); // Normalize to 0-2
          const baseScore = (smoothnessScore + deviationScore) / 2;
          
          // Adjust based on patient info
          let adjustedScore = baseScore;
          if (patientInfo.hasMovementDisorder === 'yes') {
            adjustedScore += 0.3; // Slightly higher score if they have a disorder
          }
          
          // Add some randomness for demo purposes (±0.2)
          const randomFactor = (Math.random() - 0.5) * 0.4;
          const finalScore = Math.max(0, Math.min(3, adjustedScore + randomFactor));
          
          const scoredResult: ScoreData = {
            spiral_id: Date.now(), // Use timestamp as ID
            severity_score: finalScore,
            classification: 'tremor_score_demo',
            features: {
              metrics: {
                'Total points': totalPoints,
                'Total time (ms)': totalTime,
                'Average variation': avgVariation.toFixed(2),
                'Average distance': avgDistance.toFixed(2),
                'Spiral deviation': deviation.toFixed(2),
              }
            }
          };
          
          console.log('Demo scoring result:', scoredResult);
          setIsProcessing(false);
          
          // Go to report screen
          setTimeout(() => {
            onComplete(scoredResult);
          }, 500);
        } catch (err) {
          console.error('Error calculating demo score:', err);
          setError(err instanceof Error ? err.message : 'Failed to process spiral');
          setIsProcessing(false);
        }
      }, 2000); // 2 second processing delay for demo
    };

    calculateDemoScore();
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
