import React, { useState } from 'react';
import { UserPlus, Trash2, Mail, Phone, Shield, User, Edit2, X, Crown, Zap, Save, Lock } from 'lucide-react';
import { useUserManager } from '../../hooks/useUserManager';
import { useRoleManager } from '../../hooks/useRoleManager';
import { AppUser, AVAILABLE_PERMISSIONS } from '../../types/auth';

const SYSTEM_ADMIN_EMAIL = 'admin@system.com';

const UserManager: React.FC = () => {
  const { users, loading, createUser, updateUser, deleteUser } = useUserManager();
  const { roles, createRole } = useRoleManager(); 
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Check if System Admin exists
  const hasSystemAdmin = users.some(u => u.email === SYSTEM_ADMIN_EMAIL);

  const handleEdit = (user: AppUser) => {
    setDisplayName(user.displayName);
    setEmail(user.email);
    setPassword(''); // Reset password field for security (don't show existing)
    setPhone(user.phone || '');
    setSelectedRole(user.roleId);
    setEditingUserId(user.id || null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = () => {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setSelectedRole('');
    setEditingUserId(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingUserId(null);
    setDisplayName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setSelectedRole('');
  };

  const handleCreateSystemAdmin = async () => {
    setSubmitLoading(true);
    try {
        let targetRoleId = '';
        
        // 1. Try to find existing admin role
        const existingAdminRole = roles.find(r => r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('manager'));
        
        if (existingAdminRole) {
            targetRoleId = existingAdminRole.id || '';
        } else {
            // 2. If no admin role, create one automatically
            const allPermIds = AVAILABLE_PERMISSIONS.map(p => p.id);
            const newRoleId = await createRole("Administrator", "System Auto-generated Admin Role", allPermIds);
            
            if (newRoleId && typeof newRoleId === 'string') {
                targetRoleId = newRoleId;
            } else {
                throw new Error("স্বয়ংক্রিয়ভাবে রোল তৈরি করা সম্ভব হয়নি।");
            }
        }

        if (!targetRoleId) {
            throw new Error("রোল আইডি পাওয়া যায়নি।");
        }

        await createUser({
            displayName: "System Administrator",
            email: SYSTEM_ADMIN_EMAIL,
            password: "admin123", // Default password for auto-generated admin
            phone: "01700000000",
            roleId: targetRoleId
        });
        
        alert("সিস্টেম এডমিন সফলভাবে তৈরি হয়েছে! পাসওয়ার্ড: admin123");
    } catch (e: any) {
        console.error(e);
        alert("ব্যর্থ হয়েছে: " + (e.message || "Unknown error"));
    } finally {
        setSubmitLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !selectedRole) return;
    
    // Validate password for new users
    if (!editingUserId && !password) {
        alert("নতুন ইউজারের জন্য পাসওয়ার্ড আবশ্যক।");
        return;
    }
    
    setSubmitLoading(true);
    try {
      if (editingUserId) {
        // Only update password if provided
        const updateData: Partial<AppUser> = {
            displayName,
            email,
            phone,
            roleId: selectedRole
        };
        if (password) {
            updateData.password = password;
        }
        await updateUser(editingUserId, updateData);
      } else {
        await createUser({
            displayName,
            email,
            password,
            phone,
            roleId: selectedRole
        });
      }
      handleCancel();
    } catch (err) {
      alert("অপারেশন সম্পন্ন হয়নি।");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRoleName = (id: string) => {
    const role = roles.find(r => r.id === id);
    return role ? role.name : 'Unknown Role';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="text-indigo-600" />
            ইউজার ম্যানেজমেন্ট
          </h2>
          <p className="text-sm text-gray-500 mt-1">সিস্টেম ইউজার তৈরি করুন এবং রোল এসাইন করুন</p>
        </div>
        
        <div className="flex gap-3">
            {!hasSystemAdmin && !isFormOpen && (
                <button 
                    onClick={handleCreateSystemAdmin}
                    disabled={submitLoading}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                >
                    {submitLoading ? <span className="animate-spin">⌛</span> : <Zap size={16} />}
                    সিস্টেম এডমিন তৈরি
                </button>
            )}
            
            {!isFormOpen && (
            <button 
                onClick={handleCreate}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
                <UserPlus size={18} />
                নতুন ইউজার
            </button>
            )}
        </div>
      </div>

      <div className="p-6">
        {/* Create/Edit Form */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl border-2 border-indigo-100 shadow-sm animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <User size={20} className="text-indigo-600" />
                {editingUserId ? 'ইউজার তথ্য এডিট করুন' : 'নতুন ইউজার তথ্য'}
                </h3>
                <button type="button" onClick={handleCancel} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">নাম (Display Name)</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="পুরো নাম লিখুন"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">ইমেইল</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="user@example.com"
                  required
                  disabled={email === SYSTEM_ADMIN_EMAIL && !!editingUserId} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">ফোন নম্বর (ঐচ্ছিক)</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">রোল (Role)</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all text-gray-900"
                  required
                >
                  <option value="">রোল নির্বাচন করুন</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    পাসওয়ার্ড {editingUserId && <span className="text-gray-400 font-normal">(পরিবর্তন করতে চাইলে লিখুন)</span>}
                </label>
                <div className="relative">
                    <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all pl-10 text-gray-900"
                    placeholder="পাসওয়ার্ড দিন"
                    required={!editingUserId} // Required only for new users
                    />
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                বাতিল
              </button>
              <button 
                type="submit" 
                disabled={submitLoading}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
              >
                {submitLoading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                {editingUserId ? 'আপডেট করুন' : 'সেভ করুন'}
              </button>
            </div>
          </form>
        )}

        {/* Users List Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">নাম</th>
                <th className="px-6 py-4 font-bold tracking-wider">যোগাযোগ</th>
                <th className="px-6 py-4 font-bold tracking-wider">রোল</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center gap-2 text-gray-400">
                          <span className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></span>
                          লোড হচ্ছে...
                      </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">কোনো ইউজার পাওয়া যায়নি</td>
                </tr>
              ) : (
                users.map(user => {
                  const isSystemAdmin = user.email === SYSTEM_ADMIN_EMAIL;
                  
                  return (
                    <tr key={user.id} className={`transition-colors hover:bg-gray-50 ${isSystemAdmin ? 'bg-purple-50/50 hover:bg-purple-50' : ''}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isSystemAdmin ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'}`}>
                                {isSystemAdmin ? <Crown size={16} /> : user.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold">{user.displayName}</div>
                                {isSystemAdmin && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 mt-0.5">
                                        <Zap size={10} fill="currentColor" /> System Admin
                                    </span>
                                )}
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <div className="p-1 rounded bg-gray-100 text-gray-500">
                                    <Mail size={12} />
                                </div>
                                {user.email}
                            </div>
                            {user.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="p-1 rounded bg-gray-100 text-gray-500">
                                    <Phone size={12} />
                                </div>
                                {user.phone}
                            </div>
                            )}
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${isSystemAdmin ? 'bg-white text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            <Shield size={12} />
                            {getRoleName(user.roleId)}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEdit(user)}
                                className={`p-2 rounded-lg transition-colors border ${isSystemAdmin ? 'border-purple-200 text-purple-600 hover:bg-purple-100 bg-white' : 'border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 bg-white'}`}
                                title="এডিট করুন"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => user.id && deleteUser(user.id)}
                                className={`p-2 rounded-lg transition-colors border ${isSystemAdmin ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 bg-white'}`}
                                title={isSystemAdmin ? "সিস্টেম এডমিন মুছা যাবে না" : "মুছে ফেলুন"}
                                disabled={isSystemAdmin}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;