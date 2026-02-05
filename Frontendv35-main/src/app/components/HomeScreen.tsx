import { motion } from 'motion/react';
import FloatingShapes from '@/app/components/FloatingShapes';

interface HomeScreenProps {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Organic decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8A1E8] opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#5BA3E8] opacity-10 rounded-full blur-3xl" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#9B7EDE] opacity-5 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating decorative elements */}
      <FloatingShapes />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center max-w-md text-center"
      >
        {/* Logo/Icon - Gradient Circle with White Spiral */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 12 }}
          className="mb-3"
        >
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
            <defs>
              <linearGradient id="circle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9B7EDE" />
                <stop offset="50%" stopColor="#7B9DE8" />
                <stop offset="100%" stopColor="#5BA3E8" />
              </linearGradient>
              <filter id="soft-shadow">
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
            {/* Gradient Circle Background */}
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="url(#circle-gradient)"
              filter="url(#soft-shadow)"
            />
            {/* White Archimedean Spiral - shifted left for better centering */}
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
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.4, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-2 bg-gradient-to-r from-[#9B7EDE] to-[#4A90E2] bg-clip-text text-transparent"
          style={{ fontSize: '2.8rem', fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          SimplySpiral
        </motion.h1>

        {/* Subtitle - Pediatric Tremor Assessment */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-3 text-[#6B7A8A]"
          style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Pediatric Tremor Assessment
        </motion.p>

        {/* Welcome Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12 text-[#5A6A7A]"
          style={{ fontSize: '1.125rem' }}
        >
          Welcome! Tap below to begin your test.
        </motion.p>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(91, 163, 232, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="px-12 py-4 bg-gradient-to-r from-[#5BA3E8] to-[#4A90E2] text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          style={{ fontSize: '1.125rem', fontWeight: 500 }}
        >
          Start Test
        </motion.button>
      </motion.div>
    </div>
  );
}
