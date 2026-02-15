
import React from 'react';
import { Check } from 'lucide-react';
import { SEAT_INDICES } from '../../constants';

interface EntryStatsFormProps {
  seatNo: string;
  upazilas: string[];
  upazilaOptions: string[];
  toggleUpazila: (upazila: string) => void;
  totalVoters: number;
  setTotalVoters: (val: number) => void;
  totalCenters: number;
  setTotalCenters: (val: number) => void;
}

const EntryStatsForm: React.FC<EntryStatsFormProps> = ({
  seatNo, upazilas, upazilaOptions, toggleUpazila,
  totalVoters, setTotalVoters, totalCenters, setTotalCenters
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
       {/* Upazila/Area */}
       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-blue-800">
              {SEAT_INDICES[seatNo] ? `আসন নং ${SEAT_INDICES[seatNo]} - ` : ''}এলাকা (উপজেলা/থানা):
          </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
          {upazilaOptions.map(upazila => {
              const isSelected = upazilas.includes(upazila);
              return (
              <button
                  key={upazila}
                  type="button"
                  onClick={() => toggleUpazila(upazila)}
                  className={`
                  px-3 py-1 rounded-full text-xs font-medium border transition-all
                  ${isSelected 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'}
                  `}
              >
                  {isSelected && <Check size={12} className="inline mr-1" />}
                  {upazila}
              </button>
              );
          })}
          </div>
      </div>

      {/* Stats Input */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="block text-sm font-semibold text-purple-800 mb-2">নির্বাচনী পরিসংখ্যান</div>
          <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="text-xs text-purple-600 block mb-1">মোট ভোটার</label>
                  <input 
                      type="number" 
                      value={totalVoters || ''}
                      onChange={(e) => setTotalVoters(parseInt(e.target.value) || 0)}
                      className="w-full text-sm p-1.5 rounded border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="0"
                  />
              </div>
              <div>
                  <label className="text-xs text-purple-600 block mb-1">মোট কেন্দ্র</label>
                  <input 
                      type="number" 
                      value={totalCenters || ''}
                      onChange={(e) => setTotalCenters(parseInt(e.target.value) || 0)}
                      className="w-full text-sm p-1.5 rounded border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="0"
                  />
              </div>
          </div>
      </div>
    </div>
  );
};

export default EntryStatsForm;
