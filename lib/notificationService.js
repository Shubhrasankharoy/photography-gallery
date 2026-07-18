import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  writeBatch,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Creates an in-app notification in Firestore.
 * 
 * @param {string} userId - The UID of the photographer/recipient.
 * @param {object} notification - Notification properties.
 * @param {string} notification.type - 'welcome' | 'password_changed' | 'event_created' | 'upload_complete' | 'download'
 * @param {string} notification.title - Headline of notification.
 * @param {string} notification.message - Detail description text.
 * @param {object} [notification.metadata] - Optional additional context fields (e.g. eventId, eventName).
 */
export async function createNotification(userId, { type, title, message, metadata = {} }) {
  if (!db) return null;
  try {
    const notifRef = doc(collection(db, "notifications"));
    const newNotification = {
      id: notifRef.id,
      userId,
      type,
      title,
      message,
      metadata,
      read: false,
      createdAt: new Date().toISOString()
    };
    await setDoc(notifRef, newNotification);
    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId) {
  if (!db) return;
  try {
    const ref = doc(db, "notifications", notificationId);
    await updateDoc(ref, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(notificationId) {
  if (!db) return;
  try {
    const ref = doc(db, "notifications", notificationId);
    await deleteDoc(ref);
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
}

/**
 * Mark all unread notifications of a user as read using a Firestore batch.
 */
export async function markAllAsRead(userId, notifications = []) {
  if (!db) return;
  try {
    const batch = writeBatch(db);
    let count = 0;
    
    notifications.forEach((notif) => {
      if (!notif.read) {
        const ref = doc(db, "notifications", notif.id);
        batch.update(ref, { read: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}
