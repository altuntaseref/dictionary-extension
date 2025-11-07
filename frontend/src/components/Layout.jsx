import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlanInfo from './PlanInfo';
import { api } from '../lib/api';

const navigation = [
  { name: 'Word Library', href: '/words', icon: 'book' },
  { name: 'Exercises', href: '/exercises', icon: 'exercise' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);

  useEffect(() => {
    checkAdmin();
    loadPlanInfo();
  }, []);

  const checkAdmin = async () => {
    try {
      await api.admin.getPlans();
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadPlanInfo = async () => {
    try {
      const data = await api.getUserPlan();
      setPlanInfo(data.plan);
    } catch {
      // Ignore
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const canAccessExercises = planInfo?.can_access_exercises || false;
  const showUpgradeButton = planInfo && planInfo.name !== 'pro_plus';

  return (
    <div className="flex min-h-screen bg-background-light">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-sage/30 flex flex-col p-4 shrink-0">
        <div className="flex flex-col gap-4 flex-grow">
          <a href="/words" className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              W
            </div>
            <div className="flex flex-col">
              <h1 className="text-drab-dark-brown text-base font-medium leading-normal">WordBook</h1>
              <p className="text-umber text-sm font-normal leading-normal">My Dictionary</p>
            </div>
          </a>

          <nav className="flex flex-col gap-2">
            <Link
              to="/words"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                location.pathname === '/words'
                  ? 'bg-primary/20 text-drab-dark-brown'
                  : 'hover:bg-gray-100 text-umber hover:text-drab-dark-brown'
              }`}
            >
              <span className="material-symbols-outlined text-base">book</span>
              <p className="text-sm font-medium leading-normal">Word Library</p>
            </Link>
            {canAccessExercises && (
              <Link
                to="/exercises"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  location.pathname === '/exercises'
                    ? 'bg-primary/20 text-drab-dark-brown'
                    : 'hover:bg-gray-100 text-umber hover:text-drab-dark-brown'
                }`}
              >
                <span className="material-symbols-outlined text-base">exercise</span>
                <p className="text-sm font-medium leading-normal">Exercises</p>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  location.pathname === '/admin'
                    ? 'bg-primary/20 text-drab-dark-brown'
                    : 'hover:bg-gray-100 text-umber hover:text-drab-dark-brown'
                }`}
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <p className="text-sm font-medium leading-normal">Admin</p>
              </Link>
            )}
          </nav>
          <PlanInfo plan={planInfo} />
        </div>

        <div className="mt-auto pt-4 border-t border-sage/30">
          <div className="flex items-center justify-between">
            <Link to="/settings" className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center text-sm font-semibold text-white rounded-full size-9 bg-umber">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-drab-dark-brown truncate max-w-[120px]">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-umber">logout</span>
            </button>
          </div>
          {showUpgradeButton && (
            <button
              onClick={() => navigate('/upgrade')}
              className="mt-4 w-full h-10 rounded-lg bg-amber-300 text-umber font-semibold text-sm tracking-wide hover:bg-amber-400 transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
