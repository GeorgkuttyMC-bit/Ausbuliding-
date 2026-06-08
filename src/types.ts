export interface Hospital {
  hospitalName: string;
  contactNumber: string;
  mailId: string;
  location: string;
  website?: string;
  history?: string;
  openingDetails?: string;
  postedDaysAgo?: number;
  isNew?: boolean;
  isEmailVerified?: boolean | null;
  duplicateSources?: string[];
}

export interface SearchResponse {
  results: Hospital[];
}
