import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { Usuario, Orcamento, Cliente, ConfigEmpresa } from './types';

// AUTENTICAÇÃO
export const loginWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const registerWithEmail = async (email: string, password: string, userData: Omit<Usuario, 'uid' | 'email'>) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Atualizar perfil
  await updateProfile(user, {
    displayName: userData.nomeCompleto
  });
  
  // Salvar dados do usuário
  const usuario: Usuario = {
    uid: user.uid,
    email: user.email!,
    ...userData,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  
  await setDoc(doc(db, 'usuarios', user.uid), usuario);
  return userCredential;
};

export const logout = async () => {
  return await signOut(auth);
};

// USUÁRIO
export const getUsuario = async (uid: string): Promise<Usuario | null> => {
  const docRef = doc(db, 'usuarios', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Usuario : null;
};

export const updateUsuario = async (uid: string, data: Partial<Usuario>) => {
  const docRef = doc(db, 'usuarios', uid);
  await updateDoc(docRef, { ...data, lastLogin: new Date().toISOString() });
};

// ORÇAMENTOS
export const salvarOrcamento = async (uid: string, orcamento: Omit<Orcamento, 'id'> & { id?: string | number }) => {
  const colRef = collection(db, 'usuarios', uid, 'orcamentos');
  const { id, ...orcamentoData } = orcamento;
  if (id) {
    await updateDoc(doc(colRef, id.toString()), orcamentoData);
  } else {
    const docRef = await addDoc(colRef, orcamentoData);
    return docRef.id;
  }
};

export const listarOrcamentos = async (uid: string): Promise<Orcamento[]> => {
  const colRef = collection(db, 'usuarios', uid, 'orcamentos');
  const q = query(colRef, orderBy('dataCriacao', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Orcamento));
};

export const excluirOrcamento = async (uid: string, orcamentoId: string) => {
  const docRef = doc(db, 'usuarios', uid, 'orcamentos', orcamentoId);
  await deleteDoc(docRef);
};

// CLIENTES
export const salvarCliente = async (uid: string, cliente: Cliente) => {
  const colRef = collection(db, 'usuarios', uid, 'clientes');
  await addDoc(colRef, cliente);
};

export const listarClientes = async (uid: string): Promise<Cliente[]> => {
  const colRef = collection(db, 'usuarios', uid, 'clientes');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Cliente));
};

// CONFIGURAÇÕES
export const salvarConfig = async (uid: string, config: ConfigEmpresa) => {
  const docRef = doc(db, 'usuarios', uid, 'config', 'empresa');
  await setDoc(docRef, config);
};

export const getConfig = async (uid: string): Promise<ConfigEmpresa | null> => {
  const docRef = doc(db, 'usuarios', uid, 'config', 'empresa');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as ConfigEmpresa : null;
};