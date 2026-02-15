import React, { useState } from 'react';
import { Shield, LayoutDashboard, Key, Users, ToggleLeft, ToggleRight, Lock, Unlock } from 'lucide-react';
import RoleManager from '../components/admin/RoleManager';
import UserManager from '../components/admin/UserManager';
import SystemConfig from '../components/admin/SystemConfig';

interface AdminViewProps {
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ isAdminMode, setIsAdminMode }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'roles' | 'users'>('home');

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-full border border-slate-600 shadow-inner">
                    <Shield size={32} className="text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">অ্যাডমিন প্যানেল</h1>
                    <p className="text-slate-400 text-sm mt-1">সিস্টেম কনফিগারেশন এবং ডাটাবেস ম্যানেজমেন্ট</p>
                </div>
            </div>

            {/* Global Admin Mode Toggle */}
            <div className="flex items-center gap-3 bg-slate-800/50 p-2 pr-4 rounded-full border border-slate-700">
                <div className={`p-2 rounded-full ${isAdminMode ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'}`}>
                    {isAdminMode ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div className="flex flex-col mr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">এডিট মোড</span>
                    <span className={`text-sm font-bold ${isAdminMode ? 'text-green-400' : 'text-slate-300'}`}>
                        {isAdminMode ? "চালু আছে" : "বন্ধ আছে"}
                    </span>
                </div>
                <button
                    onClick={() => setIsAdminMode(!isAdminMode)}
                    className={`p-1 rounded-full transition-colors ${isAdminMode ? 'text-green-400 hover:text-green-300' : 'text-slate-400 hover:text-white'}`}
                >
                    {isAdminMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Sidebar Navigation */}
            <div className="md:col-span-3 space-y-2">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left
                        ${activeTab === 'home' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}
                    `}
                >
                    <LayoutDashboard size={18} />
                    সিস্টেম কনফিগারেশন
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left
                        ${activeTab === 'roles' 
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}
                    `}
                >
                    <Key size={18} />
                    রুলস ও পারমিশন
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left
                        ${activeTab === 'users' 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}
                    `}
                >
                    <Users size={18} />
                    ইউজার ম্যানেজমেন্ট
                </button>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-9">
                {activeTab === 'home' && <SystemConfig isAdminMode={isAdminMode} />}
                {activeTab === 'roles' && <RoleManager />}
                {activeTab === 'users' && <UserManager />}
            </div>
        </div>
    </div>
  );
};

export default AdminView;