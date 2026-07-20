import { fetchWithRetry } from "./googleOAuthService";

/**
 * Google Drive Storage Provider Implementation.
 * Runs on the server side to interact with the Google Drive REST API.
 */
export const googleDriveProvider = {
  /**
   * Connect is handled via the OAuth flow and callback route,
   * but we define it here as part of the interface.
   */
  async connect() {
    throw new Error("Connection is handled via Google OAuth flow routes.");
  },

  /**
   * Disconnects a connection by revoking credentials.
   */
  async disconnect(connectionData) {
    if (!connectionData) return;
    const { refreshToken } = connectionData;
    if (refreshToken) {
      try {
        // Attempt to revoke the refresh token via Google OAuth2 revocation endpoint
        await fetchWithRetry("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: refreshToken }),
        });
      } catch (err) {
        console.warn("Non-fatal: Failed to revoke Google refresh token:", err);
      }
    }
  },

  /**
   * Uploads a file to Google Drive.
   */
  async uploadFile(fileBuffer, fileName, mimeType, accessToken, folderId = null) {
    const boundary = "-------314159265358979323846";
    const CRLF = "\r\n";

    const parents = folderId && folderId !== "root" && folderId !== "mock_root_folder_id" ? [folderId] : [];
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: parents,
    };

    const metadataJson = JSON.stringify(metadata);
    const preamble =
      `--${boundary}${CRLF}` +
      `Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}` +
      `${metadataJson}${CRLF}` +
      `--${boundary}${CRLF}` +
      `Content-Type: ${mimeType}${CRLF}${CRLF}`;
    const postamble = `${CRLF}--${boundary}--`;

    const body = Buffer.concat([
      Buffer.from(preamble, "utf-8"),
      fileBuffer,
      Buffer.from(postamble, "utf-8"),
    ]);

    const uploadResponse = await fetchWithRetry(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": String(body.length),
        },
        body: body,
      }
    );

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Google Drive upload failed: ${errText}`);
    }

    return await uploadResponse.json();
  },

  /**
   * Replaces an existing file in Google Drive.
   */
  async replaceFile(fileId, fileBuffer, fileName, mimeType, accessToken) {
    // Replaces file content in-place using Google Drive update API
    const response = await fetchWithRetry(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": mimeType,
        },
        body: fileBuffer,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive replace failed: ${errText}`);
    }

    return await response.json();
  },

  /**
   * Deletes a file from Google Drive.
   */
  async deleteFile(fileId, accessToken) {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errText = await response.text();
      throw new Error(`Google Drive delete failed: ${errText}`);
    }

    return { success: true };
  },

  /**
   * Retrieves a file download stream response.
   */
  async getFile(fileId, accessToken) {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive fetch failed: ${errText}`);
    }

    return response;
  },

  /**
   * Creates a folder in Google Drive.
   */
  async createFolder(folderName, accessToken, parentFolderId = null) {
    const bodyContent = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentFolderId && parentFolderId !== "root") {
      bodyContent.parents = [parentFolderId];
    }

    const response = await fetchWithRetry(
      "https://www.googleapis.com/drive/v3/files",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyContent),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive folder creation failed: ${errText}`);
    }

    return await response.json();
  },

  /**
   * Retrieves folder details.
   */
  async getFolder(folderId, accessToken) {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive get folder failed: ${errText}`);
    }

    return await response.json();
  },

  /**
   * Returns proxy thumbnail URL format.
   */
  getThumbnail(fileId, userId) {
    return `/api/drive/file/${fileId}?uid=${userId}`;
  },

  /**
   * Returns proxy download URL format.
   */
  getDownloadUrl(fileId, userId) {
    return `/api/drive/file/${fileId}?uid=${userId}`;
  }
};
