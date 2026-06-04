export interface Hospital {
  hospitalName: string;
  contactNumber: string;
  mailId: string;
  location: string;
  history?: string;
  openingDetails?: string;
  postedDaysAgo?: number;
  deadline?: string;
  isNew?: boolean;
  isEmailVerified?: boolean | null;
}

export interface SearchResponse {
  results: Hospital[];
}
