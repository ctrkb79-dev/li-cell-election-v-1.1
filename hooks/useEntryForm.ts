import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { LOCATION_DATA, PARTIES, SEAT_DATA, SEAT_AREAS, SEAT_INDICES, PARTY_SYMBOLS } from '../constants';
import { CANDIDATES } from '../candidates';
import { CandidateFormState, PartyResult } from '../types';

export const useEntryForm = () => {
  const [formData, setFormData] = useState<CandidateFormState>({
    division: '', district: '', upazilas: [], seatNo: '',
    totalVoters: 0, totalCenters: 0, results: []
  });

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customPartyName, setCustomPartyName] = useState('');
  const [customParties, setCustomParties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch Global Custom Parties
  useEffect(() => {
    const fetchGlobalParties = async () => {
      try {
        const docRef = doc(db, "metadata", "custom_parties");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.names && Array.isArray(data.names)) {
            setCustomParties(data.names);
          }
        }
      } catch (error: any) {
        console.error("Error fetching custom parties:", error?.message);
      }
    };
    fetchGlobalParties();
  }, []);

  // Derived Values
  const districts = useMemo(() => formData.division ? Object.keys(LOCATION_DATA[formData.division] || {}) : [], [formData.division]);
  const upazilaOptions = useMemo(() => (formData.division && formData.district) ? LOCATION_DATA[formData.division][formData.district] || [] : [], [formData.division, formData.district]);
  const seatOptions = useMemo(() => formData.district ? SEAT_DATA[formData.district] || [] : [], [formData.district]);
  
  const seatDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    seatOptions.forEach(seat => {
        const index = SEAT_INDICES[seat] ? `[${SEAT_INDICES[seat]}] ` : '';
        const areas = SEAT_AREAS[seat] || [];
        map[seat] = `${index}${areas.join(', ')}`;
    });
    return map;
  }, [seatOptions]);

  const availableParties = useMemo(() => {
    const all = [...PARTIES];
    customParties.forEach(p => { if (!all.includes(p)) all.push(p); });
    formData.results.forEach(r => { if (!all.includes(r.party)) all.push(r.party); });
    return all;
  }, [customParties, formData.results]);

  const totalVotes = useMemo(() => formData.results.reduce((sum, item) => sum + (Number(item.votes) || 0), 0), [formData.results]);

  // Load Seat Data
  useEffect(() => {
    const fetchSeatData = async () => {
      if (!formData.seatNo) {
        setFormData(prev => ({ ...prev, results: [], totalVoters: 0, totalCenters: 0 }));
        return;
      }
      setIsLoadingData(true);
      try {
        const docRef = doc(db, "seats", formData.seatNo);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Explicitly map results to ensure no hidden properties/circular refs
          const sanitizedResults = (data.results || []).map((r: any) => ({
            party: r.party || '',
            votes: Number(r.votes) || 0,
            candidate: r.candidate || '',
            symbol: r.symbol || '',
            isDeclaredWinner: !!r.isDeclaredWinner
          }));

          setFormData(prev => ({
            ...prev,
            upazilas: data.upazilas || prev.upazilas,
            totalVoters: data.totalVoters || 0,
            totalCenters: data.totalCenters || 0,
            results: sanitizedResults
          }));
        } else {
          // Defaults for new seat
          const defaultUpazilas = SEAT_AREAS[formData.seatNo] || [];
          let hash = 0;
          for(let i=0; i<formData.seatNo.length; i++) hash = formData.seatNo.charCodeAt(i) + ((hash << 5) - hash);
          setFormData(prev => ({ 
            ...prev, results: [], upazilas: defaultUpazilas,
            totalVoters: 300000 + (Math.abs(hash) % 250000),
            totalCenters: 100 + (Math.abs(hash) % 150)
          }));
        }
      } catch (error: any) {
        console.error("Error fetching seat data:", error?.message);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchSeatData();
  }, [formData.seatNo]);

  // Actions
  const handleDivisionChange = (val: string) => setFormData(prev => ({ ...prev, division: val, district: '', upazilas: [], seatNo: '', results: [], totalVoters: 0, totalCenters: 0 }));
  const handleDistrictChange = (val: string) => setFormData(prev => ({ ...prev, district: val, upazilas: [], seatNo: '', results: [], totalVoters: 0, totalCenters: 0 }));
  const handleSeatChange = (val: string) => setFormData(prev => ({ ...prev, seatNo: val, results: [], totalVoters: 0, totalCenters: 0 }));
  const setTotalVoters = (val: number) => setFormData(prev => ({ ...prev, totalVoters: val }));
  const setTotalCenters = (val: number) => setFormData(prev => ({ ...prev, totalCenters: val }));

  const toggleUpazila = (upazila: string) => {
    setFormData(prev => {
      const exists = prev.upazilas.includes(upazila);
      return { ...prev, upazilas: exists ? prev.upazilas.filter(u => u !== upazila) : [...prev.upazilas, upazila] };
    });
  };

  const toggleParty = (partyName: string) => {
    if (!formData.division) return;
    setFormData(prev => {
      const exists = prev.results.some(r => r.party === partyName);
      if (exists) return { ...prev, results: prev.results.filter(r => r.party !== partyName) };
      
      const defaultCandidate = CANDIDATES[prev.seatNo]?.[partyName] || '';
      const defaultSymbol = PARTY_SYMBOLS[partyName] || '';
      return { 
          ...prev, 
          results: [...prev.results, { party: partyName, votes: 0, candidate: defaultCandidate, symbol: defaultSymbol }] 
      };
    });
  };

  const handleAddCustomParty = async () => {
    if (!customPartyName.trim()) { setIsAddingCustom(false); return; }
    const name = customPartyName.trim();
    setCustomParties(prev => (prev.includes(name) || PARTIES.includes(name)) ? prev : [...prev, name]);
    try {
      await setDoc(doc(db, "metadata", "custom_parties"), { names: arrayUnion(name) }, { merge: true });
    } catch (e: any) { console.error(e?.message); }
    setCustomPartyName('');
    setIsAddingCustom(false);
  };

  const removeParty = (partyName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে আপনি ${partyName} তালিকা থেকে বাদ দিতে চান?`)) return;
    setFormData(prev => ({ ...prev, results: prev.results.filter(r => r.party !== partyName) }));
  };

  const updateResultField = (partyName: string, field: keyof PartyResult, value: any) => {
    setFormData(prev => ({
      ...prev, results: prev.results.map(r => r.party === partyName ? { ...r, [field]: value } : r)
    }));
  };

  const handleReset = () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি ফর্মটি রিসেট করতে চান? সব তথ্য মুছে যাবে।")) return;
    setFormData({ division: '', district: '', upazilas: [], seatNo: '', totalVoters: 0, totalCenters: 0, results: [] });
    setIsAddingCustom(false);
    setCustomPartyName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.seatNo) { alert("অনুগ্রহ করে আসন নির্বাচন করুন।"); return; }
    setIsSubmitting(true);
    setShowSuccess(false);
    try {
      await setDoc(doc(db, "seats", formData.seatNo), {
        division: formData.division,
        district: formData.district,
        seatNo: formData.seatNo,
        upazilas: formData.upazilas,
        totalVoters: Number(formData.totalVoters),
        totalCenters: Number(formData.totalCenters),
        results: formData.results,
        totalVotes: totalVotes,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      console.error("Error adding document: ", e?.message);
      alert("ডাটা সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitializeDatabase = async () => {
    if (!window.confirm("সতর্কতা: এটি ৩০০টি আসনের ডিফল্ট স্ট্যাটিক ডাটা (প্রার্থী, এলাকা, মক ভোটার সংখ্যা) ডাটাবেসে আপলোড করবে। আপনি কি নিশ্চিত?")) return;
    setIsInitializing(true);
    try {
        const batch = writeBatch(db);
        let operationCount = 0;
        const distToDiv: Record<string, string> = {};
        Object.keys(LOCATION_DATA).forEach(div => Object.keys(LOCATION_DATA[div]).forEach(dist => distToDiv[dist] = div));

        for (const dist of Object.keys(SEAT_DATA)) {
            for (const seatNo of SEAT_DATA[dist]) {
                const defaultCandidates = CANDIDATES[seatNo] || {};
                const results: PartyResult[] = Object.entries(defaultCandidates).map(([party, name]) => ({
                    party, candidate: name, votes: 0, symbol: PARTY_SYMBOLS[party] || '', isDeclaredWinner: false
                }));
                let hash = 0;
                for(let i=0; i<seatNo.length; i++) hash = seatNo.charCodeAt(i) + ((hash << 5) - hash);
                
                await setDoc(doc(db, "seats", seatNo), {
                    seatNo, district: dist, division: distToDiv[dist] || '',
                    upazilas: SEAT_AREAS[seatNo] || [],
                    totalVoters: 300000 + (Math.abs(hash) % 250000),
                    totalCenters: 100 + (Math.abs(hash) % 150),
                    results, totalVotes: 0, updatedAt: serverTimestamp() 
                }, { merge: true });
                operationCount++;
            }
        }
        alert(`সফলভাবে ${operationCount} টি আসনের ডাটা ডাটাবেসে সিনক্রোনাইজ করা হয়েছে।`);
    } catch (e: any) {
        console.error("Error initializing DB:", e?.message);
        alert("ডাটাবেস ইনিশিয়ালাইজ করতে সমস্যা হয়েছে।");
    } finally {
        setIsInitializing(false);
    }
  };

  return {
    formData, districts, upazilaOptions, seatOptions, seatDescriptions, availableParties, totalVotes,
    isAddingCustom, setIsAddingCustom, customPartyName, setCustomPartyName,
    isSubmitting, isInitializing, isLoadingData, showSuccess,
    handleDivisionChange, handleDistrictChange, handleSeatChange,
    setTotalVoters, setTotalCenters, toggleUpazila, toggleParty,
    handleAddCustomParty, removeParty, updateResultField, handleReset, handleSubmit, handleInitializeDatabase
  };
};