import React, { useState, useEffect, useRef } from 'react';
import {
  processVisitWithMemory,
  retainTreatmentFeedback,
  initializePatientMemoryBank,
  checkHindsightConnection,
  getVisitQualityProgression,
  PatientMemory,
  AgentInsights,
} from '../../lib/hindsight';
import { MemoryGrowthTimeline } from '../../components/doctor/MemoryGrowthTimeline';

interface DoctorIntelligencePanelProps {
  patientId: string;
  patientMemory: PatientMemory;
  doctorId: string;
}

type FeedbackType = 'confirmed' | 'modified' | 'rejected';

interface FeedbackState {
  recIdx: number;
  type: FeedbackType;
}

export const DoctorIntelligencePanel: React.FC<DoctorIntelligencePanelProps> = ({
  patientId,
  patientMemory,
  doctorId,
}) => {
  const [visitNotes, setVisitNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AgentInsights | null>(null);
  const [lastFeedback, setLastFeedback] = useState<FeedbackState | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [hindsightStatus, setHindsightStatus] = useState<{
    connected: boolean;
    mode: string;
    message: string;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      await initializePatientMemoryBank(patientId, patientMemory.patientName);
      const status = await checkHindsightConnection();
      setHindsightStatus(status);
    }
    init();
  }, [patientId, patientMemory.patientName]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAnalyze = async () => {
    if (!visitNotes.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await processVisitWithMemory(
        patientId,
        visitNotes,
        patientMemory,
        doctorId
      );
      setAnalysis(result);
    } catch (err) {
      console.error('[IntelligencePanel] Analysis error:', err);
      showToast('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = async (
    recIdx: number,
    type: FeedbackType,
    recommendation: string
  ) => {
    setLastFeedback({ recIdx, type });
    await retainTreatmentFeedback(patientId, doctorId, {
      treatmentSuggested: recommendation,
      doctorFeedback: type,
      notes: `Doctor ${type} recommendation on ${new Date().toLocaleDateString('en-IN')}`,
    });
    const msgs: Record<FeedbackType, string> = {
      confirmed: 'Agent learned: recommendation confirmed.',
      modified: 'Agent learned: recommendation modified.',
      rejected: 'Agent learned: recommendation rejected.',
    };
    showToast(msgs[type]);
    setTimeout(() => setLastFeedback(null), 2500);
  };

  const visitHistory = getVisitQualityProgression(patientMemory.visitCount);

  return (
    <div className="space-y-5">
      {/* Connection Status */}
      {hindsightStatus && (
        <div className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
          Hindsight Memory: {hindsightStatus.message}
        </div>
      )}

      {/* Memory Status Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Memory-Powered Intelligence</h3>
            <p className="text-xs text-slate-400 mt-1">
              {patientMemory.visitCount === 0
                ? 'First visit — agent starts learning today'
                : `Agent has memory of ${patientMemory.visitCount} past visit(s) for ${patientMemory.patientName}.`}
            </p>
          </div>
          {patientMemory.visitCount > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold">{patientMemory.visitCount}</span>
              <span className="text-[11px] text-slate-400 block">Memories</span>
            </div>
          )}
        </div>

        {visitHistory.length > 0 && (
          <button
            onClick={() => setShowTimeline((v) => !v)}
            className="mt-3 text-xs text-indigo-300 font-medium hover:underline cursor-pointer"
          >
            {showTimeline ? 'Hide' : 'Show'} Intelligence Growth Timeline
          </button>
        )}
      </div>

      {showTimeline && visitHistory.length > 0 && (
        <MemoryGrowthTimeline visits={visitHistory} />
      )}

      {/* Visit Input Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Today's Visit Notes</h4>
        <textarea
          value={visitNotes}
          onChange={(e) => setVisitNotes(e.target.value)}
          placeholder="Describe today's symptoms, test results, or observations..."
          rows={4}
          className="w-full p-3 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
        />
        <button
          onClick={handleAnalyze}
          disabled={!visitNotes.trim() || isAnalyzing}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {isAnalyzing ? 'Analyzing with Memory...' : 'Analyze Visit with Memory'}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold text-blue-900">Analysis Summary</h4>
            <p className="text-xs text-blue-800 leading-relaxed">{analysis.insights}</p>
          </div>

          {analysis.learnedPatterns.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-purple-900">Learned Patterns</h4>
              <ul className="space-y-1 text-xs text-purple-800">
                {analysis.learnedPatterns.map((pat, idx) => (
                  <li key={idx}>- {pat}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.predictedRisks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-900">Predicted Risks</h4>
              <ul className="space-y-1 text-xs text-amber-800">
                {analysis.predictedRisks.map((risk, idx) => (
                  <li key={idx}>- {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-gray-900">Recommendations</h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 border border-gray-100 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-xs text-gray-800">{rec}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedback(idx, 'confirmed', rec)}
                        className="text-[11px] font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      >
                        Confirmed
                      </button>
                      <button
                        onClick={() => handleFeedback(idx, 'modified', rec)}
                        className="text-[11px] font-semibold px-2.5 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
                      >
                        Modified
                      </button>
                      <button
                        onClick={() => handleFeedback(idx, 'rejected', rec)}
                        className="text-[11px] font-semibold px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Rejected
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {toastMsg && (
        <div className="p-3 bg-gray-900 text-white text-xs font-medium rounded-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
