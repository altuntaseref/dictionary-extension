import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function GroupManagementModal({ isOpen, onClose, onUpdate }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getGroups();
      setGroups(data.groups || []);
    } catch (error) {
      alert('Failed to load groups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    try {
      await api.createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowCreateForm(false);
      loadGroups();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to create group: ' + error.message);
    }
  };

  const handleUpdateGroup = async (groupId, newName) => {
    if (!newName.trim()) return;
    
    try {
      await api.updateGroup(groupId, newName.trim());
      setEditingGroup(null);
      loadGroups();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to update group: ' + error.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? Words in this group will be moved to "Ungrouped".')) {
      return;
    }
    
    try {
      await api.deleteGroup(groupId);
      loadGroups();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to delete group: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-drab-dark-brown">Manage Groups</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {showCreateForm ? (
            <form onSubmit={handleCreateGroup} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="input mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewGroupName('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-6 btn-primary"
            >
              <span className="material-symbols-outlined mr-2">add</span>
              Create New Group
            </button>
          )}

          {loading ? (
            <div className="text-center py-8 text-umber">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-umber">No groups yet. Create your first group!</div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border border-sage/30 rounded-lg hover:bg-gray-50"
                >
                  {editingGroup === group.id ? (
                    <input
                      type="text"
                      defaultValue={group.name}
                      onBlur={(e) => {
                        if (e.target.value !== group.name) {
                          handleUpdateGroup(group.id, e.target.value);
                        } else {
                          setEditingGroup(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        } else if (e.key === 'Escape') {
                          setEditingGroup(null);
                        }
                      }}
                      className="input flex-1 mr-2"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="font-medium text-drab-dark-brown">{group.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingGroup(group.id)}
                          className="p-2 rounded-full hover:bg-gray-200 text-umber"
                          title="Edit group name"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-2 rounded-full hover:bg-red-50 text-red-600"
                          title="Delete group"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

