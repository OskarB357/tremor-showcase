import { useState } from 'react';
import HomeScreen from '@/app/components/HomeScreen';
import QuestionnaireScreen from '@/app/components/QuestionnaireScreen';
import InstructionScreen from '@/app/components/InstructionScreen';
import SpiralCanvas from '@/app/components/SpiralCanvas';
import ProcessingScreen from '@/app/components/ProcessingScreen';
import ReportScreen from '@/app/components/ReportScreen';

type Screen = 'home' | 'questionnaire' | 'instruction' | 'canvas' | 'processing' | 'report';

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

interface SpiralParams {
  a: number;
  b: number;
}

interface ScoreData {
  spiral_id: number;
  severity_score: number;
  classification: string;
  features: any;
  spiral_image_png_base64?: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>({
    age: '',
    hasMovementDisorder: '',
    disorderType: ''
  });
  const [drawingData, setDrawingData] = useState<DrawingPoint[]>([]);
  const [spiralParams, setSpiralParams] = useState<SpiralParams | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  const handleStart = () => {
    setCurrentScreen('questionnaire');
  };

  const handleQuestionnaireConfirm = (data: QuestionnaireData) => {
    setQuestionnaireData(data);
    setCurrentScreen('instruction');
  };

  const handleInstructionSkip = () => {
    setCurrentScreen('canvas');
  };

  const handleInstructionContinue = () => {
    setCurrentScreen('canvas');
  };

  const handleCanvasComplete = (points: DrawingPoint[], a: number, b: number) => {
    setDrawingData(points);
    setSpiralParams({ a, b });
    setCurrentScreen('processing');
  };

  const handleProcessingComplete = (score: ScoreData) => {
    setScoreData(score);
    setCurrentScreen('report');
  };

  const handleReturnHome = () => {
    // Reset all data
    setQuestionnaireData({
      age: '',
      hasMovementDisorder: '',
      disorderType: ''
    });
    setDrawingData([]);
    setSpiralParams(null);
    setScoreData(null);
    setCurrentScreen('home');
  };

  return (
    <div className="size-full">
      {currentScreen === 'home' && <HomeScreen onStart={handleStart} />}
      {currentScreen === 'questionnaire' && (
        <QuestionnaireScreen onConfirm={handleQuestionnaireConfirm} />
      )}
      {currentScreen === 'instruction' && (
        <InstructionScreen 
          onSkip={handleInstructionSkip}
          onContinue={handleInstructionContinue}
        />
      )}
      {currentScreen === 'canvas' && (
        <SpiralCanvas onComplete={handleCanvasComplete} />
      )}
      {currentScreen === 'processing' && drawingData.length > 0 && spiralParams && (
        <ProcessingScreen 
          patientInfo={questionnaireData}
          spiralPoints={drawingData}
          spiralParams={spiralParams}
          onComplete={handleProcessingComplete} 
        />
      )}
      {currentScreen === 'report' && drawingData.length > 0 && scoreData && (
        <ReportScreen
          drawingData={drawingData}
          questionnaireData={questionnaireData}
          scoreData={scoreData}
          onReturnHome={handleReturnHome}
        />
      )}
    </div>
  );
}
