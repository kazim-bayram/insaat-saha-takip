import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'worker';

// Note status workflow (QA/QC approval)
export type NoteStatus = 'Eksik' | 'Onay';

// Legacy status types for backward compatibility
export type LegacyNoteStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

// Normalize legacy statuses to new Eksik/Onay system
export const normalizeStatus = (status: string | undefined): NoteStatus => {
  if (status === 'Onay' || status === 'resolved') return 'Onay';
  return 'Eksik'; // Default: open, in_progress, rejected, undefined → Eksik
};

export interface StatusConfig {
  key: NoteStatus;
  label: string;
  emoji: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
}

export const NOTE_STATUS_CONFIG: Record<NoteStatus, StatusConfig> = {
  Eksik: {
    key: 'Eksik',
    label: 'Eksik',
    emoji: '🔴',
    color: 'red',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-600/20',
    textLight: 'text-red-700',
    textDark: 'text-red-300',
    borderLight: 'border-red-300',
    borderDark: 'border-red-600'
  },
  Onay: {
    key: 'Onay',
    label: 'Onay',
    emoji: '🟢',
    color: 'green',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-600/20',
    textLight: 'text-green-700',
    textDark: 'text-green-300',
    borderLight: 'border-green-300',
    borderDark: 'border-green-600'
  }
};

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  isActive?: boolean; // For soft delete - false means disabled
  mustChangePassword?: boolean; // Force password change on first login
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
  userRole?: UserRole;  // Track if admin or worker created the note
  // Multi-image support (new)
  imageUrls: string[];
  // Legacy single image field (for backward compatibility)
  imageUrl?: string;
  title?: string;  // Deprecated: kept for backward compatibility with legacy notes
  content: string;
  projectName: string;
  // Land surveying fields
  ada: string;      // Block
  parsel: string;   // Parcel
  customFields: CustomField[];  // Dynamic fields
  // Progress/Level tracking
  progressLevel?: string;  // Hakediş / Seviye
  // Status workflow (QA/QC: Eksik | Onay)
  status: NoteStatus;
  // Comments/Feedback system
  comments?: Comment[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // Track who last edited (for notifications)
  lastEditedBy?: string;
  lastEditedByName?: string;
}

// Helper function to get images array with backward compatibility
export const getNoteImages = (note: Note): string[] => {
  if (note.imageUrls && note.imageUrls.length > 0) {
    return note.imageUrls;
  }
  if (note.imageUrl) {
    return [note.imageUrl];
  }
  return [];
};

export interface NoteFormData {
  content: string;
  projectName: string;
  ada: string;
  parsel: string;
  progressLevel: string;  // Hakediş / Seviye
  status: NoteStatus;     // Eksik | Onay
  customFields: CustomField[];
  images: File[];  // Changed from single image to array
}

// Upload progress tracking
export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface FilterOptions {
  searchQuery: string;
  workerEmail: string;
  projectName: string;
  ada: string;
  parsel: string;
  progressLevel: string;  // Hakediş / Seviye filter
  status: string;  // '' | 'Eksik' | 'Onay'
  dateFrom: string;
  dateTo: string;
}

// Comment/Feedback system
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  text: string;
  role: UserRole;
  createdAt: Timestamp | Date | string | number | null;
}

