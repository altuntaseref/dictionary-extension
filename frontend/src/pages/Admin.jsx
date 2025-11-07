import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Admin() {
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, usersData] = await Promise.all([
        api.admin.getPlans(),
        api.admin.getUsers(),
      ]);
      setPlans(plansData.plans || []);
      setUsers(usersData.users || []);
    } catch (error) {
      alert('Failed to load admin data: ' + error.message);
      if (error.message.includes('Admin access required') || error.message.includes('forbidden')) {
        window.location.href = '/words';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      setSaving(true);
      await api.admin.updatePlan(planId, updates);
      setEditingPlan(null);
      loadData();
    } catch (error) {
      alert('Failed to update plan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPlan = async (userId, planId, expiresAt) => {
    try {
      setSaving(true);
      await api.admin.assignPlan(userId, planId, expiresAt);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      alert('Failed to assign plan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 text-umber">Loading admin panel...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-drab-dark-brown mb-8 tracking-[-0.033em]">
          Admin Panel
        </h1>

        <div className="flex gap-4 mb-6 border-b border-sage/30">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'plans'
                ? 'text-primary border-b-2 border-primary'
                : 'text-umber hover:text-drab-dark-brown'
            }`}
          >
            Plans Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-umber hover:text-drab-dark-brown'
            }`}
          >
            Users Management
          </button>
        </div>

        {activeTab === 'plans' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-drab-dark-brown mb-4">Plans</h2>
            {plans.map((plan) => (
              <div key={plan.id} className="card p-6">
                {editingPlan === plan.id ? (
                  <PlanEditForm
                    plan={plan}
                    onSave={(updates) => handleUpdatePlan(plan.id, updates)}
                    onCancel={() => setEditingPlan(null)}
                    saving={saving}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-drab-dark-brown">{plan.display_name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-umber">
                        <p>Price: {plan.price ? `$${plan.price} ${plan.currency || 'USD'}` : 'Free'}</p>
                        <p>Max Words: {plan.max_words}</p>
                        <p>Can Export: {plan.can_export ? 'Yes' : 'No'}</p>
                        <p>Can Use Groups: {plan.can_use_groups ? 'Yes' : 'No'}</p>
                        <p>Can Access Exercises: {plan.can_access_exercises ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingPlan(plan.id)}
                      className="btn-secondary"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-drab-dark-brown mb-4">Users</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan Since</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Words</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Examples</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(user.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            {user.plan.display_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(user.plan.plan_created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.word_count}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.example_count}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedUser(user.id)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Assign Plan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedUser && (
              <UserPlanAssignModal
                userId={selectedUser}
                currentPlan={users.find(u => u.id === selectedUser)?.plan}
                onSave={(planId, expiresAt) => {
                  handleAssignPlan(selectedUser, planId, expiresAt);
                }}
                onClose={() => setSelectedUser(null)}
                saving={saving}
                plans={plans}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PlanEditForm({ plan, onSave, onCancel, saving }) {
  const [displayName, setDisplayName] = useState(plan.display_name);
  const [maxWords, setMaxWords] = useState(plan.max_words);
  const [canExport, setCanExport] = useState(plan.can_export);
  const [canUseGroups, setCanUseGroups] = useState(plan.can_use_groups);
  const [canAccessExercises, setCanAccessExercises] = useState(plan.can_access_exercises);
  const [price, setPrice] = useState(plan.price || 0);
  const [currency, setCurrency] = useState(plan.currency || 'USD');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      display_name: displayName,
      max_words: parseInt(maxWords),
      can_export: canExport,
      can_use_groups: canUseGroups,
      can_access_exercises: canAccessExercises,
      price: parseFloat(price),
      currency: currency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-drab-dark-brown mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-drab-dark-brown mb-2">Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-drab-dark-brown mb-2">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="TRY">TRY</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-drab-dark-brown mb-2">Max Words</label>
        <input
          type="number"
          value={maxWords}
          onChange={(e) => setMaxWords(e.target.value)}
          className="input"
          min="0"
          required
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={canExport}
            onChange={(e) => setCanExport(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-drab-dark-brown">Can Export</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={canUseGroups}
            onChange={(e) => setCanUseGroups(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-drab-dark-brown">Can Use Groups</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={canAccessExercises}
            onChange={(e) => setCanAccessExercises(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-drab-dark-brown">Can Access Exercises</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

function UserPlanAssignModal({ userId, currentPlan, onSave, onClose, saving, plans }) {
  const [planId, setPlanId] = useState(currentPlan?.name === 'free' ? '' : currentPlan?.id || '');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!planId) {
      alert('Please select a plan');
      return;
    }
    onSave(planId, expiresAt || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-drab-dark-brown mb-4">Assign Plan</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-drab-dark-brown mb-2">Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.display_name} - ${plan.price} {plan.currency}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-drab-dark-brown mb-2">
                Expires At (optional, leave empty for lifetime)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Assign Plan'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
