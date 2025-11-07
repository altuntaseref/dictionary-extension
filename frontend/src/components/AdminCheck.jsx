import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function AdminCheck({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      // Try to access admin endpoint - if it works, user is admin
      await api.admin.getPlans();
      setIsAdmin(true);
    } catch (error) {
      // Not admin or error
      setIsAdmin(false);
      if (error.message.includes('Admin access required') || error.message.includes('forbidden')) {
        navigate('/words');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-umber">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return children;
}

