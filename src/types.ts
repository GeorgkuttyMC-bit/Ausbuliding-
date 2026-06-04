export interface Hospital {
  hospitalName: string;
  contactNumber: string;
  mailId: string;
  location: string;
}

export interface SearchResponse {
  results: Hospital[];
}
