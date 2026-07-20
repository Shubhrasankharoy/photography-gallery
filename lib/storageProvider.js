/**
 * Storage Provider Abstraction Layer.
 * Interfaces with Google Drive Proxy endpoints (or other storage APIs in the future).
 */
export const storageProvider = {
  /**
   * Connect is handled by redirecting to Google OAuth flow.
   */
  async connect() {
    throw new Error("Connection is handled via OAuth redirect.");
  },

  /**
   * Disconnects the storage connection.
   */
  async disconnect(userId, studioId = "") {
    const response = await fetch(`/api/drive/disconnect?uid=${userId}&studioId=${studioId}`, {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`Failed to disconnect storage connection: ${await response.text()}`);
    }
  },

  /**
   * Uploads a file with progress monitoring.
   */
  async uploadFile(file, userId, folderId = "", onProgress = null, studioId = "") {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/drive/upload");

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res);
          } catch (err) {
            reject(new Error("Failed to parse storage upload response."));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || "Storage upload failed."));
          } catch (err) {
            reject(new Error(`Storage upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during storage upload."));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("uid", userId);
      if (folderId) {
        formData.append("folderId", folderId);
      }
      if (studioId) {
        formData.append("studioId", studioId);
      }
      xhr.send(formData);
    });
  },

  /**
   * Deletes a file from storage.
   */
  async deleteFile(fileId, userId, studioId = "") {
    if (!fileId || !userId) return;
    const deleteUrl = `/api/drive/file/${fileId}?uid=${userId}&studioId=${studioId}`;
    const response = await fetch(deleteUrl, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`Failed to delete storage file ${fileId}: ${await response.text()}`);
    }
  },

  /**
   * Replaces an existing file in storage with a new one.
   */
  async replaceFile(fileId, file, userId, folderId = "", onProgress = null, studioId = "") {
    if (fileId) {
      try {
        await this.deleteFile(fileId, userId, studioId);
      } catch (err) {
        console.warn(`Non-fatal: could not delete old file ${fileId} during replacement:`, err);
      }
    }
    return this.uploadFile(file, userId, folderId, onProgress, studioId);
  },

  /**
   * Returns download URL for a file.
   */
  getDownloadUrl(fileId, userId, studioId = "") {
    return `/api/drive/file/${fileId}?uid=${userId}&studioId=${studioId}`;
  },

  /**
   * Returns thumbnail URL for a file.
   */
  getThumbnail(fileId, userId, studioId = "", fallbackUrl = "") {
    return fallbackUrl || `/api/drive/file/${fileId}?uid=${userId}&studioId=${studioId}`;
  },

  /**
   * Retrieves a file.
   */
  async getFile(fileId, userId, studioId = "") {
    const url = `/api/drive/file/${fileId}?uid=${userId}&studioId=${studioId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to retrieve file ${fileId}`);
    }
    return response;
  },

  /**
   * Creates a folder.
   */
  async createFolder(folderName, userId, studioId = "", parentFolderId = "") {
    const response = await fetch("/api/drive/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: userId,
        studioId,
        folderName,
        parentFolderId
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create folder");
    }
    return await response.json();
  },

  /**
   * Retrieves folder details.
   */
  async getFolder(folderId, userId, studioId = "") {
    const response = await fetch(`/api/drive/folders/${folderId}?uid=${userId}&studioId=${studioId}`);
    if (!response.ok) {
      throw new Error(`Failed to retrieve folder ${folderId}`);
    }
    return await response.json();
  }
};

