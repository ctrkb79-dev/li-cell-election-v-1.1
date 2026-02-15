
export interface LocationData {
  [division: string]: {
    [district: string]: string[]; // Array of Upazilas
  };
}

export interface SeatData {
  [district: string]: string[]; // Array of Seat names
}

export interface PartyResult {
  party: string;
  votes: number;
  candidate?: string; // Added candidate name field
  symbol?: string;    // Added symbol field
  isDeclaredWinner?: boolean;
}

export interface CandidateFormState {
  division: string;
  district: string;
  upazilas: string[];
  seatNo: string;
  totalVoters?: number; // New Field
  totalCenters?: number; // New Field
  results: PartyResult[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

// Dashboard specific types
export interface DashboardSeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  totalVotes: number;
  updatedAt?: any;
  isSuspended?: boolean;
}