export interface Hospital {
  hospitalName: string;
  contactNumber: string;
  mailId: string;
  location: string;
  history?: string;
  openingDetails?: string;
  isNew?: boolean;
}

export interface SearchResponse {
  results: Hospital[];
}
