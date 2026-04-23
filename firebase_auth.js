const firebaseConfig = {
  apiKey: 'AIzaSyBYhZ_PpDXP3n-iz8tJ-Too7gZ-NGTV1cQ',
  authDomain: 'pintor-plus.firebaseapp.com',
  projectId: 'pintor-plus',
  storageBucket: 'pintor-plus.firebasestorage.app',
  messagingSenderId: '674658993270',
  appId: '1:674658993270:web:455bf0095497544c108b57',
  measurementId: 'G-W4Q48K391V'
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const dbFS = firebase.firestore();

const PP_Auth = {
  provider: null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this.provider = new firebase.auth.GoogleAuthProvider();
    this.provider.addScope('https://www.googleapis.com/auth/drive.appdata');
    this.provider.addScope('https://www.googleapis.com/auth/drive.file');
    this.provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    this.provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    this.provider.addScope('https://www.googleapis.com/auth/calendar.events');
    this.provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    if (typeof PP_Sync !== 'undefined') {
      PP_Sync.init(dbFS);
    }

    auth.getRedirectResult().then((result) => {
      this._captureCredential(result);
    }).catch((error) => {
      console.error('[PP-AUTH] Erro ao concluir redirect:', error);
      if (typeof GDrive !== 'undefined' && !GDrive._sessionLoaded && !GDrive.guestMode) {
        GDrive._showLoginBtn();
      }
    });

    auth.onAuthStateChanged((user) => {
      console.log('[PP-AUTH] onAuthStateChanged | email:', user?.email || 'sem usuário');
      if (user) {
        this._handleUser(user);
      } else {
        this._handleLogout();
      }
    });
  },

  _captureCredential(result) {
    if (!result) return null;
    const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (token) {
      localStorage.setItem('pp-gdrive-at', token);
      if (typeof GDrive !== 'undefined') {
        GDrive.accessToken = token;
      }
    }
    return token;
  },

  async signIn(options = {}) {
    try {
      const result = await auth.signInWithPopup(this.provider);
      this._captureCredential(result);
      return result;
    } catch (error) {
      console.error('[PP-AUTH] Erro no login:', error);
      if (error.code === 'auth/popup-closed-by-user') return null;
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        if (typeof GDrive !== 'undefined' && typeof GDrive._showPopupBlockedMsg === 'function') {
          GDrive._showPopupBlockedMsg();
        }
        try {
          await auth.signInWithRedirect(this.provider);
          return null;
        } catch (redirectError) {
          console.error('[PP-AUTH] Erro no redirect:', redirectError);
          if (typeof toast === 'function') {
            toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Não foi possível iniciar o login com Google.');
          }
        }
        return null;
      }
      if (typeof toast === 'function') {
        toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Erro ao entrar com Google.');
      }
      return null;
    }
  },

  async signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('[PP-AUTH] Erro no logout:', error);
      throw error;
    }
  },

  _handleUser(user) {
    if (typeof GDrive === 'undefined') return;

    if (GDrive.guestMode) {
      GDrive.guestMode = false;
      localStorage.removeItem('pp-guest-mode');
      if (typeof _hideGuestBanner === 'function') _hideGuestBanner();
    }

    const session = {
      name: user.displayName || '',
      email: user.email || '',
      picture: user.photoURL || ''
    };

    GDrive.user = session;
    GDrive._sessionLoaded = true;
    GDrive._restoringSession = false;
    localStorage.setItem('pp-session', JSON.stringify(session));
    if (session.email) {
      localStorage.setItem('pp-gdrive-email', session.email);
    }

    const savedToken = localStorage.getItem('pp-gdrive-at');
    if (!GDrive.accessToken && savedToken) {
      GDrive.accessToken = savedToken;
    }

    GDrive._showLoggedIn();

    if (_hasAcceptedTerms(session.email)) {
      showPage('pg-home');
      renderHomeMini();
      renderHomeEvents();
      renderHomeNews();
    } else {
      showTermsModal();
    }

    if (typeof PP_Sync !== 'undefined') {
      PP_Sync.setUser(user.uid);
    }

    if (GDrive.accessToken) {
      GDrive._findFile().catch((e) => console.warn('[PP-AUTH] Falha ao reconectar Drive:', e?.message || e));
      if (typeof PP_Sync !== 'undefined') {
        PP_Sync.downloadAll().catch((e) => console.warn('[PP-AUTH] Sync download falhou:', e?.message || e));
      }
    } else {
      GDrive._setStatus('off', 'Login ativo — toque em sincronizar para reconectar o Drive');
    }
  },

  _handleLogout() {
    localStorage.removeItem('pp-gdrive-at');
    if (typeof PP_Sync !== 'undefined') {
      PP_Sync.clearUser();
    }
    if (typeof GDrive === 'undefined') return;
    if (GDrive.guestMode || localStorage.getItem('pp-guest-mode') === '1') {
      GDrive.guestMode = true;
      if (typeof _showGuestBanner === 'function') _showGuestBanner();
      return;
    }
    if (GDrive._sessionLoaded || GDrive.user || localStorage.getItem('pp-session')) {
      GDrive.signOut({ skipFirebase: true, silent: true });
    }
    GDrive._showLoginBtn();
  }
};

PP_Auth.init();
