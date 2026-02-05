import { motion } from 'motion/react';

export default function FloatingShapes() {
  return (
    <>
      {/* Floating organic shapes */}
      <motion.div
        className="absolute top-[15%] right-[10%] w-3 h-3 rounded-full bg-[#9B7EDE]/20"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-[60%] left-[8%] w-2 h-2 rounded-full bg-[#5BA3E8]/25"
        animate={{
          y: [0, 15, 0],
          x: [0, -8, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <motion.div
        className="absolute top-[35%] left-[15%] w-4 h-4 rounded-full bg-[#E8A1DE]/15"
        animate={{
          y: [0, 25, 0],
          x: [0, 15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <motion.div
        className="absolute bottom-[20%] right-[20%] w-2.5 h-2.5 rounded-full bg-[#7B9DE8]/20"
        animate={{
          y: [0, -18, 0],
          x: [0, -12, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Abstract curved shapes */}
      <motion.svg
        className="absolute top-[25%] right-[5%] opacity-10"
        width="60"
        height="60"
        viewBox="0 0 60 60"
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <path
          d="M 10 30 Q 20 10, 40 20 T 50 40"
          stroke="#B8A1E8"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>

      <motion.svg
        className="absolute bottom-[30%] left-[12%] opacity-10"
        width="50"
        height="50"
        viewBox="0 0 50 50"
        animate={{
          rotate: [360, 180, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <path
          d="M 5 25 Q 15 5, 35 15 T 45 35"
          stroke="#5BA3E8"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>
    </>
  );
}
