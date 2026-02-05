import { motion } from 'motion/react';
import { CheckCircle2, TrendingUp, Activity, Clock } from 'lucide-react';
import FloatingShapes from '@/app/components/FloatingShapes';

interface DrawingPoint {
  x: number;
  y: number;
  t: number;
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

interface ReportScreenProps {
  drawingData: DrawingPoint[];
  questionnaireData: QuestionnaireData;
  scoreData: ScoreData;
  onReturnHome: () => void;
}

export default function ReportScreen({ drawingData, questionnaireData, scoreData, onReturnHome }: ReportScreenProps) {
  // Calculate some basic metrics
  const totalPoints = drawingData.length;
  const totalTime = drawingData.length > 0 ? drawingData[drawingData.length - 1].t : 0;
  const avgSpeed = totalPoints > 0 ? (totalPoints / (totalTime / 1000)).toFixed(2) : '0';

  // Get severity classification from score
  // Score interpretation: negative = more tremor-like, positive = less tremor-like
  // Updated thresholds: scores under 0.3 are Normal, then increase severity from there
  const getSeverityClassification = (score: number): string => {
    if (score < 0.3) return 'Normal';
    if (score < 1.0) return 'Mild';
    if (score < 2.0) return 'Moderate';
    return 'Severe';
  };

  const severity = getSeverityClassification(scoreData.severity_score);
  const backendMetrics = scoreData.features?.metrics || {};

  // Calculate smoothness (simplified - less variation = smoother)
  const calculateSmoothness = () => {
    if (drawingData.length < 3) return 'N/A';
    
    let variations = 0;
    for (let i = 2; i < drawingData.length; i++) {
      const dx1 = drawingData[i - 1].x - drawingData[i - 2].x;
      const dy1 = drawingData[i - 1].y - drawingData[i - 2].y;
      const dx2 = drawingData[i].x - drawingData[i - 1].x;
      const dy2 = drawingData[i].y - drawingData[i - 1].y;
      
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      if (dist1 > 0) {
        variations += Math.abs(dist2 - dist1);
      }
    }
    
    const avgVariation = variations / drawingData.length;
    if (avgVariation < 2) return 'Excellent';
    if (avgVariation < 5) return 'Good';
    if (avgVariation < 10) return 'Fair';
    return 'Variable';
  };

  const smoothness = calculateSmoothness();

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8A1E8] opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#5BA3E8] opacity-10 rounded-full blur-3xl" />
      <motion.div
        className="absolute top-1/3 left-1/3 w-72 h-72 bg-[#9B7EDE] opacity-5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating decorative elements */}
      <FloatingShapes />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-3xl"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-10 border border-white/50">
          <div className="flex items-center justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-16 h-16 text-[#5BA3E8] mr-4" />
            </motion.div>
            <h2 className="bg-gradient-to-r from-[#9B7EDE] to-[#4A90E2] bg-clip-text text-transparent" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
              Results
            </h2>
          </div>

          {/* Patient Info Summary */}
          <div className="mb-8 p-6 bg-gradient-to-br from-[#F8FBFF] to-[#FAF8FF] rounded-2xl border border-[#E8F4FF] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8A1E8]/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#5BA3E8]/5 rounded-full blur-2xl" />
            <h3 className="mb-3 text-[#4A5A6A] relative z-10" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-[#6B7A8A] text-sm mb-1">Age</p>
                <p className="text-[#3A4A5A]" style={{ fontWeight: 500 }}>{questionnaireData.age} years</p>
              </div>
              <div>
                <p className="text-[#6B7A8A] text-sm mb-1">Movement Disorder</p>
                <p className="text-[#3A4A5A] capitalize" style={{ fontWeight: 500 }}>
                  {questionnaireData.hasMovementDisorder === 'yes' ? questionnaireData.disorderType : 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <h3 className="mb-4 text-[#4A5A6A]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Test Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Severity Score Card - Highlighted */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-gradient-to-br from-[#5BA3E8] to-[#4A90E2] rounded-2xl shadow-lg border-2 border-white/20 relative overflow-hidden md:col-span-2"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Severity Assessment</p>
                    <p className="text-white relative z-10" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                      {severity}
                    </p>
                    <p className="text-white/80 text-sm mt-1">Score: {scoreData.severity_score.toFixed(2)} | Classification: {scoreData.classification}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Metric Card 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-white rounded-2xl shadow-md border border-[#E8F4FF] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#9B7EDE]/5 rounded-full blur-xl" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9B7EDE] to-[#B8A1E8] flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-[#6B7A8A] text-sm mb-1 relative z-10">Drawing Points</p>
                <p className="text-[#3A4A5A] relative z-10" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{totalPoints}</p>
                <p className="text-[#5A6A7A] text-sm mt-2 relative z-10">Total coordinates captured</p>
              </motion.div>

              {/* Metric Card 2 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-white rounded-2xl shadow-md border border-[#E8F4FF] relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#5BA3E8]/5 rounded-full blur-xl" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5BA3E8] to-[#4A90E2] flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-[#6B7A8A] text-sm mb-1 relative z-10">Total Time</p>
                <p className="text-[#3A4A5A] relative z-10" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{(totalTime / 1000).toFixed(1)}s</p>
                <p className="text-[#5A6A7A] text-sm mt-2 relative z-10">Time to complete drawing</p>
              </motion.div>

              {/* Metric Card 3 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 bg-white rounded-2xl shadow-md border border-[#E8F4FF] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8A1DE]/5 rounded-full blur-xl" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9B7EDE] to-[#5BA3E8] flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-[#6B7A8A] text-sm mb-1 relative z-10">Average Speed</p>
                <p className="text-[#3A4A5A] relative z-10" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{avgSpeed}</p>
                <p className="text-[#5A6A7A] text-sm mt-2 relative z-10">Points per second</p>
              </motion.div>

              {/* Metric Card 4 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 bg-white rounded-2xl shadow-md border border-[#E8F4FF] relative overflow-hidden"
              >
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-[#5BA3E8]/5 rounded-full blur-xl" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5BA3E8] to-[#4A90E2] flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-[#6B7A8A] text-sm mb-1 relative z-10">Smoothness</p>
                <p className="text-[#3A4A5A] relative z-10" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{smoothness}</p>
                <p className="text-[#5A6A7A] text-sm mt-2 relative z-10">Drawing consistency</p>
              </motion.div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-8 p-6 bg-gradient-to-br from-[#E8F4FF] to-[#F3ECFF] rounded-2xl border border-[#B8A1E8]/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-28 h-28 bg-[#9B7EDE]/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#5BA3E8]/5 rounded-full blur-2xl" />
            <p className="text-[#4A5A6A] text-sm relative z-10">
              <span style={{ fontWeight: 600 }}>Note:</span> This is a preliminary analysis. Results should be reviewed by a qualified healthcare professional for accurate interpretation and diagnosis.
            </p>
          </div>

          {/* Return Home Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnHome}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#5BA3E8] to-[#4A90E2] text-white rounded-full shadow-lg"
            style={{ fontSize: '1.125rem', fontWeight: 500 }}
          >
            Return Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
