import React, { useEffect, useRef, useState } from 'react';
import { VisitHistory } from '../../lib/hindsight';

interface MemoryGrowthTimelineProps {
  visits: VisitHistory[];
}

const qualityConfig = {
  generic: {
    width: '30%',
    label: 'Generic',
    sublabel: 'First visit — no memory',
    color: '#6b7280',
    gradient: 'linear-gradient(90deg, #4b5563, #6b7280)',
  },
  aware: {
    width: '60%',
    label: 'Aware',
    sublabel: 'Remembers past visits',
    color: '#3b82f6',
    gradient: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
  },
  personalized: {
    width: '80%',
    label: 'Personalized',
    sublabel: 'Knows your patterns',
    color: '#8b5cf6',
    gradient: 'linear-gradient(90deg, #6d28d9, #8b5cf6)',
  },
  expert: {
    width: '95%',
    label: 'Expert',
    sublabel: 'Predicts outcomes',
    color: '#10b981',
    gradient: 'linear-gradient(90deg, #065f46, #10b981)',
  },
};

export const MemoryGrowthTimeline: React.FC<MemoryGrowthTimelineProps> = ({ visits }) => {
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setAnimated(true);
      },
      { threshold: 0.2 }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4"
    >
      <div>
        <h3 className="text-sm font-semibold">How Agent Intelligence Grows with Memory</h3>
        <p className="text-xs text-slate-400">
          Showing learning progression across recorded visits
        </p>
      </div>

      <div className="space-y-3">
        {visits.map((visit, idx) => {
          const config = qualityConfig[visit.agentQuality];
          return (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-200">
                  Visit {visit.visitNumber} ({visit.date})
                </span>
                <span className="text-slate-400">{config.label}</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: animated ? config.width : '0%',
                    background: config.gradient,
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-400 italic">"{visit.example}"</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
