import React, { useState } from 'react';
import { Shield, Plus, Check, Trash2, Key, Users, Edit2, X, CheckSquare, Square, Save } from 'lucide-react';
import { useRoleManager } from '../../hooks/useRoleManager';
import { AVAILABLE_PERMISSIONS, Role } from '../../types/auth';

const RoleManager: React.FC = () => {
  const { roles, loading, createRole, updateRole, deleteRole } = useRoleManager();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const togglePermission = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  const toggleAllPermissions = () => {
    if (selectedPerms.length === AVAILABLE_PERMISSIONS.length) {
      setSelectedPerms([]);
    } else {
      setSelectedPerms(AVAILABLE_PERMISSIONS.map(p => p.id));
    }
  };

  const handleEdit = (role: Role) => {
    setRoleName(role.name);
    setRoleDesc(role.description);
    setSelectedPerms(role.permissions);
    setEditingRoleId(role.id || null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = () => {
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms([]);
    setEditingRoleId(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingRoleId(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    
    setSubmitLoading(true);
    try {
      if (editingRoleId) {
        await updateRole(editingRoleId, roleName, roleDesc, selectedPerms);
      } else {
        await createRole(roleName, roleDesc, selectedPerms);
      }
      handleCancel();
    } catch (err) {
      alert("অপারেশন সম্পন্ন হয়নি।");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gradient-to-r from-orange-50 to-white">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="text-orange-600" />
            রোল এবং পারমিশন
          </h2>
          <p className="text-sm text-gray-600 mt-1">সিস্টেমের এক্সেস রুলস এবং ইউজার রোল তৈরি করুন</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            নতুন রোল তৈরি করুন
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Create/Edit Form */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl border-2 border-orange-100 shadow-sm animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Shield size={20} className="text-orange-600" />
                    {editingRoleId ? 'রোল আপডেট করুন' : 'নতুন রোল কনফিগারেশন'}
                </h3>
                <button type="button" onClick={handleCancel} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">রোল নাম (Role Name)</label>
                <input 
                  type="text" 
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all focus:border-orange-500 text-gray-900 bg-white"
                  placeholder="যেমন: Editor, Moderator..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">বিবরণ (Description)</label>
                <input 
                  type="text" 
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all focus:border-orange-500 text-gray-900 bg-white"
                  placeholder="এই রোলের কাজ কি?"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-700 uppercase">পারমিশন সিলেক্ট করুন</label>
                <button 
                    type="button"
                    onClick={toggleAllPermissions}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-900 transition-colors bg-orange-100 px-3 py-1.5 rounded-lg"
                >
                    {selectedPerms.length === AVAILABLE_PERMISSIONS.length ? <CheckSquare size={14} /> : <Square size={14} />}
                    সবগুলো সিলেক্ট করুন
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const isSelected = selectedPerms.includes(perm.id);
                  return (
                    <div 
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`
                        cursor-pointer p-3 rounded-xl border flex items-start gap-3 transition-all duration-200 select-none
                        ${isSelected 
                            ? 'bg-orange-50 border-orange-400 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
                        `}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 border border-gray-300'}`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                        {/* Forced darker text colors for visibility */}
                        <div className={`text-sm font-bold ${isSelected ? 'text-orange-900' : 'text-slate-900'}`}>{perm.label}</div>
                        <div className={`text-xs mt-0.5 leading-tight ${isSelected ? 'text-orange-700' : 'text-slate-600'}`}>{perm.description}</div>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                বাতিল
              </button>
              <button 
                type="submit" 
                disabled={submitLoading}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
              >
                {submitLoading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                {editingRoleId ? 'আপডেট করুন' : 'সেভ করুন'}
              </button>
            </div>
          </form>
        )}

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : roles.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">কোনো রোল পাওয়া যায়নি</h3>
              <p className="text-gray-600">নতুন রোল তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            roles.map(role => (
              <div key={role.id} className="border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 bg-white group flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{role.name}</h4>
                      <p className="text-xs text-gray-600 font-medium">{role.description || 'কোনো বিবরণ নেই'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleEdit(role)}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="এডিট"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => role.id && deleteRole(role.id)}
                        className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="ডিলিট"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">পারমিশন ({role.permissions.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 4).map(permId => {
                      const label = AVAILABLE_PERMISSIONS.find(p => p.id === permId)?.label || permId;
                      return (
                        <span key={permId} className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200">
                          {label}
                        </span>
                      );
                    })}
                    {role.permissions.length > 4 && (
                      <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-md border border-orange-100">
                        +{role.permissions.length - 4} আরো
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManager;