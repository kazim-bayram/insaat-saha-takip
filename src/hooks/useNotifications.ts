import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  // Fetch notifications for current user
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData: Notification[] = [];
        let unread = 0;

        snapshot.forEach((doc) => {
          const notification = {
            id: doc.id,
            ...doc.data()
          } as Notification;
          notificationsData.push(notification);
          if (!notification.isRead) {
            unread++;
          }
        });

        setNotifications(notificationsData);
        setUnreadCount(unread);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Create a notification
  const createNotification = async (
    recipientId: string,
    senderId: string,
    senderName: string,
    noteId: string,
    noteTitle: string,
    message: string,
    type: 'comment' | 'edit' | 'status_change'
  ): Promise<void> => {
    // Don't notify yourself
    if (recipientId === senderId) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        senderId,
        senderName,
        noteId,
        noteTitle,
        message,
        type,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { isRead: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!currentUser || notifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.isRead);

      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { isRead: true });
      });

      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [currentUser, notifications]);

  // Get recent notifications (last 10)
  const getRecentNotifications = useCallback((): Notification[] => {
    return notifications.slice(0, 10);
  }, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    getRecentNotifications
  };
};
