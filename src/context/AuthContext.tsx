import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSafe } from '../types';
import { isStaffOrAdmin } from '../utils/accessControl';

export interface ClientRegistrationData {
  name: string;
  companyName: string;
  nif: string;
  email: string;
  phone: string;
  password?: string;
  country?: string;
  category?: 'comercio' | 'servicos' | 'importacao' | 'industria' | 'liberal' | 'outro';
}

export interface StoredTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName?: string;
  nif?: string;
  planId: string;
  planName: string;
  amountKz: number;
  queriesGranted: number;
  validityDays: number;
  paymentMethod: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  paymentProofName?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Initial demo transactions so the admin has pending payments to approve immediately
export const INITIAL_TRANSACTIONS: StoredTransaction[] = [
  {
    id: 'tx_pay_001',
    userId: 'cli_001',
    userName: 'António Gaspar Ferreira',
    userEmail: 'comercial@ferreirafilhos.ao',
    companyName: 'Ferreira & Filhos Comércio Geral Lda',
    nif: '5412093847',
    planId: 'plan_gold',
    planName: 'Plano Ouro Pro (60 Consultas)',
    amountKz: 3000,
    queriesGranted: 60,
    validityDays: 30,
    paymentMethod: 'bank_transfer',
    paymentReference: 'BAI-COMP-2026-9921',
    paymentProofName: 'Comprovativo_BAI_3000Kz.pdf',
    notes: 'Transferência efetuada via BAI Directo para a conta NANUCLOUD.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  },
  {
    id: 'tx_pay_002',
    userId: 'cli_002',
    userName: 'Dra. Maria Eunice Santos',
    userEmail: 'maria.santos@santosconsultoria.co.ao',
    companyName: 'Santos & Associados Consultoria',
    nif: '5409281742',
    planId: 'plan_platinum',
    planName: 'Plano Platina Business (100 Consultas)',
    amountKz: 5000,
    queriesGranted: 100,
    validityDays: 30,
    paymentMethod: 'express_ref',
    paymentReference: 'MCX-REF-89421893',
    paymentProofName: 'Talão_Multicaixa_Express_5000Kz.jpg',
    notes: 'Pagamento efetuado no ATM Multicaixa Express.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
  },
  {
    id: 'tx_pay_003',
    userId: 'cli_003',
    userName: 'Eng. Carlos Alberto Mendes',
    userEmail: 'carlos.mendes@mendesimport.ao',
    companyName: 'Mendes Import & Export Transitários',
    nif: '5418829103',
    planId: 'plan_silver',
    planName: 'Plano Prata (30 Consultas)',
    amountKz: 1500,
    queriesGranted: 30,
    validityDays: 30,
    paymentMethod: 'bank_transfer',
    paymentReference: 'BFA-TRANSF-110293',
    paymentProofName: 'Talão_BFA_1500Kz.pdf',
    status: 'approved',
    reviewedByAdminName: 'Super Administrador NANUCLOUD',
    reviewedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
  }
];

export const DEMO_CLIENTS: UserSafe[] = [
  {
    id: 'cli_001',
    name: 'António Gaspar Ferreira',
    company: 'Ferreira & Filhos Comércio Geral Lda',
    nif: '5412093847',
    email: 'comercial@ferreirafilhos.ao',
    phone: '+244 923 456 789',
    country: 'Angola',
    role: 'client',
    clientCategory: 'comercio',
    isActive: true,
    activePlanId: 'plan_pro',
    activePlanName: 'Profissional Mensal',
    queriesRemaining: 184,
    totalQueriesUsed: 116,
    planExpiresAt: '2026-10-15T10:30:00Z',
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: false,
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-09-17T14:20:00Z',
    lastLoginAt: '2026-09-18T10:00:00Z'
  },
  {
    id: 'cli_002',
    name: 'Dra. Maria Eunice Santos',
    company: 'Santos & Associados Consultoria',
    nif: '5409281742',
    email: 'maria.santos@santosconsultoria.co.ao',
    phone: '+244 945 112 233',
    country: 'Angola',
    role: 'client',
    clientCategory: 'servicos',
    isActive: true,
    activePlanId: 'plan_enterprise',
    activePlanName: 'Empresarial Anual',
    queriesRemaining: 742,
    totalQueriesUsed: 258,
    planExpiresAt: '2027-02-01T09:15:00Z',
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: true,
    createdAt: '2026-02-01T09:15:00Z',
    updatedAt: '2026-09-18T08:10:00Z',
    lastLoginAt: '2026-09-18T08:10:00Z'
  },
  {
    id: 'cli_003',
    name: 'Eng. Carlos Alberto Mendes',
    company: 'Mendes Import & Export Transitários',
    nif: '5418829103',
    email: 'carlos.mendes@mendesimport.ao',
    phone: '+244 912 887 766',
    country: 'Angola',
    role: 'client',
    clientCategory: 'importacao',
    isActive: true,
    activePlanId: 'plan_pro',
    activePlanName: 'Profissional Mensal',
    queriesRemaining: 45,
    totalQueriesUsed: 255,
    planExpiresAt: '2026-10-10T11:00:00Z',
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: false,
    createdAt: '2026-03-10T11:00:00Z',
    updatedAt: '2026-09-16T17:45:00Z',
    lastLoginAt: '2026-09-16T17:45:00Z'
  },
  {
    id: 'cli_004',
    name: 'Teresa Cristina Neto',
    company: 'Boutique & Cosméticos Luanda',
    nif: '5420194831',
    email: 'loja@boutiqueluanda.com',
    phone: '+244 933 654 321',
    country: 'Angola',
    role: 'client',
    clientCategory: 'comercio',
    isActive: true,
    activePlanId: 'plan_starter',
    activePlanName: 'Básico Starter',
    queriesRemaining: 8,
    totalQueriesUsed: 42,
    planExpiresAt: '2026-09-30T16:00:00Z',
    isImportUnlocked: false,
    isBatchUnlocked: false,
    isApiUnlocked: false,
    createdAt: '2026-04-05T16:00:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
    lastLoginAt: '2026-09-15T12:00:00Z'
  }
];

export const SYSTEM_ADMIN_USER: UserSafe = {
  id: 'usr_admin_nanucloud',
  name: 'Super Administrador NANUCLOUD',
  email: 'admin@nanucloud.com',
  company: 'NANUCLOUD TECNOLOGIA LDA',
  nif: '5001294819',
  phone: '+244 954 269 353',
  country: 'Angola',
  role: 'super_admin',
  department: 'Direção Geral & Finanças',
  isActive: true,
  queriesRemaining: 999999,
  totalQueriesUsed: 0,
  activePlanId: 'plan_unlimited',
  activePlanName: 'Acesso Administrativo Irrestrito',
  planExpiresAt: null,
  isImportUnlocked: true,
  isBatchUnlocked: true,
  isApiUnlocked: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  lastLoginAt: '2026-09-18T12:00:00Z'
};

interface AuthContextType {
  currentUser: UserSafe | null;
  isLoggedIn: boolean;
  isClient: boolean;
  isAdmin: boolean;
  loginClient: (emailOrId: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerClient: (data: ClientRegistrationData, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  consumeCredit: (count?: number) => boolean;
  refreshUserData: () => void;
  transactions: StoredTransaction[];
  addTransaction: (tx: Omit<StoredTransaction, 'id' | 'createdAt' | 'status'>) => StoredTransaction;
  approvePaymentAndCreditClient: (txId: string, adminName: string) => { success: boolean; message: string };
  rejectPayment: (txId: string, reason: string, adminName: string) => { success: boolean; message: string };
  adjustClientCredits: (clientId: string, deltaQueries: number, reason: string) => { success: boolean; newTotal: number };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize clients in localStorage if not already present
  const getStoredClients = (): UserSafe[] => {
    const saved = localStorage.getItem('nanucloud_clients_db');
    if (!saved) {
      localStorage.setItem('nanucloud_clients_db', JSON.stringify(DEMO_CLIENTS));
      return DEMO_CLIENTS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEMO_CLIENTS;
    }
  };

  // Initialize transactions in localStorage
  const getStoredTransactions = (): StoredTransaction[] => {
    const saved = localStorage.getItem('nanucloud_transactions_db');
    if (!saved) {
      localStorage.setItem('nanucloud_transactions_db', JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  };

  const [transactions, setTransactions] = useState<StoredTransaction[]>(getStoredTransactions);

  // Active user session
  const [currentUser, setCurrentUser] = useState<UserSafe | null>(() => {
    const savedSession = localStorage.getItem('nanucloud_current_user');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch {
        return null;
      }
    }
    // Default to first demo client so users immediately experience the purchased balance & profile workflow
    return DEMO_CLIENTS[0];
  });

  const saveTransactions = (txList: StoredTransaction[]) => {
    setTransactions(txList);
    localStorage.setItem('nanucloud_transactions_db', JSON.stringify(txList));
    window.dispatchEvent(new CustomEvent('nanucloud_transactions_updated'));
  };

  // Sync current user state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nanucloud_current_user', JSON.stringify(currentUser));
      localStorage.setItem('nanucloud_user_role', currentUser.role);
    } else {
      localStorage.removeItem('nanucloud_current_user');
      localStorage.removeItem('nanucloud_user_role');
    }
  }, [currentUser]);

  // Listen for storage events (e.g. if another tab or admin changes balance)
  useEffect(() => {
    const handleBalanceSync = () => {
      refreshUserData();
      setTransactions(getStoredTransactions());
    };
    window.addEventListener('nanucloud_clients_updated', handleBalanceSync);
    window.addEventListener('nanucloud_transactions_updated', handleBalanceSync);
    return () => {
      window.removeEventListener('nanucloud_clients_updated', handleBalanceSync);
      window.removeEventListener('nanucloud_transactions_updated', handleBalanceSync);
    };
  }, [currentUser?.id]);

  const refreshUserData = () => {
    if (!currentUser) return;
    if (isStaffOrAdmin(currentUser.role)) {
      return;
    }
    const clients = getStoredClients();
    const found = clients.find(c => c.id === currentUser.id || c.email.toLowerCase() === currentUser.email.toLowerCase());
    if (found) {
      setCurrentUser(found);
    }
  };

  const loginClient = async (emailOrId: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailOrId, password })
      });

      const data = await response.json();
      if (response.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('nanucloud_jwt_token', data.token);
        }
        setCurrentUser(data.user);
        
        // Cache user in local database store
        const clients = getStoredClients();
        const updated = clients.some(c => c.id === data.user.id)
          ? clients.map(c => c.id === data.user.id ? data.user : c)
          : [data.user, ...clients];
        localStorage.setItem('nanucloud_clients_db', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));

        return { success: true };
      } else if (response.status === 401 || response.status === 400 || response.status === 403) {
        return { success: false, error: data.error || 'Credenciais inválidas.' };
      }
    } catch {
      // Fallback local em caso de perda temporária de rede
    }

    // Fallback local de contingência
    const clients = getStoredClients();
    const query = emailOrId.toLowerCase().trim();
    const client = clients.find(c => c.id === query || c.email.toLowerCase() === query || c.nif === query);
    
    if (!client) {
      return { success: false, error: 'Utilizador não encontrado com este email ou NIF.' };
    }
    if (!client.isActive) {
      return { success: false, error: 'Esta conta de utilizador encontra-se suspensa. Contacte o suporte.' };
    }

    const updated = { ...client, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updated);
    
    const allClients = clients.map(c => c.id === client.id ? updated : c);
    localStorage.setItem('nanucloud_clients_db', JSON.stringify(allClients));

    return { success: true };
  };

  const loginAdmin = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('nanucloud_jwt_token', data.token);
        }
        setCurrentUser(data.user);
        return { success: true };
      } else if (response.status === 401 || response.status === 403 || response.status === 400) {
        return { success: false, error: data.error || 'Credenciais administrativas inválidas.' };
      }
    } catch {
      // Fallback local
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminUser = {
      ...SYSTEM_ADMIN_USER,
      email: cleanEmail.includes('@') ? cleanEmail : SYSTEM_ADMIN_USER.email,
      lastLoginAt: new Date().toISOString()
    };
    setCurrentUser(adminUser);
    return { success: true };
  };

  const registerClient = async (data: ClientRegistrationData, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!data.companyName?.trim() || !data.email?.trim() || !data.nif?.trim()) {
      return { success: false, error: 'Por favor preencha Empresa, Email e NIF.' };
    }

    const passToUse = password || data.password || 'cliente123';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          password: passToUse
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.user) {
        if (resData.token) {
          localStorage.setItem('nanucloud_jwt_token', resData.token);
        }
        setCurrentUser(resData.user);
        const clients = getStoredClients();
        const updated = [resData.user, ...clients];
        localStorage.setItem('nanucloud_clients_db', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));
        return { success: true };
      } else if (response.status >= 400 && resData.error) {
        return { success: false, error: resData.error };
      }
    } catch {
      // Fallback local
    }

    const clients = getStoredClients();
    const exists = clients.some(c => c.email.toLowerCase() === data.email.toLowerCase().trim());
    if (exists) {
      return { success: false, error: 'Já existe um utilizador registado com este endereço de email.' };
    }

    const newId = `cli_${Date.now()}`;
    const newClient: UserSafe = {
      id: newId,
      name: data.name?.trim() || data.companyName.trim(),
      company: data.companyName.trim(),
      nif: data.nif.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || '+244 923 000 000',
      country: data.country || 'Angola',
      role: 'client',
      clientCategory: data.category || 'comercio',
      isActive: true,
      activePlanId: 'plan_starter',
      activePlanName: 'Adesão Inicial (5 Consultas)',
      queriesRemaining: 5,
      totalQueriesUsed: 0,
      planExpiresAt: null,
      isImportUnlocked: false,
      isBatchUnlocked: false,
      isApiUnlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const updated = [newClient, ...clients];
    localStorage.setItem('nanucloud_clients_db', JSON.stringify(updated));
    setCurrentUser(newClient);
    window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));

    return { success: true };
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('nanucloud_jwt_token');
    setCurrentUser(null);
  };

  const consumeCredit = (count: number = 1): boolean => {
    if (!currentUser) return false;
    
    // Admins and staff have unlimited simulations
    if (isStaffOrAdmin(currentUser.role)) {
      return true;
    }

    if (currentUser.queriesRemaining < count) {
      return false;
    }

    const newQueriesRemaining = currentUser.queriesRemaining - count;
    const newQueriesUsed = (currentUser.totalQueriesUsed || 0) + count;

    const updatedUser = {
      ...currentUser,
      queriesRemaining: newQueriesRemaining,
      totalQueriesUsed: newQueriesUsed,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);

    // Sync into clients database in localStorage
    const clients = getStoredClients();
    const updatedClients = clients.map(c => c.id === currentUser.id ? updatedUser : c);
    localStorage.setItem('nanucloud_clients_db', JSON.stringify(updatedClients));
    window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));

    return true;
  };

  // Add transaction when client places an order
  const addTransaction = (txData: Omit<StoredTransaction, 'id' | 'createdAt' | 'status'>): StoredTransaction => {
    const newTx: StoredTransaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updated = [newTx, ...transactions];
    saveTransactions(updated);
    return newTx;
  };

  // Administrative approval: confirms payment and adds credits to client
  const approvePaymentAndCreditClient = (txId: string, adminName: string): { success: boolean; message: string } => {
    const txIndex = transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) {
      return { success: false, message: 'Transação não encontrada.' };
    }

    const tx = transactions[txIndex];
    if (tx.status === 'approved') {
      return { success: false, message: 'Este pagamento já foi aprovado anteriormente.' };
    }

    const updatedTx: StoredTransaction = {
      ...tx,
      status: 'approved',
      reviewedByAdminName: adminName,
      reviewedAt: new Date().toISOString()
    };

    const newTxList = [...transactions];
    newTxList[txIndex] = updatedTx;
    saveTransactions(newTxList);

    // Credit client balance
    const clients = getStoredClients();
    const clientIndex = clients.findIndex(c => c.id === tx.userId || c.email.toLowerCase() === tx.userEmail.toLowerCase());

    if (clientIndex >= 0) {
      const targetClient = clients[clientIndex];
      const newQueries = (targetClient.queriesRemaining || 0) + tx.queriesGranted;
      
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + (tx.validityDays || 30));

      const updatedClient: UserSafe = {
        ...targetClient,
        queriesRemaining: newQueries,
        activePlanId: tx.planId,
        activePlanName: tx.planName,
        planExpiresAt: expDate.toISOString(),
        isActive: true,
        isImportUnlocked: true,
        isBatchUnlocked: true,
        updatedAt: new Date().toISOString()
      };

      clients[clientIndex] = updatedClient;
      localStorage.setItem('nanucloud_clients_db', JSON.stringify(clients));

      // If the current logged-in client is this client, update session immediately
      if (currentUser && (currentUser.id === targetClient.id || currentUser.email.toLowerCase() === targetClient.email.toLowerCase())) {
        setCurrentUser(updatedClient);
      }

      window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));

      return {
        success: true,
        message: `Pagamento aprovado! Foram creditadas +${tx.queriesGranted} consultas ao utilizador ${targetClient.company || targetClient.name}.`
      };
    }

    return {
      success: true,
      message: `Pagamento validado, mas utilizador não foi localizado na base para crédito automático.`
    };
  };

  // Administrative rejection
  const rejectPayment = (txId: string, reason: string, adminName: string): { success: boolean; message: string } => {
    const txIndex = transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) {
      return { success: false, message: 'Transação não encontrada.' };
    }

    const tx = transactions[txIndex];
    const updatedTx: StoredTransaction = {
      ...tx,
      status: 'rejected',
      rejectionReason: reason,
      reviewedByAdminName: adminName,
      reviewedAt: new Date().toISOString()
    };

    const newTxList = [...transactions];
    newTxList[txIndex] = updatedTx;
    saveTransactions(newTxList);

    return { success: true, message: `Pagamento rejeitado. Motivo: ${reason}` };
  };

  // Manual Credit Adjustment (Add or Reduce) by Administrator
  const adjustClientCredits = (clientId: string, deltaQueries: number, reason: string): { success: boolean; newTotal: number } => {
    const clients = getStoredClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx === -1) return { success: false, newTotal: 0 };

    const client = clients[idx];
    const newTotal = Math.max(0, (client.queriesRemaining || 0) + deltaQueries);
    const updatedClient: UserSafe = {
      ...client,
      queriesRemaining: newTotal,
      updatedAt: new Date().toISOString()
    };

    clients[idx] = updatedClient;
    localStorage.setItem('nanucloud_clients_db', JSON.stringify(clients));

    if (currentUser && currentUser.id === clientId) {
      setCurrentUser(updatedClient);
    }

    window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));
    return { success: true, newTotal };
  };

  const isClient = currentUser?.role === 'client' || (!isStaffOrAdmin(currentUser?.role) && !!currentUser);
  const isAdmin = isStaffOrAdmin(currentUser?.role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !!currentUser,
        isClient,
        isAdmin,
        loginClient,
        loginAdmin,
        registerClient,
        logout,
        consumeCredit,
        refreshUserData,
        transactions,
        addTransaction,
        approvePaymentAndCreditClient,
        rejectPayment,
        adjustClientCredits
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
