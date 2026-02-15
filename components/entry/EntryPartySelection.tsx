
import React from 'react';
import { Database, CheckSquare, Square, Check, X, Plus } from 'lucide-react';

interface EntryPartySelectionProps {
  availableParties: string[];
  selectedParties: string[];
  divisionSelected: boolean;
  onToggleParty: (party: string) => void;
  isAddingCustom: boolean;
  setIsAddingCustom: (val: boolean) => void;
  customPartyName: string;
  setCustomPartyName: (val: string) => void;
  onAddCustomParty: () => void;
}

const EntryPartySelection: React.FC<EntryPartySelectionProps> = ({
  availableParties, selectedParties, divisionSelected, onToggleParty,
  isAddingCustom, setIsAddingCustom, customPartyName, setCustomPartyName, onAddCustomParty
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Database size={20} className="text-green-600" />
        ফলাফল ও প্রার্থী এন্ট্রি
      </h2>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-3">
            দল নির্বাচন করুন (টিক দিন)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableParties.map(party => {
              const isSelected = selectedParties.includes(party);
              const isDisabled = !divisionSelected;
              
              return (
                <button
                  key={party}
                  type="button"
                  onClick={() => onToggleParty(party)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left
                    ${isSelected 
                      ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:shadow-sm'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:shadow-none' : ''}
                  `}
                >
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  {party}
                </button>
              );
            })}

            {isAddingCustom ? (
              <div className="col-span-1 md:col-span-1 flex items-center gap-1 bg-white border border-green-500 rounded-lg p-1 shadow-sm">
                <input
                   autoFocus
                   type="text"
                   value={customPartyName}
                   onChange={(e) => setCustomPartyName(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       onAddCustomParty();
                     }
                   }}
                   placeholder="দলের নাম..."
                   className="w-full text-sm outline-none px-2 py-1 text-gray-800 bg-white"
                />
                <button 
                  type="button"
                  onClick={onAddCustomParty}
                  className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200"
                >
                  <Check size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setCustomPartyName('');
                  }}
                  className="bg-red-100 text-red-700 p-1 rounded hover:bg-red-200"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCustom(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-400 text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-white transition-all"
              >
                <Plus size={16} />
                নতুন দল
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryPartySelection;
