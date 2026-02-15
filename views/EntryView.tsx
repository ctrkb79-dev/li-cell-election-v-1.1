import React, { useEffect, useState } from 'react';
import { Save, Loader2, Check, AlertTriangle } from 'lucide-react';
import EntryHeader from '../components/entry/EntryHeader';
import EntryLocationForm from '../components/entry/EntryLocationForm';
import EntryStatsForm from '../components/entry/EntryStatsForm';
import EntryPartySelection from '../components/entry/EntryPartySelection';
import EntryResultsTable from '../components/entry/EntryResultsTable';
import { useEntryForm } from '../hooks/useEntryForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EntryView: React.FC = () => {
  const {
    formData, districts, upazilaOptions, seatOptions, seatDescriptions, availableParties, totalVotes,
    isAddingCustom, setIsAddingCustom, customPartyName, setCustomPartyName,
    isSubmitting, isInitializing, isLoadingData, showSuccess,
    handleDivisionChange, handleDistrictChange, handleSeatChange,
    setTotalVoters, setTotalCenters, toggleUpazila, toggleParty,
    handleAddCustomParty, removeParty, updateResultField, handleReset, handleSubmit, handleInitializeDatabase
  } = useEntryForm();

  const [isSuspended, setIsSuspended] = useState(false);

  // Check suspension status when seat changes
  useEffect(() => {
      const checkSuspension = async () => {
          if (formData.seatNo) {
              const seatRef = doc(db, "seats", formData.seatNo);
              const snap = await getDoc(seatRef);
              if (snap.exists() && snap.data().isSuspended) {
                  setIsSuspended(true);
              } else {
                  setIsSuspended(false);
              }
          } else {
              setIsSuspended(false);
          }
      };
      checkSuspension();
  }, [formData.seatNo]);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
      <EntryHeader 
        totalVotes={totalVotes}
        isInitializing={isInitializing}
        onInitialize={handleInitializeDatabase}
        onReset={handleReset}
        hasSeatSelected={!!formData.seatNo}
      />

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {isSuspended && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r shadow-sm flex items-center gap-3 animate-pulse">
                <AlertTriangle className="text-red-600" size={24} />
                <div>
                    <h3 className="font-bold text-red-800">সতর্কতা: এই আসনটি স্থগিত</h3>
                    <p className="text-sm text-red-600">এই আসনের নির্বাচনী ফলাফল বর্তমানে স্থগিত ঘোষণা করা হয়েছে।</p>
                </div>
            </div>
        )}

        <EntryLocationForm 
          division={formData.division} onDivisionChange={handleDivisionChange}
          district={formData.district} onDistrictChange={handleDistrictChange}
          seatNo={formData.seatNo} onSeatChange={handleSeatChange}
          districts={districts}
          seatOptions={seatOptions}
          seatDescriptions={seatDescriptions}
          isLoadingData={isLoadingData}
        />

        {formData.seatNo && (
          <EntryStatsForm 
            seatNo={formData.seatNo}
            upazilas={formData.upazilas}
            upazilaOptions={upazilaOptions}
            toggleUpazila={toggleUpazila}
            totalVoters={formData.totalVoters || 0}
            setTotalVoters={setTotalVoters}
            totalCenters={formData.totalCenters || 0}
            setTotalCenters={setTotalCenters}
          />
        )}

        <hr className="border-gray-200" />

        <EntryPartySelection 
          availableParties={availableParties}
          selectedParties={formData.results.map(r => r.party)}
          divisionSelected={!!formData.division}
          onToggleParty={toggleParty}
          isAddingCustom={isAddingCustom}
          setIsAddingCustom={setIsAddingCustom}
          customPartyName={customPartyName}
          setCustomPartyName={setCustomPartyName}
          onAddCustomParty={handleAddCustomParty}
        />

        <EntryResultsTable 
          results={formData.results}
          totalVotes={totalVotes}
          onUpdateResult={updateResultField}
          onRemoveParty={removeParty}
        />

        <div className="pt-4">
          {showSuccess && (
            <div className="mb-3 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 shadow-sm">
              <Check size={18} />
              <span className="font-medium">তথ্য সফলভাবে সংরক্ষিত হয়েছে!</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !formData.seatNo}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg px-5 py-3.5 text-center shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                সংরক্ষণ...
              </>
            ) : (
              <>
                <Save size={20} />
                তথ্য আপডেট করুন
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryView;