// ============================================
// PINTOR PLUS - APPLICATION SCRIPTS
// ============================================

// GDrive object for Google Drive integration
const GDrive = {
  _clientId: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Replace with actual client ID
  _apiKey: 'YOUR_GOOGLE_API_KEY_HERE',     // Replace with actual API key
  _scope: 'https://www.googleapis.com/auth/drive.file',
  _token: null,
  _sessionLoaded: false,
  _restoringSession: false,
  guestMode: false,

  // Initialize Google Drive API
  init() {
    console.log('[PP-AUTH] Initializing Google Drive integration');
    // In a real implementation, this would load the Google API client
    return Promise.resolve();
  },

  // Check if user is signed in
  isSignedIn() {
    return this._sessionLoaded && !!this._token;
  },

  // Show login button
  _showLoginBtn() {
    console.log('[PP-AUTH] _showLoginBtn chamado | guestMode=', this.guestMode, '| restoringSession=', this._restoringSession, '| sessionLoaded=', this._sessionLoaded);
    const btnWrap = document.getElementById('login-btn-wrap');
    if (btnWrap) {
      // Show login buttons if not in guest mode and no session
      if (!this.guestMode && !this._sessionLoaded && !this._restoringSession) {
        btnWrap.style.display = 'flex';
      } else {
        btnWrap.style.display = 'none';
      }
    }
  },

  // Sign in with Google
  signIn() {
    console.log('[PP-AUTH] SignIn initiated');
    // In a real implementation, this would use Google OAuth 2.0
    // For now, we'll simulate the process
    return new Promise((resolve, reject) => {
      // Simulate async process
      setTimeout(() => {
        try {
          // Simulate successful authentication
          const fakeToken = {
            access_token: 'fake_access_token_' + Date.now(),
            expires_in: 3600,
            scope: this._scope,
            token_type: 'Bearer'
          };

          this._token = fakeToken;
          this._sessionLoaded = true;
          this._restoringSession = false;

          // Save session to localStorage
          const sessionData = {
            token: this._token,
            expires: Date.now() + (this._token.expires_in * 1000)
          };
          localStorage.setItem('pp_session', JSON.stringify(sessionData));

          console.log('[PP-AUTH] SignIn successful');
          this._showLoginBtn(); // Hide login button
          resolve(fakeToken);
        } catch (error) {
          console.error('[PP-AUTH] SignIn failed:', error);
          reject(error);
        }
      }, 1000);
    });
  },

  // Sign out
  signOut() {
    console.log('[PP-AUTH] SignOut initiated');
    this._token = null;
    this._sessionLoaded = false;
    this._restoringSession = false;

    // Clear session from localStorage
    localStorage.removeItem('pp_session');

    // Show login button again
    this._showLoginBtn();

    return Promise.resolve();
  },

  // Restore session from token
  restoreSession() {
    console.log('[PP-AUTH] Attempting to restore session');
    this._restoringSession = true;

    return new Promise((resolve, reject) => {
      // Simulate async process
      setTimeout(() => {
        try {
          const sessionData = localStorage.getItem('pp_session');
          if (sessionData) {
            const parsed = JSON.parse(sessionData);

            // Check if token is still valid
            if (parsed.token && parsed.expires > Date.now()) {
              this._token = parsed.token;
              this._sessionLoaded = true;
              this._restoringSession = false;

              console.log('[PP-AUTH] Session restored successfully');
              this._showLoginBtn(); // Hide login button
              resolve(this._token);
            } else {
              // Token expired or invalid
              this._sessionLoaded = false;
              this._restoringSession = false;
              this._showLoginBtn(); // Show login button
              resolve(null);
            }
          } else {
            this _sessionLoaded = false;
            this._restoringSession = false;
            this._showLoginBtn(); // Show login button
            resolve(null);
          }
        } catch (error) {
          console.error('[PP-AUTH] Session restore failed:', error);
          this._sessionLoaded = false;
          this._restoringSession = false;
          this._showLoginBtn(); // Show login button
          reject(error);
        }
      }, 1000);
    });
  },

  // Upload file to Google Drive
  uploadFile(file, metadata = {}) {
    console.log('[PP-AUTH] Uploading file to Google Drive:', file.name);

    if (!this.isSignedIn()) {
      return Promise.reject(new Error('User not signed in'));
    }

    // In a real implementation, this would use the Google Drive API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Simulate successful upload
          const fakeFileId = 'fake_file_id_' + Date.now();
          const response = {
            id: fakeFileId,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size
          };

          console.log('[PP-AUTH] File uploaded successfully:', response);
          resolve(response);
        } catch (error) {
          console.error('[PP-AUTH] File upload failed:', error);
          reject(error);
        }
      }, 1500);
    });
  },

  // Download file from Google Drive
  downloadFile(fileId) {
    console.log('[PP-AUTH] Downloading file from Google Drive:', fileId);

    if (!this.isSignedIn()) {
      return Promise.reject(new Error('User not signed in'));
    }

    // In a real implementation, this would use the Google Drive API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Simulate successful download
          const fakeBlob = new Blob(['Fake file content for ' + fileId], {
            type: 'application/octet-stream'
          });

          console.log('[PP-AUTH] File downloaded successfully');
          resolve(fakeBlob);
        } catch (error) {
          console.error('[PP-AUTH] File download failed:', error);
          reject(error);
        }
      }, 1500);
    });
  },

  // List files in Google Drive
  listFiles(params = {}) {
    console.log('[PP-AUTH] Listing files from Google Drive');

    if (!this.isSignedIn()) {
      return Promise.reject(new Error('User not signed in'));
    }

    // In a real implementation, this would use the Google Drive API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Simulate file listing
          const fakeFiles = [
            {
              id: 'file_1',
              name: 'backup_orcamentos.json',
              mimeType: 'application/json',
              size: 1024,
              modifiedTime: new Date().toISOString()
            },
            {
              id: 'file_2',
              name: 'backup_clientes.json',
              mimeType: 'application/json',
              size: 2048,
              modifiedTime: new Date(Date.now() - 86400000).toISOString() // Yesterday
            }
          ];

          console.log('[PP-AUTH] Files listed successfully');
          resolve(fakeFiles);
        } catch (error) {
          console.error('[PP-AUTH] File listing failed:', error);
          reject(error);
        }
      }, 1000);
    });
  }
};

// Guest mode function
function enterGuestMode() {
  console.log('[PP-AUTH] Entering guest mode');

  // Set the app to guest mode
  if (window.app && typeof window.app.setGuestMode === 'function') {
    window.app.setGuestMode(true);
  } else {
    // Fallback if app not yet initialized
    window.guestMode = true;
  }

  // Update UI to reflect guest mode
  const btnWrap = document.getElementById('login-btn-wrap');
  if (btnWrap) {
    btnWrap.style.display = 'none';
  }

  // Show welcome toast
  showToast('Bem-vindo ao modo visitante! Seus dados não serão salvos permanentemente.', 'info');
}

// Initialize GDrive on load
document.addEventListener('DOMContentLoaded', () => {
  GDrive.init().then(() => {
    // Try to restore session silently
    GDrive.restoreSession().then(() => {
      console.log('[PP-AUTH] Initialization complete');
    }).catch(error => {
      console.error('[PP-AUTH] Initialization error:', error);
    });
  });
});

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 16px;
    border-radius: 10px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    margin-top: 8px;
  `;

  const typeColors = {
    'info': '#3b82f6',
    'success': '#10b981',
    'warning': '#f59e0b',
    'error': '#ef4444'
  };

  toast.style.background = typeColors[type] || typeColors.info;

  const icons = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌'
  };

  toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations for toasts
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(toastStyle);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GDrive, enterGuestMode, showToast };
}