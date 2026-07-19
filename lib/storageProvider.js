/**
 * Storage Provider Abstraction Layer.
 * Interfaces with Google Drive Proxy endpoints (or other storage APIs in the future).
 */
export const storageProvider = {
  /**
   * Uploads a file with progress monitoring.
   */
  async uploadFile(file, userId, folderId = "", onProgress = null) {
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
      xhr.send(formData);
    });
  },

  /**
   * Deletes a file from storage.
   */
  async deleteFile(fileId, userId) {
    if (!fileId || !userId) return;
    const deleteUrl = `/api/drive/file/${fileId}?uid=${userId}`;
    const response = await fetch(deleteUrl, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`Failed to delete storage file ${fileId}: ${await response.text()}`);
    }
  },

  /**
   * Replaces an existing file in storage with a new one.
   */
  async replaceFile(fileId, file, userId, folderId = "", onProgress = null) {
    // Standard flow: delete the old one first, then upload the new one
    if (fileId) {
      try {
        await this.deleteFile(fileId, userId);
      } catch (err) {
        console.warn(`Non-fatal: could not delete old file ${fileId} during replacement:`, err);
      }
    }
    return this.uploadFile(file, userId, folderId, onProgress);
  },

  /**
   * Returns download URL for a file.
   */
  getDownloadUrl(fileId, userId) {
    return `/api/drive/file/${fileId}?uid=${userId}`;
  },

  /**
   * Returns thumbnail URL for a file.
   */
  getThumbnail(fileId, userId, fallbackUrl = "") {
    return fallbackUrl || `/api/drive/file/${fileId}?uid=${userId}`;
  }
};
