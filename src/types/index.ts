import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'worker';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
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
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface NoteFormData {
  title: string;
  content: string;
  projectName: string;
  image: File | null;
}

export interface FilterOptions {
  workerEmail: string;
  projectName: string;
  dateFrom: string;
  dateTo: string;
}
