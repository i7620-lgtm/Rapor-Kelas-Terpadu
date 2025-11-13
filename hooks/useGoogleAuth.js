import { useState, useEffect, useCallback, useRef } from 'react';

const RKT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const RKT_FOLDER_NAME = 'RKT_App_Data'; // A specific folder for all RKT files

/**
 * A custom React hook to manage Google Authentication and Google Drive file operations
 * using the modern Google Identity Services (GIS) and the Fetch API. This avoids
 * the legacy GAPI client and solves `idpiframe_initialization_failed` errors.
 *
 * @param {string | null} clientId - The Google Client ID for your application.
 * @returns {object} An object containing auth state and functions to interact with Google services.
 */
const useGoogleAuth = (clientId) => {
  const [googleToken, setGoogleToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const isSignedIn = !!googleToken; // Derived state for sign-in status

  const tokenClient = useRef(null);

  /**
   * Fetches user profile information from Google's userinfo endpoint
   * after a successful token acquisition.
   */
  const getUserInfo = useCallback(async (token) => {
    if (!token) return;
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user info with status: ${response.status}`);
      }
      const profile = await response.json();
      setUserProfile({
        id: profile.sub,
        email: profile.email,
        given_name: profile.given_name,
        name: profile.name,
        picture: profile.picture,
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      // Clear token if user info fails, forcing re-authentication
      setGoogleToken(null);
      setUserProfile(null);
    }
  }, []);

  /**
   * Initializes the Google Identity Services token client.
   * This is called once when the component mounts.
   */
  useEffect(() => {
    if (!clientId || !window.google || tokenClient.current) {
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setGoogleToken(tokenResponse.access_token);
          getUserInfo(tokenResponse.access_token);
        } else {
          console.error('Invalid token response:', tokenResponse);
        }
      },
    });
    tokenClient.current = client;
    console.log('Google OAuth2 Token Client initialized.');
  }, [clientId, getUserInfo]);

  /**
   * Initiates the sign-in flow by requesting an access token.
   */
  const signIn = useCallback(() => {
    if (!clientId) {
      alert('Fitur Google Sign-In tidak aktif karena konfigurasi Client ID tidak ditemukan.');
      console.error('Cannot sign in: Google Client ID is missing.');
      return;
    }
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
    } else {
      console.warn('Google Token Client not loaded yet. Please wait and try again.');
      alert('Layanan otentikasi Google sedang dimuat. Silakan coba beberapa saat lagi.');
    }
  }, [clientId]);

  /**
   * Signs the user out by revoking the current access token.
   */
  const signOut = useCallback(() => {
    if (googleToken) {
      window.google.accounts.oauth2.revoke(googleToken, () => {
        console.log('Token revoked.');
      });
      setGoogleToken(null);
      setUserProfile(null);
    }
  }, [googleToken]);

  /**
   * A wrapper for `fetch` that automatically adds the Authorization header
   * and handles common API errors like 401/403 by signing the user out.
   */
  const driveFetch = useCallback(async (url, options = {}) => {
    if (!googleToken) throw new Error('Not signed in');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        signOut(); // Token is invalid/expired, force re-login.
        throw new Error(`Authentication error (${response.status}). Please sign in again.`);
      }
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    return response;
  }, [googleToken, signOut]);

  /**
   * Finds or creates the dedicated `RKT_App_Data` folder in the user's Google Drive.
   */
  const getOrCreateRKTFolder = useCallback(async () => {
    const q = `name='${RKT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;

    const response = await driveFetch(url);
    const data = await response.json();

    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    } else {
      console.log(`Folder '${RKT_FOLDER_NAME}' not found, creating it...`);
      const createResponse = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: RKT_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'],
        }),
      });
      const createData = await createResponse.json();
      return createData.id;
    }
  }, [driveFetch]);

  /**
   * Finds RKT files by name within the dedicated RKT folder or root.
   */
  const findRKTFileId = useCallback(async (fileName) => {
    const folderId = await getOrCreateRKTFolder();
    // Search in both dedicated folder and root for an exact name match
    const q = `name='${fileName}' and (mimeType='${RKT_MIME_TYPE}' or fileExtension='xlsx') and ('${folderId}' in parents or 'root' in parents) and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)`;
    
    const response = await driveFetch(url);
    const data = await response.json();
    return data.files || [];
  }, [driveFetch, getOrCreateRKTFolder]);

  const findAllRKTFiles = useCallback(async () => {
    const folderId = await getOrCreateRKTFolder();

    // Query 1: Files inside the dedicated RKT folder, checking format
    const q1 = `'${folderId}' in parents and (mimeType='${RKT_MIME_TYPE}' or fileExtension='xlsx') and trashed = false`;
    const url1 = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q1)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;

    // Query 2: Files in root containing 'rkt' (case-insensitive) in their name, also checking format
    const q2 = `'root' in parents and name contains 'rkt' and (mimeType='${RKT_MIME_TYPE}' or fileExtension='xlsx') and trashed = false`;
    const url2 = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q2)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;
    
    try {
        const [response1, response2] = await Promise.all([
          driveFetch(url1),
          driveFetch(url2)
        ]);
        
        const data1 = await response1.json();
        const data2 = await response2.json();

        const filesFromFolder = data1.files || [];
        const filesFromRoot = data2.files || [];

        // Combine and deduplicate files
        const allFilesMap = new Map();
        [...filesFromFolder, ...filesFromRoot].forEach(file => {
          if (!allFilesMap.has(file.id)) {
            allFilesMap.set(file.id, file);
          }
        });

        const combinedFiles = Array.from(allFilesMap.values());
        
        // Sort combined files by modification date, most recent first
        combinedFiles.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

        return combinedFiles;
    } catch (error) {
        console.error("Error fetching files from Drive:", error);
        throw error; // Propagate the error to be handled by the caller.
    }
  }, [driveFetch, getOrCreateRKTFolder]);

  /**
   * Uploads or updates a file in Google Drive using a multipart request.
   */
  const uploadFile = useCallback(async (fileId, fileName, fileBlob, mimeType) => {
    const folderId = await getOrCreateRKTFolder();
    
    const metadata = {
      name: fileName,
      mimeType: mimeType,
    };
    
    let url = 'https://www.googleapis.com/upload/drive/v3/files';
    let method = 'POST';
    
    if (fileId) {
      url += `/${fileId}`;
      method = 'PATCH';
    } else {
      metadata.parents = [folderId];
    }
    
    url += '?uploadType=multipart';
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);
    
    const response = await driveFetch(url, {
      method,
      body: form,
      // Content-Type header is set automatically by the browser for FormData
    });
    
    return response.json();
  }, [driveFetch, getOrCreateRKTFolder]);

  /**
   * Downloads a file from Google Drive.
   */
  const downloadFile = useCallback(async (fileId) => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await driveFetch(url);
    return response.blob();
  }, [driveFetch]);
  
  /**
   * Convenience function to create a new file.
   */
  const createRKTFile = useCallback(async (fileName, fileBlob, mimeType) => {
    return await uploadFile(null, fileName, fileBlob, mimeType);
  }, [uploadFile]);

  return {
    isSignedIn,
    userProfile,
    googleToken,
    signIn,
    signOut,
    uploadFile,
    downloadFile,
    findRKTFileId,
    findAllRKTFiles,
    createRKTFile,
  };
};

export default useGoogleAuth;
