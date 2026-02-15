
import React from 'react';
import SearchableSelect from '../SearchableSelect';
import { LOCATION_DATA } from '../../constants';

interface EntryLocationFormProps {
  division: string;
  onDivisionChange: (val: string) => void;
  district: string;
  onDistrictChange: (val: string) => void;
  seatNo: string;
  onSeatChange: (val: string) => void;
  districts: string[];
  seatOptions: string[];
  seatDescriptions: Record<string, string>;
  isLoadingData: boolean;
}

const EntryLocationForm: React.FC<EntryLocationFormProps> = ({
  division, onDivisionChange,
  district, onDistrictChange,
  seatNo, onSeatChange,
  districts, seatOptions, seatDescriptions, isLoadingData
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">বিভাগ</label>
        <SearchableSelect
          options={Object.keys(LOCATION_DATA)}
          value={division}
          onChange={onDivisionChange}
          placeholder="বিভাগ নির্বাচন"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">জেলা</label>
        <SearchableSelect
          options={districts}
          value={district}
          onChange={onDistrictChange}
          placeholder="জেলা নির্বাচন"
          disabled={!division}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">আসন</label>
        <SearchableSelect
          options={seatOptions}
          value={seatNo}
          onChange={onSeatChange}
          placeholder="আসন নির্বাচন"
          disabled={!district}
          isLoading={isLoadingData}
          descriptions={seatDescriptions}
        />
      </div>
    </div>
  );
};

export default EntryLocationForm;
