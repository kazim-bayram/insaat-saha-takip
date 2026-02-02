import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { Note, NoteFormData, FilterOptions } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { currentUser, userProfile, isAdmin } = useAuth();

  // Fetch notes based on user role
  useEffect(() => {
    if (!currentUser || !userProfile) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Build query based on role
    const notesRef = collection(db, 'notes');
    let q;

    if (isAdmin) {
      // Admin can see all notes
      q = query(notesRef, orderBy('createdAt', 'asc'));
    } else {
      // Workers can only see their own notes
      q = query(
        notesRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'asc')
      );
    }

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notesData: Note[] = [];
        snapshot.forEach((doc) => {
          notesData.push({
            id: doc.id,
            ...doc.data()
          } as Note);
        });
        setNotes(notesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile, isAdmin]);

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${currentUser?.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, `notes/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  };

  // Delete image from Firebase Storage
  const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Create a new note
  const createNote = async (formData: NoteFormData): Promise<void> => {
    if (!currentUser || !userProfile) {
      throw new Error('User not authenticated');
    }

    setUploading(true);
    setError(null);

    try {
      let imageUrl = '';

      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }

      const noteData = {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile.displayName,
        imageUrl,
        title: formData.title,
        content: formData.content,
        projectName: formData.projectName,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'notes'), noteData);
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note. Please try again.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Update an existing note
  const updateNote = async (noteId: string, formData: Partial<NoteFormData>, newImage?: File): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    setUploading(true);
    setError(null);

    try {
      const noteRef = doc(db, 'notes', noteId);
      const updateData: Record<string, unknown> = {
        ...formData,
        updatedAt: Timestamp.now()
      };

      // Handle new image upload if provided
      if (newImage) {
        const imageUrl = await uploadImage(newImage);
        updateData.imageUrl = imageUrl;
      }

      // Remove image field if it exists (we use imageUrl)
      delete updateData.image;

      await updateDoc(noteRef, updateData);
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note. Please try again.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Delete a note
  const deleteNote = async (note: Note): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      // Delete associated image if exists
      if (note.imageUrl) {
        await deleteImage(note.imageUrl);
      }

      // Delete the note document
      await deleteDoc(doc(db, 'notes', note.id));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
      throw err;
    }
  };

  // Filter notes (client-side for admin dashboard)
  const filterNotes = useCallback((filters: FilterOptions): Note[] => {
    return notes.filter((note) => {
      // Filter by worker email
      if (filters.workerEmail && !note.userEmail.toLowerCase().includes(filters.workerEmail.toLowerCase())) {
        return false;
      }

      // Filter by project name
      if (filters.projectName && !note.projectName.toLowerCase().includes(filters.projectName.toLowerCase())) {
        return false;
      }

      // Filter by date range
      if (filters.dateFrom) {
        const noteDate = note.createdAt.toDate();
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (noteDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const noteDate = note.createdAt.toDate();
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (noteDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [notes]);

  // Get unique project names for filter dropdown
  const getProjectNames = useCallback((): string[] => {
    const projects = new Set(notes.map(note => note.projectName));
    return Array.from(projects).sort();
  }, [notes]);

  // Get unique worker emails for filter dropdown
  const getWorkerEmails = useCallback((): string[] => {
    const emails = new Set(notes.map(note => note.userEmail));
    return Array.from(emails).sort();
  }, [notes]);

  return {
    notes,
    loading,
    error,
    uploading,
    createNote,
    updateNote,
    deleteNote,
    filterNotes,
    getProjectNames,
    getWorkerEmails
  };
};
