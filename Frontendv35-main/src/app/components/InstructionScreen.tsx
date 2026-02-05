import { motion } from 'motion/react';
import { PlayCircle } from 'lucide-react';
import FloatingShapes from '@/app/components/FloatingShapes';

interface InstructionScreenProps {
  onSkip: () => void;
  onContinue: () => void;
}

export default function InstructionScreen({ onSkip, onContinue }: InstructionScreenProps) {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#9B7EDE] opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#5BA3E8] opacity-10 rounded-full blur-3xl" />
      <motion.div
        className="absolute top-1/3 right-1/3 w-72 h-72 bg-[#E8A1DE] opacity-5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating decorative elements */}
      <FloatingShapes />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-10 border border-white/50">
          <h2 className="mb-6 text-center bg-gradient-to-r from-[#9B7EDE] to-[#4A90E2] bg-clip-text text-transparent" style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Instructions
          </h2>

          {/* Instructions */}
          <div className="mb-8 space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#9B7EDE] to-[#5BA3E8] flex items-center justify-center text-white mr-4" style={{ fontWeight: 600 }}>
                1
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 500, color: '#4A5A6A' }}>
                  Position Your Device
                </h3>
                <p className="text-[#5A6A7A]">
                  Place your iPad flat on a table or hold it steady in a comfortable position.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#9B7EDE] to-[#5BA3E8] flex items-center justify-center text-white mr-4" style={{ fontWeight: 600 }}>
                2
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 500, color: '#4A5A6A' }}>
                  Trace the Spiral
                </h3>
                <p className="text-[#5A6A7A]">
                  Using your finger or stylus, carefully trace over the spiral shown on the screen from the inside out.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#9B7EDE] to-[#5BA3E8] flex items-center justify-center text-white mr-4" style={{ fontWeight: 600 }}>
                3
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 500, color: '#4A5A6A' }}>
                  Draw Smoothly
                </h3>
                <p className="text-[#5A6A7A]">
                  Try to trace steadily and smoothly. Don't rush—take your time to follow the spiral carefully.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#9B7EDE] to-[#5BA3E8] flex items-center justify-center text-white mr-4" style={{ fontWeight: 600 }}>
                4
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 500, color: '#4A5A6A' }}>
                  Complete and Submit
                </h3>
                <p className="text-[#5A6A7A]">
                  When you've finished tracing, tap the "Done" button to submit your test.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Video Placeholder */}
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-[#E8F4FF] to-[#F3ECFF] p-8 flex flex-col items-center justify-center border-2 border-dashed border-[#B8A1E8] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#9B7EDE]/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#5BA3E8]/5 rounded-full blur-2xl" />
            <PlayCircle className="w-16 h-16 text-[#9B7EDE] mb-3 relative z-10" />
            <p className="text-[#5A6A7A] text-center relative z-10">
              Watch a quick demonstration video
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className="flex-1 px-8 py-4 bg-white border-2 border-[#E8F4FF] text-[#4A5A6A] rounded-full shadow hover:bg-[#F8FBFF] transition-colors"
              style={{ fontSize: '1.125rem', fontWeight: 500 }}
            >
              Skip
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-[#5BA3E8] to-[#4A90E2] text-white rounded-full shadow-lg"
              style={{ fontSize: '1.125rem', fontWeight: 500 }}
            >
              Continue
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
