import { useState } from 'react';
import { motion } from 'motion/react';
import FloatingShapes from '@/app/components/FloatingShapes';

interface QuestionnaireData {
  age: string;
  hasMovementDisorder: string;
  disorderType: string;
}

interface QuestionnaireScreenProps {
  onConfirm: (data: QuestionnaireData) => void;
}

export default function QuestionnaireScreen({ onConfirm }: QuestionnaireScreenProps) {
  const [age, setAge] = useState('');
  const [hasMovementDisorder, setHasMovementDisorder] = useState('');
  const [disorderType, setDisorderType] = useState('');

  const handleSubmit = () => {
    if (age && hasMovementDisorder) {
      onConfirm({ age, hasMovementDisorder, disorderType });
    }
  };

  const isValid = age && hasMovementDisorder && (hasMovementDisorder === 'no' || disorderType);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-[#B8A1E8] opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#5BA3E8] opacity-10 rounded-full blur-3xl" />
      <motion.div
        className="absolute top-1/2 right-1/4 w-56 h-56 bg-[#E8A1DE] opacity-5 rounded-full blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating decorative elements */}
      <FloatingShapes />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
          <h2 className="mb-8 text-center bg-gradient-to-r from-[#9B7EDE] to-[#4A90E2] bg-clip-text text-transparent" style={{ fontSize: '2rem', fontWeight: 600 }}>
            Patient Information
          </h2>

          <div className="space-y-6">
            {/* Age Input */}
            <div>
              <label className="block mb-2 text-[#4A5A6A]">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8F4FF] focus:border-[#5BA3E8] focus:outline-none bg-white/50 transition-colors"
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>

            {/* Movement Disorder Question */}
            <div>
              <label className="block mb-3 text-[#4A5A6A]">
                Have you been diagnosed with a movement disorder?
              </label>
              <div className="space-y-2">
                {['yes', 'no'].map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-4 rounded-2xl border-2 border-[#E8F4FF] cursor-pointer hover:bg-[#F8FBFF] transition-colors"
                    style={{
                      backgroundColor: hasMovementDisorder === option ? '#E8F4FF' : 'transparent',
                      borderColor: hasMovementDisorder === option ? '#5BA3E8' : '#E8F4FF'
                    }}
                  >
                    <input
                      type="radio"
                      value={option}
                      checked={hasMovementDisorder === option}
                      onChange={(e) => {
                        setHasMovementDisorder(e.target.value);
                        if (e.target.value === 'no') setDisorderType('');
                      }}
                      className="mr-3 accent-[#5BA3E8]"
                    />
                    <span className="capitalize text-[#4A5A6A]">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Disorder Type (conditional) */}
            {hasMovementDisorder === 'yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="block mb-3 text-[#4A5A6A]">
                  What type of movement disorder?
                </label>
                <div className="space-y-2">
                  {[
                    'Parkinson\'s Disease',
                    'Essential Tremor',
                    'Dystonia',
                    'Other'
                  ].map((disorder) => (
                    <label
                      key={disorder}
                      className="flex items-center p-4 rounded-2xl border-2 border-[#E8F4FF] cursor-pointer hover:bg-[#F8FBFF] transition-colors"
                      style={{
                        backgroundColor: disorderType === disorder ? '#E8F4FF' : 'transparent',
                        borderColor: disorderType === disorder ? '#5BA3E8' : '#E8F4FF'
                      }}
                    >
                      <input
                        type="radio"
                        value={disorder}
                        checked={disorderType === disorder}
                        onChange={(e) => setDisorderType(e.target.value)}
                        className="mr-3 accent-[#5BA3E8]"
                      />
                      <span className="text-[#4A5A6A]">{disorder}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Confirm Button */}
          <motion.button
            whileHover={{ scale: isValid ? 1.02 : 1 }}
            whileTap={{ scale: isValid ? 0.98 : 1 }}
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-[#5BA3E8] to-[#4A90E2] text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ fontSize: '1.125rem', fontWeight: 500 }}
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
