export interface Hospital {
  hospitalName: string;
  contactNumber: string;
  mailId: string;
  location: string;
  isNew?: boolean;
}

export interface SearchResponse {
  results: Hospital[];
}
