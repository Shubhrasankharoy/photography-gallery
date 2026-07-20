import { db } from "./firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { googleDriveProvider } from "./googleDriveProvider";
import { getValidTokenForConnection, getValidTokenLegacy } from "./googleOAuthService";

/**
 * Storage Provider Factory.
 * Resolves active connections and routes requests to the correct provider.
 */
export const storageFactory = {
  /**
   * Resolves the active connection for a given user and studio.
   * If a connection is found in driveConnections, returns it.
   * Otherwise, falls back to the legacy photographers collection.
   */
  async resolveConnection(userId, studioId = "") {
    if (!db || !userId) return null;

    // 1. Search new driveConnections collection for the active studio
    if (studioId) {
      const q = query(
        collection(db, "driveConnections"),
        where("userId", "==", userId),
        where("studioId", "==", studioId),
        where("status", "==", "connected")
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return {
          type: "driveConnections",
          id: docSnap.id,
          data: { connectionId: docSnap.id, ...docSnap.data() },
        };
      }
    }

    // Try finding any connected Drive for this user as a fallback
    const qUser = query(
      collection(db, "driveConnections"),
      where("userId", "==", userId),
      where("status", "==", "connected")
    );
    const userSnap = await getDocs(qUser);
    if (!userSnap.empty) {
      const docSnap = userSnap.docs[0];
      return {
        type: "driveConnections",
        id: docSnap.id,
        data: { connectionId: docSnap.id, ...docSnap.data() },
      };
    }

    // 2. Legacy fallback: Check photographers collection
    const photographerRef = doc(db, "photographers", userId);
    const profileSnap = await getDoc(photographerRef);
    if (profileSnap.exists()) {
      const profile = profileSnap.data();
      if (profile.googleDriveConnected) {
        return {
          type: "legacy",
          id: "legacy",
          data: {
            connectionId: "legacy",
            userId,
            studioId: "",
            provider: "google-drive",
            googleDriveToken: profile.googleDriveToken,
            rootFolderId: profile.googleDriveFolderId || "root",
            isMock: profile.googleDriveToken?.isMock || false,
          },
        };
      }
    }

    return null;
  },

  /**
   * Resolves connection and returns the configured provider instance.
   */
  async getProvider(userId, studioId = "") {
    const connection = await this.resolveConnection(userId, studioId);
    if (!connection) {
      throw new Error("No connected storage provider found. Please connect your storage account.");
    }

    const { provider } = connection.data;
    if (provider === "google-drive" || connection.data.googleDriveToken) {
      let accessToken;
      if (connection.type === "driveConnections") {
        accessToken = await getValidTokenForConnection(connection.data);
      } else {
        accessToken = await getValidTokenLegacy(userId);
      }

      return {
        providerName: "google-drive",
        provider: googleDriveProvider,
        accessToken,
        connectionId: connection.data.connectionId,
        rootFolderId: connection.data.rootFolderId || connection.data.googleDriveFolderId || "root",
        isMock: connection.data.isMock || false,
      };
    }

    throw new Error(`Unsupported storage provider: ${provider}`);
  }
};
