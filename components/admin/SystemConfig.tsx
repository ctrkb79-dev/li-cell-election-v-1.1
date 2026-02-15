import React, { useState } from 'react';
import { Database, Trash2, AlertTriangle, RefreshCw, Server, CheckCircle, X } from 'lucide-react';
import { writeBatch, doc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { LOCATION_DATA, SEAT_DATA, SEAT_AREAS, PARTY_SYMBOLS } from '../../constants';
import { CANDIDATES } from '../../candidates';
import { PartyResult } from '../../types';

interface SystemConfigProps {
  isAdminMode: boolean;
}

const SystemConfig: React.FC<SystemConfigProps> = ({ isAdminMode }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Initialize Database Logic
  const handleInitializeDatabase = async () => {
    if (!isAdminMode) return;
    if (!window.confirm("সতর্কতা: এটি ৩০০টি আসনের ডিফল্ট স্ট্যাটিক ডাটা (প্রার্থী, এলাকা, মক ভোটার সংখ্যা) ডাটাবেসে আপলোড করবে। আপনি কি নিশ্চিত?")) return;
    
    setLoading(true);
    setStatus({ type: 'info', message: 'ডাটাবেস ইনিশিয়ালাইজেশন শুরু হচ্ছে...' });

    try {
        const batch = writeBatch(db);
        let operationCount = 0;
        const distToDiv: Record<string, string> = {};
        
        // Create District to Division Map
        Object.keys(LOCATION_DATA).forEach(div => {
            Object.keys(LOCATION_DATA[div]).forEach(dist => {
                distToDiv[dist] = div;
            });
        });

        // Loop through all seats
        for (const dist of Object.keys(SEAT_DATA)) {
            for (const seatNo of SEAT_DATA[dist]) {
                const seatRef = doc(db, "seats", seatNo);
                
                const defaultCandidates = CANDIDATES[seatNo] || {};
                const results: PartyResult[] = Object.entries(defaultCandidates).map(([party, name]) => ({
                    party, 
                    candidate: name, 
                    votes: 0, 
                    symbol: PARTY_SYMBOLS[party] || '', 
                    isDeclaredWinner: false
                }));
                
                let hash = 0;
                for(let i=0; i<seatNo.length; i++) hash = seatNo.charCodeAt(i) + ((hash << 5) - hash);
                
                batch.set(seatRef, {
                    seatNo, 
                    district: dist, 
                    division: distToDiv[dist] || '',
                    upazilas: SEAT_AREAS[seatNo] || [],
                    totalVoters: 300000 + (Math.abs(hash) % 250000),
                    totalCenters: 100 + (Math.abs(hash) % 150),
                    results, 
                    totalVotes: 0, 
                    isSuspended: false,
                    updatedAt: serverTimestamp() 
                }, { merge: true });
                
                operationCount++;
            }
        }
        
        await batch.commit();
        setStatus({ type: 'success', message: `সফলভাবে ${operationCount} টি আসনের ডাটা ডাটাবেসে সিনক্রোনাইজ করা হয়েছে।` });
    } catch (e: any) {
        console.error("Error initializing DB:", e);
        setStatus({ type: 'error', message: "সমস্যা হয়েছে: " + e.message });
    } finally {
        setLoading(false);
    }
  };

  // Execute Delete Logic
  const executeDeleteAll = async () => {
    if (!isAdminMode) return;
    setShowDeleteModal(false); 
    setLoading(true);
    setStatus({ type: 'info', message: 'ফলাফল মুছে ফেলা হচ্ছে...' });

    try {
      const querySnapshot = await getDocs(collection(db, "seats"));
      const batch = writeBatch(db);
      
      let count = 0;
      querySnapshot.forEach((doc) => {
         batch.update(doc.ref, {
           results: [],
           totalVotes: 0,
           isSuspended: false,
           updatedAt: serverTimestamp()
         });
         count++;
      });

      await batch.commit();
      setStatus({ type: 'success', message: `সফলভাবে ${count} টি আসনের ফলাফল রিসেট করা হয়েছে।` });

    } catch (error) {
      console.error("Error deleting all data:", error);
      setStatus({ type: 'error', message: "ডাটা মুছতে সমস্যা হয়েছে।" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        
        {/* Status Message */}
        {status && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm transition-all duration-300 ${
                status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
                {status.type === 'success' ? <CheckCircle size={20} /> : status.type === 'error' ? <AlertTriangle size={20} /> : <RefreshCw size={20} className={loading ? "animate-spin" : ""} />}
                <span className="font-medium">{status.message}</span>
                <button onClick={() => setStatus(null)} className="ml-auto hover:bg-black/5 p-1 rounded"><X size={16}/></button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Init DB Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Server size={24} />
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">সেটআপ</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">ডাটাবেস ইনিশিয়ালাইজেশন</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    সিস্টেমে ৩০০টি আসনের স্ট্যাটিক ডাটা (এলাকা, প্রার্থী তালিকা, ভোটার সংখ্যা) আপলোড বা রিসেট করতে এটি ব্যবহার করুন। এটি বিদ্যমান ভোটের ফলাফল মুছবে না, শুধু স্ট্রাকচার আপডেট করবে।
                </p>
                <button 
                    onClick={handleInitializeDatabase}
                    disabled={loading || !isAdminMode}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                    ইনিশিয়ালাইজ করুন
                </button>
            </div>

            {/* Delete All Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="p-3 bg-red-50 rounded-xl text-red-600">
                        <Trash2 size={24} />
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <AlertTriangle size={10} /> ডেঞ্জার জোন
                    </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">ফলাফল রিসেট</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    সিস্টেম থেকে <strong>সকল আসনের</strong> প্রাপ্ত ভোট এবং ঘোষিত বিজয়ীর তালিকা মুছে ফেলুন। এই অ্যাকশনটি ফিরিয়ে আনা সম্ভব নয়। নতুন নির্বাচন শুরুর আগে এটি ব্যবহার করুন।
                </p>
                <button 
                    onClick={() => {
                        setDeleteConfirmationText('');
                        setShowDeleteModal(true);
                    }}
                    disabled={loading || !isAdminMode}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    সব ফলাফল মুছুন
                </button>
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 relative">
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4 animate-pulse">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            আপনি কি নিশ্চিত?
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            এই কাজটি <strong>অপরিবর্তনীয়</strong>। এটি ডাটাবেস থেকে সকল ভোটের তথ্য এবং বিজয়ী তালিকা স্থায়ীভাবে মুছে ফেলবে।
                        </p>
                        
                        <div className="text-left mb-2">
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                নিশ্চিত করতে <span className="text-red-600 font-mono">delete</span> টাইপ করুন:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmationText}
                                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-mono placeholder:text-gray-300"
                                placeholder="delete"
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                        >
                            বাতিল
                        </button>
                        <button
                            onClick={executeDeleteAll}
                            disabled={deleteConfirmationText !== 'delete'}
                            className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors
                                ${deleteConfirmationText === 'delete' 
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 cursor-pointer' 
                                    : 'bg-red-300 cursor-not-allowed'}
                            `}
                        >
                            মুছে ফেলুন
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SystemConfig;