import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Exercises() {
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const data = await api.getUserPlan();
      if (!data.plan.can_access_exercises) {
        alert('Exercises feature is not available in your current plan. Please upgrade to Pro+ plan.');
        navigate('/words');
        return;
      }
      setPlanInfo(data.plan);
    } catch (error) {
      console.error('Failed to check plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16 text-umber">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-drab-dark-brown mb-2 tracking-[-0.033em]">
            Exercises
          </h1>
          <p className="text-base text-umber">Practice your vocabulary with interactive exercises</p>
        </div>

        <div className="bg-white rounded-lg border border-sage/30 p-16 text-center">
          <p className="text-umber mb-4">Exercises feature coming soon!</p>
        </div>
      </div>
    </Layout>
  );
}
