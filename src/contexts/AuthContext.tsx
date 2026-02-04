import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  updateDoc,
  collection, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  // Profile management functions
  checkUsernameAvailable: (username: string, excludeUid?: string) => Promise<boolean>;
  updateUserProfile: (data: { displayName?: string; username?: string }) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  // Admin functions
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile from Firestore
  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (
    user: User,
    displayName: string,
    username: string,
    role: UserRole = 'worker'
  ): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    
    // Create user document with server timestamp
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || '',
      username: username.toLowerCase(),
      displayName,
      role,
      createdAt: serverTimestamp()
    });

    // Fetch the created profile to return with actual timestamp
    const userDoc = await getDoc(userDocRef);
    return userDoc.data() as UserProfile;
  };

  // Check if username is available
  const checkUsernameAvailable = async (username: string, excludeUid?: string): Promise<boolean> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return true;
    
    // If excludeUid is provided, check if the found user is the same user
    if (excludeUid) {
      return snapshot.docs.every(doc => doc.id === excludeUid);
    }
    
    return false;
  };

  // Get email by username for smart login
  const getEmailByUsername = async (username: string): Promise<string | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const userData = snapshot.docs[0].data();
    return userData.email || null;
  };

  // Smart Login function - accepts email OR username
  const login = async (emailOrUsername: string, password: string): Promise<void> => {
    let email = emailOrUsername;
    
    // If input doesn't contain '@', treat as username
    if (!emailOrUsername.includes('@')) {
      const foundEmail = await getEmailByUsername(emailOrUsername);
      if (!foundEmail) {
        throw new Error('Kullanıcı bulunamadı');
      }
      email = foundEmail;
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(userCredential.user);
    setUserProfile(profile);
  };

  // Register function with username
  const register = async (email: string, password: string, displayName: string, username: string): Promise<void> => {
    // Check username availability first
    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name in Firebase Auth
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile in Firestore with username
    const profile = await createUserProfile(userCredential.user, displayName, username, 'worker');
    setUserProfile(profile);
  };

  // Logout function
  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Update user profile (displayName and/or username)
  const updateUserProfile = async (data: { displayName?: string; username?: string }): Promise<void> => {
    if (!currentUser || !userProfile) {
      throw new Error('User not authenticated');
    }

    // Check username availability if changing
    if (data.username && data.username.toLowerCase() !== userProfile.username) {
      const isAvailable = await checkUsernameAvailable(data.username, currentUser.uid);
      if (!isAvailable) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      }
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const updateData: Record<string, string> = {};
    
    if (data.displayName) {
      updateData.displayName = data.displayName;
      // Also update Firebase Auth profile
      await updateProfile(currentUser, { displayName: data.displayName });
    }
    
    if (data.username) {
      updateData.username = data.username.toLowerCase();
    }

    if (Object.keys(updateData).length > 0) {
      await updateDoc(userDocRef, updateData);
      // Refresh profile
      const updatedProfile = await fetchUserProfile(currentUser);
      setUserProfile(updatedProfile);
    }
  };

  // Update user email (requires re-authentication)
  const updateUserEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
    if (!currentUser || !currentUser.email) {
      throw new Error('User not authenticated');
    }

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update email in Firebase Auth
    await firebaseUpdateEmail(currentUser, newEmail);

    // Update email in Firestore
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { email: newEmail });

    // Refresh profile
    const updatedProfile = await fetchUserProfile(currentUser);
    setUserProfile(updatedProfile);
  };

  // Update user password (requires re-authentication)
  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser || !currentUser.email) {
      throw new Error('User not authenticated');
    }

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await firebaseUpdatePassword(currentUser, newPassword);
  };

  // Get all users (Admin only)
  const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as UserProfile));
  };

  // Update user role (Admin only)
  const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only admins can change user roles');
    }

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { role: newRole });
  };

  // Send password reset email (Admin function)
  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  // Refresh user profile
  const refreshUserProfile = async (): Promise<void> => {
    if (currentUser) {
      const profile = await fetchUserProfile(currentUser);
      setUserProfile(profile);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAdmin: userProfile?.role === 'admin',
    // Profile management functions
    checkUsernameAvailable,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    // Admin functions
    getAllUsers,
    updateUserRole,
    sendPasswordReset,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
