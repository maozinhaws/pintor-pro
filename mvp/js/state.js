export const AppState = {
  currentView: null,

  // Budget form scratch state
  draftOrc: null,
  draftItems: [],
  editingOrcId: null,

  // Item modal scratch state
  editingItemId: null,
  modalPhotos: [],
  modalServices: [],

  // Client form
  editingClienteId: null,

  // Camera
  cameraStream: null,
  cameraTarget: null, // 'item-modal'

  // Config (loaded from DB on boot)
  config: {
    empresa: '',
    tel: '',
    emailEmpresa: '',
    endEmpresa: '',
    doc: ''
  }
};
