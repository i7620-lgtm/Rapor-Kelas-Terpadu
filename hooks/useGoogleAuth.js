import { useState, useEffect, useCallback, useRef } from 'react';

const RKT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const RKT_FOLDER_NAME = 'RKT_App_Data'; // A specific folder for all RKT files

/**
 * A custom React hook to manage Google Authentication and Google Drive file operations.
 * It handles both Google Identity Services (GSI) for modern sign-in and the
 * Google API Client Library (GAPI) for accessing Google Drive.
 *
 * @param {string | null} clientId - The Google Client ID for your application.
 * @returns {object} An object containing auth state and functions to interact with Google services.
 */
const useGoogleAuth = (clientId) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  
  // Refs to prevent re-initialization of Google libraries on re-renders.
  const gsiInitialized = useRef(false);
  const gapiClientInitialized = useRef(false);

  // --- GSI (Google Sign-In v2) Initialization ---
  // GSI is the modern way to handle user sign-in and get an ID token.
  
  /**
   * Callback function that is triggered by GSI after a successful sign-in.
   * It decodes the credential to get basic user profile information.
   * Note: This primarily provides an ID token. For Drive access, we need an OAuth2 access token,
   * which is managed by the GAPI client.
   */
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
    }
  }, []);

  /**
   * Initializes the Google Sign-In client library.
   */
  const initializeGSI = useCallback(() => {
    if (!clientId || !window.google || gsiInitialized.current) return;
    
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
    });

    gsiInitialized.current = true;
    console.log('Google Sign-In (GSI) initialized.');
  }, [clientId, handleCredentialResponse]);

  // --- GAPI (Google API Client) Initialization ---
  // GAPI is the library used to make calls to Google APIs like Google Drive.
  // We use its auth2 module to manage the OAuth2 flow and get the necessary access token.

  /**
   * Initializes the GAPI client, including the auth2 module for sign-in state
   * management and the Drive API discovery document.
   */
  const initializeGAPIClient = useCallback(() => {
    if (!clientId || !window.gapi || gapiClientInitialized.current) return;

    window.gapi.load('client:auth2', async () => {
      try {
        await window.gapi.client.init({
          clientId: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file', // Scope for files created/opened by the app
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });

        const authInstance = window.gapi.auth2.getAuthInstance();
        
        // Listen for changes in sign-in status.
        authInstance.isSignedIn.listen((signedIn) => {
          setIsSignedIn(signedIn);
          if (signedIn) {
            const googleUser = authInstance.currentUser.get();
            const profile = googleUser.getBasicProfile();
            const authResponse = googleUser.getAuthResponse(true); // Get access token

            setUserProfile({
              id: profile.getId(),
              email: profile.getEmail(),
              given_name: profile.getGivenName(),
              name: profile.getName(),
              picture: profile.getImageUrl(),
            });
            setGoogleToken(authResponse.access_token);
          } else {
            // User signed out
            setUserProfile(null);
            setGoogleToken(null);
          }
        });

        // Set the initial sign-in state on load.
        const initialIsSignedIn = authInstance.isSignedIn.get();
        setIsSignedIn(initialIsSignedIn);
        if (initialIsSignedIn) {
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
        console.log('Google API client (GAPI) initialized.');
      } catch (error) {
        console.error('Error initializing GAPI client:', error);
      }
    });
  }, [clientId]);

  // --- Script Loading and Initialization Effect ---
  useEffect(() => {
    // This effect runs once to load the required Google scripts and initialize the libraries.
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

  // --- Sign-In and Sign-Out Functions ---

  /**
   * Initiates the Google Sign-In flow using the GAPI auth2 instance.
   */
  const signIn = useCallback(() => {
    if (!clientId) {
      alert('Fitur Google Sign-In tidak aktif karena konfigurasi Client ID tidak ditemukan.');
      console.error('Cannot sign in: Google Client ID is missing.');
      return;
    }
    const authInstance = window.gapi?.auth2?.getAuthInstance();
    if (authInstance) {
      authInstance.signIn();
    } else {
      console.warn('GAPI auth2 not loaded yet. Please wait and try again.');
      alert('Layanan otentikasi Google sedang dimuat. Silakan coba beberapa saat lagi.');
    }
  }, [clientId]);

  /**
   * Signs the user out using the GAPI auth2 instance.
   */
  const signOut = useCallback(() => {
    const authInstance = window.gapi?.auth2?.getAuthInstance();
    if (clientId && authInstance) {
      authInstance.signOut();
    }
  }, [clientId]);

  // --- Google Drive API Helper Functions ---

  /**
   * A wrapper to execute Drive API calls, ensuring the user is signed in
   * and handling potential authentication errors.
   * @param {Function} apiCall - The async function to execute the GAPI request.
   * @returns {Promise<any>} The result of the API call.
   */
  const executeDriveApi = useCallback(async (apiCall) => {
    if (!isSignedIn || !googleToken) {
      throw new Error('User not signed in or token not available for Drive API.');
    }
    if (!window.gapi?.client?.drive) {
      throw new Error('Google Drive API client not fully loaded.');
    }
    try {
      return await apiCall();
    } catch (error) {
      console.error('Google Drive API error:', error);
      if (error.status === 401 || error.status === 403) { // Unauthorized or Permission Denied
        console.log('Re-authenticating due to Drive API error...');
        signIn(); // Prompt user to re-authenticate
      }
      throw error;
    }
  }, [isSignedIn, googleToken, signIn]);
  
  /**
   * Finds or creates the dedicated folder for RKT application data in the user's Google Drive.
   * @returns {Promise<string>} The ID of the folder.
   */
  const getOrCreateRKTFolder = useCallback(async () => {
    const folderResponse = await executeDriveApi(() => window.gapi.client.drive.files.list({
        q: `name='${RKT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed = false`,
        fields: 'files(id)',
    }));
    
    if (folderResponse.result.files && folderResponse.result.files.length > 0) {
        return folderResponse.result.files[0].id;
    } else {
        console.log(`Folder '${RKT_FOLDER_NAME}' not found, creating it...`);
        const createFolderResponse = await executeDriveApi(() => window.gapi.client.drive.files.create({
             resource: {
                name: RKT_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
                parents: ['root'],
            },
            fields: 'id',
        }));
        return createFolderResponse.result.id;
    }
  }, [executeDriveApi]);


  /**
   * Finds RKT files by name within the dedicated RKT folder.
   * @param {string} fileName - The name of the file to search for.
   * @returns {Promise<Array<object>>} A list of matching file objects.
   */
  const findRKTFileId = useCallback(async (fileName) => {
    const folderId = await getOrCreateRKTFolder();
    const response = await executeDriveApi(() => window.gapi.client.drive.files.list({
        q: `name='${fileName}' and mimeType='${RKT_MIME_TYPE}' and '${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, modifiedTime)',
    }));
    return response.result.files || [];
  }, [executeDriveApi, getOrCreateRKTFolder]);

  /**
   * Uploads a file to Google Drive. It can either create a new file or update an existing one.
   * @param {string | null} fileId - The ID of the file to update. If null, a new file will be created.
   * @param {string} fileName - The name for the new or updated file.
   * @param {Blob} fileBlob - The content of the file as a Blob.
   * @param {string} mimeType - The MIME type of the file.
   * @returns {Promise<object>} The result from the Drive API.
   */
  const uploadFile = useCallback(async (fileId, fileName, fileBlob, mimeType) => {
    const folderId = await getOrCreateRKTFolder();

    const metadata = {
      name: fileName,
      mimeType: mimeType,
    };

    let path = '/upload/drive/v3/files';
    let method = 'POST';
    
    if (fileId) {
      // Update existing file
      path += `/${fileId}`;
      method = 'PATCH';
    } else {
      // Create new file inside the RKT folder
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await executeDriveApi(() => window.gapi.client.request({
      path: path,
      method: method,
      params: { uploadType: 'multipart' },
      headers: { 'Authorization': `Bearer ${googleToken}` },
      body: form,
    }));

    return response.result;
  }, [executeDriveApi, googleToken, getOrCreateRKTFolder]);

  /**
   * Downloads a file from Google Drive by its ID.
   * @param {string} fileId - The ID of the file to download.
   * @returns {Promise<Blob>} The file content as a Blob.
   */
  const downloadFile = useCallback(async (fileId) => {
    const response = await executeDriveApi(() => window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    }));
    return new Blob([response.body], { type: RKT_MIME_TYPE });
  }, [executeDriveApi]);

  /**
   * A convenience function to create a new RKT file in Drive.
   * @param {string} fileName - The name for the new file.
   * @param {Blob} fileBlob - The content of the file.
   * @param {string} mimeType - The MIME type of the file.
   * @returns {Promise<object>} The result from the Drive API.
   */
  const createRKTFile = useCallback(async (fileName, fileBlob, mimeType) => {
      // Creating a file is just uploading with a null fileId.
      return await uploadFile(null, fileName, fileBlob, mimeType);
  }, [uploadFile]);

  // Return the state and functions for the App component to use.
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
