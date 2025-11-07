import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function PlanInfo({ plan }) {
  const [planInfo, setPlanInfo] = useState(plan || null);
  const [loading, setLoading] = useState(!plan);

  useEffect(() => {
    if (plan) {
      setPlanInfo(plan);
      setLoading(false);
      return;
    }
    loadPlanInfo();
  }, [plan]);

  const loadPlanInfo = async () => {
    try {
      const data = await api.getUserPlan();
      setPlanInfo(data.plan);
    } catch (error) {
      console.error('Failed to load plan info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !planInfo) {
    return null;
  }

  const usedWords = planInfo.word_count ?? 0;
  const totalWords = planInfo.max_words || 1;
  const usagePercent = (usedWords / totalWords) * 100;

  return (
    <div className="px-3 py-2 bg-sage/10 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-drab-dark-brown">{planInfo.display_name}</span>
        <span className="text-xs text-umber">
          {usedWords} / {totalWords} words
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
        <div
          className={`h-1.5 rounded-full transition-all ${
            usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-primary'
          }`}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>
      {planInfo.remaining_words === 0 && (
        <p className="text-xs text-red-600 mt-1">Plan limit reached. Upgrade to add more words.</p>
      )}
    </div>
  );
}
