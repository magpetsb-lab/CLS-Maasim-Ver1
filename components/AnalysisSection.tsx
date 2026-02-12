import React, { useState, useCallback } from 'react';
import { analyzeText } from '../services/geminiService';
import { AnalysisType } from '../types';
import Spinner from './Spinner';

interface AnalysisSectionProps {
  billText: string;
}

const AnalysisButton: React.FC<{
  type: AnalysisType;
  label: string;
  activeType: AnalysisType | null;
  onClick: (type: AnalysisType) => void;
  isLoading: boolean;
}> = ({ type, label, activeType, onClick, isLoading }) => (
  <button
    onClick={() => onClick(type)}
    disabled={isLoading}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto
      ${activeType === type
        ? 'bg-brand-primary text-white'
        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
      }
      disabled:bg-slate-300 disabled:cursor-not-allowed`}
  >
    {label}
  </button>
);

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ billText }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAnalysis = useCallback(async (type: AnalysisType) => {
    setActiveAnalysis(type);
    setIsLoading(true);
    setError('');
    setAnalysisResult('');
    
    try {
      const result = await analyzeText(billText, type);
      setAnalysisResult(result);
    } catch (err) {
      setError('Failed to analyze the text. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [billText]);

  return (
    <div>
      <h3 className="text-xl font-semibold text-brand-dark mb-4">AI-Powered Analysis</h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <AnalysisButton type={AnalysisType.Summary} label="Summarize" activeType={activeAnalysis} onClick={handleAnalysis} isLoading={isLoading} />
        <AnalysisButton type={AnalysisType.Explanation} label="Explain in Simple Terms" activeType={activeAnalysis} onClick={handleAnalysis} isLoading={isLoading} />
        <AnalysisButton type={AnalysisType.Impact} label="Analyze Impact" activeType={activeAnalysis} onClick={handleAnalysis} isLoading={isLoading} />
      </div>

      <div className="bg-brand-light p-4 rounded-md border border-blue-200 min-h-[24rem] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md">
            <Spinner />
          </div>
        )}
        {!isLoading && !analysisResult && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636-6.364l.707.707M17.663 17l.707.707M6.34 6.34l-.707-.707m12.02 10.322l.707-.707M12 21v-1m-6.364-1.636l.707-.707" />
                </svg>
                <p>Select an analysis type above to begin.</p>
            </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {analysisResult && (
          <div className="prose prose-slate max-w-none text-sm whitespace-pre-wrap">
            {analysisResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisSection;
