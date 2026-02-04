import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'worker';

// Note status workflow
export type NoteStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export interface StatusConfig {
  key: NoteStatus;
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
}

export const NOTE_STATUS_CONFIG: Record<NoteStatus, StatusConfig> = {
  open: {
    key: 'open',
    label: 'Beklemede',
    color: 'gray',
    bgLight: 'bg-gray-100',
    bgDark: 'bg-gray-600/20',
    textLight: 'text-gray-700',
    textDark: 'text-gray-300',
    borderLight: 'border-gray-300',
    borderDark: 'border-gray-600'
  },
  in_progress: {
    key: 'in_progress',
    label: 'İşlemde',
    color: 'blue',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-600/20',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
    borderLight: 'border-blue-300',
    borderDark: 'border-blue-600'
  },
  resolved: {
    key: 'resolved',
    label: 'Çözüldü',
    color: 'green',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-600/20',
    textLight: 'text-green-700',
    textDark: 'text-green-300',
    borderLight: 'border-green-300',
    borderDark: 'border-green-600'
  },
  rejected: {
    key: 'rejected',
    label: 'Reddedildi',
    color: 'red',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-600/20',
    textLight: 'text-red-700',
    textDark: 'text-red-300',
    borderLight: 'border-red-300',
    borderDark: 'border-red-600'
  }
};

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
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
  // Multi-image support (new)
  imageUrls: string[];
  // Legacy single image field (for backward compatibility)
  imageUrl?: string;
  title: string;
  content: string;
  projectName: string;
  // Land surveying fields
  ada: string;      // Block
  parsel: string;   // Parcel
  customFields: CustomField[];  // Dynamic fields
  // Status workflow
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
  title: string;
  content: string;
  projectName: string;
  ada: string;
  parsel: string;
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
  workerEmail: string;
  projectName: string;
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
  createdAt: Timestamp;
}

// Notification system
export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  noteId: string;
  noteTitle: string;
  message: string;
  type: 'comment' | 'edit' | 'status_change';
  isRead: boolean;
  createdAt: Timestamp;
}
