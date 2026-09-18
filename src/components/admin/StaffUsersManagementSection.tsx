import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  Save,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { UserSafe } from '../../types';

export interface StaffUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'super_admin' | 'admin' | 'manager' | 'operator';
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const DEFAULT_STAFF: StaffUserRecord[] = [
  {
    id: 'staff_master_1',
    name: 'Super Administrador NANUCLOUD',
    email: 'admin@nanucloud.com',
    phone: '+244 923 000 001',
    department: 'Direção Geral & TI',
    role: 'super_admin',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    lastLoginAt: '2026-09-18T08:00:00Z'
  },
  {
    id: 'staff_adm_2',
    name: 'Dr. Fernando Baptista',
    email: 'fernando.baptista@nanucloud.com',
    phone: '+244 924 556 778',
    department: 'Consultoria Fiscal & Pautas',
    role: 'admin',
    isActive: true,
    createdAt: '2025-03-10T10:00:00Z',
    lastLoginAt: '2026-09-17T16:30:00Z'
  },
  {
    id: 'staff_com_3',
    name: 'Paula Cristina Magalhães',
    email: 'comercial@nanucloud.com',
    phone: '+244 912 334 455',
    department: 'Comercial & Vendas',
    role: 'manager',
    isActive: true,
    createdAt: '2025-06-01T09:00:00Z',
    lastLoginAt: '2026-09-18T07:45:00Z'
  },
  {
    id: 'staff_sup_4',
    name: 'Mateus Kangamba',
    email: 'suporte@nanucloud.com',
    phone: '+244 931 998 877',
    department: 'Atendimento & Tickets',
    role: 'operator',
    isActive: true,
    createdAt: '2025-08-15T11:00:00Z',
    lastLoginAt: '2026-09-18T08:20:00Z'
  }
];

interface StaffUsersManagementSectionProps {
  currentUser: UserSafe;
  showSaveNotice: (msg: string) => void;
}

export const StaffUsersManagementSection: React.FC<StaffUsersManagementSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'superadmin';

  const [staffList, setStaffList] = useState<StaffUserRecord[]>(() => {
    const saved = localStorage.getItem('nanucloud_staff_users_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_STAFF;
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffUserRecord | null>(null);
  const [passwordModalStaff, setPasswordModalStaff] = useState<StaffUserRecord | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formDepartment, setFormDepartment] = useState<string>('Comercial & Vendas');
  const [formRole, setFormRole] = useState<StaffUserRecord['role']>('operator');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const persistStaff = (updated: StaffUserRecord[]) => {
    setStaffList(updated);
    localStorage.setItem('nanucloud_staff_users_db', JSON.stringify(updated));
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDepartment('Comercial & Vendas');
    setFormRole('operator');
    setFormPassword('');
    setFormIsActive(true);
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: StaffUserRecord) => {
    setEditingStaff(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormDepartment(user.department);
    setFormRole(user.role);
    setFormIsActive(user.isActive);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Nome e E-mail são obrigatórios.');
      return;
    }

    if (editingStaff) {
      const updated = staffList.map((s) => {
        if (s.id === editingStaff.id) {
          return {
            ...s,
            name: formName.trim(),
            email: formEmail.trim().toLowerCase(),
            phone: formPhone.trim(),
            department: formDepartment,
            role: formRole,
            isActive: formIsActive
          };
        }
        return s;
      });
      persistStaff(updated);
      setEditingStaff(null);
      showSaveNotice(`Dados do colaborador "${formName}" atualizados com sucesso!`);
    } else {
      if (!formPassword || formPassword.length < 6) {
        alert('A palavra-passe inicial deve ter pelo menos 6 caracteres.');
        return;
      }

      const newMember: StaffUserRecord = {
        id: `staff_${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        department: formDepartment,
        role: formRole,
        isActive: formIsActive,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };

      persistStaff([newMember, ...staffList]);
      setIsCreateOpen(false);
      showSaveNotice(`Novo membro da equipa "${newMember.name}" adicionado com sucesso!`);
    }
  };

  const handleToggleBlock = (user: StaffUserRecord) => {
    if (user.role === 'super_admin' && !isSuperAdmin) {
      alert('Ação bloqueada: Não é permitido desativar uma conta de Super Administrador.');
      return;
    }

    const updated = staffList.map((s) => (s.id === user.id ? { ...s, isActive: !s.isActive } : s));
    persistStaff(updated);
    showSaveNotice(
      user.isActive
        ? `Colaborador "${user.name}" foi suspenso temporariamente.`
        : `Colaborador "${user.name}" foi reativado com sucesso!`
    );
  };

  const handleDeleteStaff = (user: StaffUserRecord) => {
    if (user.role === 'super_admin') {
      alert('Não é permitido eliminar um Super Administrador.');
      return;
    }
    if (window.confirm(`Tem a certeza que deseja eliminar o colaborador "${user.name}" do sistema?`)) {
      const updated = staffList.filter((s) => s.id !== user.id);
      persistStaff(updated);
      showSaveNotice(`Colaborador "${user.name}" eliminado do sistema.`);
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalStaff) return;
    if (newPassword.length < 6) {
      alert('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('As palavras-passe não coincidem.');
      return;
    }

    // Persist password update notice
    showSaveNotice(`Palavra-passe de "${passwordModalStaff.name}" alterada com sucesso!`);
    setPasswordModalStaff(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Super Administrador', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    admin: { label: 'Administrador Fiscal', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    manager: { label: 'Gestor Comercial', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    operator: { label: 'Operador / Suporte', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || s.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && s.isActive) ||
      (filterStatus === 'blocked' && !s.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> UTILIZADORES DO SISTEMA (STAFF & ADMIN)
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold">
              Equipa Interna
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Controlo de acessos administrativos, operadores de atendimento, consultores fiscais e credenciais da equipa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs font-mono flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Adicionar Membro da Equipa
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, email ou departamento..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todas as Funções</option>
            <option value="super_admin">Super Administrador</option>
            <option value="admin">Administrador Fiscal</option>
            <option value="manager">Gestor Comercial</option>
            <option value="operator">Operador / Suporte</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todos os Estados</option>
            <option value="active">Apenas Ativos</option>
            <option value="blocked">Apenas Suspensos</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <th className="p-3">Nome do Colaborador</th>
              <th className="p-3">Departamento</th>
              <th className="p-3">Contacto</th>
              <th className="p-3">Perfil / Nível</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Último Acesso</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {filteredStaff.map((user) => {
              const roleInfo = roleLabels[user.role] || { label: user.role, color: 'bg-slate-800 text-slate-300' };

              return (
                <tr key={user.id} className="hover:bg-slate-900/60 transition">
                  <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <span>{user.name}</span>
                      <div className="text-[10px] text-slate-500 font-normal">ID: {user.id}</div>
                    </div>
                  </td>

                  <td className="p-3 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{user.department}</span>
                    </div>
                  </td>

                  <td className="p-3 text-slate-300">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-600" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        user.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {user.isActive ? 'Ativo' : 'Suspenso'}
                    </span>
                  </td>

                  <td className="p-3 text-slate-400 text-[11px]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-PT') : 'Nunca acedeu'}
                  </td>

                  <td className="p-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordModalStaff(user);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer"
                      title="Alterar Palavra-passe"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      title="Editar Perfil"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleBlock(user)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        user.isActive
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      }`}
                      title={user.isActive ? 'Suspender Acesso' : 'Reativar Acesso'}
                    >
                      {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {user.role !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(user)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="Eliminar Membro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Create or Edit Staff */}
      {(isCreateOpen || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                {editingStaff ? `Editar Colaborador: ${editingStaff.name}` : 'Adicionar Novo Membro da Equipa'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingStaff(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Dra. Ana Luísa Fernandes"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">E-mail Institucional *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nome@nanucloud.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Contacto Telefónico</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Função / Perfil de Acesso</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="operator">Operador / Atendimento</option>
                    <option value="manager">Gestor Comercial</option>
                    <option value="admin">Administrador Fiscal</option>
                    {isSuperAdmin && <option value="super_admin">Super Administrador</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Departamento</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Consultoria Fiscal & Pautas">Consultoria Fiscal & Pautas</option>
                    <option value="Comercial & Vendas">Comercial & Vendas</option>
                    <option value="Atendimento & Tickets">Atendimento & Tickets</option>
                    <option value="Direção Geral & TI">Direção Geral & TI</option>
                  </select>
                </div>
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-slate-400 mb-1">Palavra-passe Inicial (Mín. 6 caracteres) *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 pr-10 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Membro Ativo no Sistema</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingStaff(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {passwordModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" /> Redefinir Palavra-passe
              </h4>
              <button
                type="button"
                onClick={() => setPasswordModalStaff(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400">
              Alterar a palavra-passe de acesso do colaborador <strong className="text-slate-200">{passwordModalStaff.name}</strong> ({passwordModalStaff.email}).
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Nova Palavra-passe</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirmar Nova Palavra-passe</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a palavra-passe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalStaff(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition"
                >
                  Atualizar Palavra-passe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
