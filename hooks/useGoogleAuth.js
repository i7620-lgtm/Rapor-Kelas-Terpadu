import { useState, useEffect, useCallback, useRef } from 'react';

const RKT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const RKT_FOLDER_NAME = 'RKT_App_Data'; // A specific folder for RKT files

const useGoogleAuth = (clientId) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  const gsiInitialized = useRef(false);
  const gapiClientInitialized = useRef(false);

  // --- GSI (Google Sign-In) Initialization and Handlers ---
  const handleCredentialResponse = useCallback((response) => {
    if (response.credential) {
      const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
      setUserProfile({
        id: decodedToken.sub,
        email: decodedToken.email,
        given_name: decodedToken.given_name,
        name: decodedToken.name,
        picture: decodedToken.picture,
      });
      // Exchange credential for access token if needed for GAPI,
      // or if using the new Google Identity Services, an implicit flow
      // can provide the access token directly.
      // For Drive API, we need an access token, not just ID token (credential).
      // This is handled by requesting specific scopes in initializeGSI below.
      // The `access_token` is usually part of the `gapi.client.getToken()` response after sign-in.
    }
  }, []);

  const initializeGSI = useCallback(() => {
    if (!clientId || !window.google || gsiInitialized.current) return;
    
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false, // Don't auto-sign in
      // For getting an access token directly with GSI, use the `prompt_parent_id` and an OAuth 2.0 flow
      // However, for simplicity and compatibility with GAPI client for Drive,
      // we'll rely on GAPI's own sign-in for the access token after ID token is received.
    });

    window.google.accounts.id.renderButton(
      document.createElement('div'), // We don't render the button here, App.js will trigger signIn()
      { theme: 'outline', size: 'large' }
    );
    gsiInitialized.current = true;
    console.log('Google Sign-In initialized.');
  }, [clientId, handleCredentialResponse]);

  // --- GAPI (Google API Client) Initialization and Handlers ---
  const initializeGAPIClient = useCallback(() => {
    if (!clientId || !window.gapi || !window.gapi.client || gapiClientInitialized.current) return;

    window.gapi.load('client:auth2', async () => {
      try {
        await window.gapi.client.init({
          clientId: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email', // Drive.file allows access to files created/opened by app
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });

        const authInstance = window.gapi.auth2.getAuthInstance();
        authInstance.isSignedIn.listen((signedIn) => {
          setIsSignedIn(signedIn);
          if (signedIn) {
            const googleUser = authInstance.currentUser.get();
            const profile = googleUser.getBasicProfile();
            const authResponse = googleUser.getAuthResponse(true); // true to get access token

            setUserProfile({
              id: profile.getId(),
              email: profile.getEmail(),
              given_name: profile.getGivenName(),
              name: profile.getName(),
              picture: profile.getImageUrl(),
            });
            setGoogleToken(authResponse.access_token);
          } else {
            setUserProfile(null);
            setGoogleToken(null);
          }
        });

        // Initial sign-in state check
        setIsSignedIn(authInstance.isSignedIn.get());
        if (authInstance.isSignedIn.get()) {
            const googleUser = authInstance.currentUser.get();
            const profile = googleUser.getBasicProfile();
            const authResponse = googleUser.getAuthResponse(true);

            setUserProfile({
                id: profile.getId(),
                email: profile.getEmail(),
                given_name: profile.getGivenName(),
                name: profile.getName(),
                picture: profile.getImageUrl(),
            });
            setGoogleToken(authResponse.access_token);
        }
        gapiClientInitialized.current = true;
        console.log('Google API client initialized.');
      } catch (error) {
        console.error('Error initializing GAPI client:', error);
      }
    });
  }, [clientId]);

  useEffect(() => {
    // Load GAPI and GSI scripts and then initialize
    const loadGoogleApis = () => {
      initializeGSI();
      initializeGAPIClient();
    };

    if (document.readyState === 'complete') {
      loadGoogleApis();
    } else {
      window.addEventListener('load', loadGoogleApis);
      return () => window.removeEventListener('load', loadGoogleApis);
    }
  }, [initializeGSI, initializeGAPIClient]);

  const signIn = useCallback(() => {
    if (!clientId) {
      alert('Fitur Google Sign-In tidak aktif karena konfigurasi Client ID tidak ditemukan di lingkungan ini.');
      console.error('Cannot sign in: Google Client ID is missing.');
      return;
    }
    if (window.gapi && window.gapi.auth2 && window.gapi.auth2.getAuthInstance()) {
      window.gapi.auth2.getAuthInstance().signIn();
    } else {
      console.warn('GAPI auth2 not loaded yet. Please wait a moment and try again.');
      alert('Layanan otentikasi Google sedang dimuat. Silakan coba beberapa saat lagi.');
    }
  }, [clientId]);

  const signOut = useCallback(() => {
    if (clientId && window.gapi && window.gapi.auth2 && window.gapi.auth2.getAuthInstance()) {
      window.gapi.auth2.getAuthInstance().signOut();
    } else {
      console.warn('GAPI auth2 not loaded or clientId is missing.');
    }
  }, [clientId]);

  // --- Google Drive API Functions ---

  // Ensure GAPI client is ready before making Drive API calls
  const executeDriveApi = useCallback(async (apiCall) => {
    if (!isSignedIn || !googleToken) {
      throw new Error('User not signed in or token not available for Drive API.');
    }
    if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
      throw new Error('Google Drive API client not fully loaded or initialized.');
    }
    try {
      return await apiCall();
    } catch (error) {
      console.error('Google Drive API error:', error);
      if (error.status === 401 || error.status === 403) { // Unauthorized or Permission Denied
        console.log('Re-authenticating due to Drive API error...');
        window.gapi.auth2.getAuthInstance().signIn(); // Prompt user to re-authenticate
      }
      throw error;
    }
  }, [isSignedIn, googleToken]);

  // Find a specific RKT file by name
  const findRKTFileId = useCallback(async (fileName) => { // fileName added as parameter
    const response = await executeDriveApi(async () => {
        // Search for file within the RKT_App_Data folder
        const folderResponse = await window.gapi.client.drive.files.list({
            q: `name='${RKT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents`,
            fields: 'files(id)',
        });
        const folder = folderResponse.result.files[0];
        let folderId = null;

        if (folder) {
            folderId = folder.id;
        } else {
            // Create folder if it doesn't exist
            const createFolderResponse = await window.gapi.client.drive.files.create({
                resource: {
                    name: RKT_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: ['root']
                },
                fields: 'id',
            });
            folderId = createFolderResponse.result.id;
        }

        return window.gapi.client.drive.files.list({
            q: `name='${fileName}' and mimeType='${RKT_MIME_TYPE}' and '${folderId}' in parents and trashed = false`, // Use dynamic fileName
            fields: 'files(id, name, modifiedTime)',
        });
    });
    return response.result.files;
  }, [executeDriveApi]);

  // Upload (create or update) a file to Drive
  const uploadFile = useCallback(async (fileId, fileName, fileBlob, mimeType) => { // fileName added as parameter
    // First, ensure the RKT_App_Data folder exists and get its ID
    let folderId = null;
    const folderResponse = await executeDriveApi(async () => window.gapi.client.drive.files.list({
        q: `name='${RKT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed = false`,
        fields: 'files(id)',
    }));
    const folder = folderResponse.result.files[0];
    if (folder) {
        folderId = folder.id;
    } else {
        const createFolderResponse = await executeDriveApi(async () => window.gapi.client.drive.files.create({
             resource: {
                name: RKT_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
                parents: ['root'],
            },
            fields: 'id',
        }));
        folderId = createFolderResponse.result.id;
    }

    const metadata = {
      name: fileName, // Use dynamic fileName
      mimeType: mimeType,
    };

    let path = '/upload/drive/v3/files';
    let method = 'POST';
    if (fileId) {
      path += `/${fileId}`;
      method = 'PATCH';
    } else {
      metadata.parents = [folderId]; // Only set parents for new files
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await executeDriveApi(async () => window.gapi.client.request({
      path: path,
      method: method,
      params: { uploadType: 'multipart' },
      headers: {
        'Authorization': `Bearer ${googleToken}`,
      },
      body: form,
    }));
    return response.result;
  }, [executeDriveApi, googleToken]);

  // Download a file from Drive
  const downloadFile = useCallback(async (fileId) => {
    const response = await executeDriveApi(async () => window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    }));
    return new Blob([response.body], { type: RKT_MIME_TYPE });
  }, [executeDriveApi]);

  // Create a new RKT file in Drive
  const createRKTFile = useCallback(async (fileName, fileBlob, mimeType) => { // fileName added as parameter
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
    createRKTFile,
  };
};

export default useGoogleAuth;
