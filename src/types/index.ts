import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'worker';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}

// Custom field for dynamic key-value pairs
export interface CustomField {
  label: string;
  value: string;
}

export interface Note {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  imageUrl: string;
  title: string;
  content: string;
  projectName: string;
  // Land surveying fields
  ada: string;      // Block
  parsel: string;   // Parcel
  customFields: CustomField[];  // Dynamic fields
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface NoteFormData {
  title: string;
  content: string;
  projectName: string;
  ada: string;
  parsel: string;
  customFields: CustomField[];
  image: File | null;
}

export interface FilterOptions {
  workerEmail: string;
  projectName: string;
  dateFrom: string;
  dateTo: string;
}
