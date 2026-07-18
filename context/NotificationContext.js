"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { 
  markAsRead as dbMarkAsRead, 
  markAllAsRead as dbMarkAllAsRead, 
  deleteNotification as dbDeleteNotification 
} from "@/lib/notificationService";

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      Promise.resolve().then(() => {
        setNotifications([]);
        setLoading(false);
      });
      return;
    }

    Promise.resolve().then(() => {
      setLoading(true);
    });
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    // Set up real-time listener for user's notifications
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notifs = [];
        snapshot.forEach((doc) => {
          notifs.push(doc.data());
        });
        // Sort in memory to avoid index requirements
        notifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    await dbMarkAsRead(id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await dbMarkAllAsRead(user.uid, notifications);
  };

  const deleteNotification = async (id) => {
    await dbDeleteNotification(id);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
