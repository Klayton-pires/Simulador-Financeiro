import React from 'react';
import {
  X,
  Building,
  User,
  Hash,
  Mail,
  Phone,
  Coins,
  Gem,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  LogOut,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans: () => void;
  onOpenSupportChat?: () => void;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPlans,
  onOpenSupportChat
}) => {
  const { currentUser, logout, transactions, refreshUserData } = useAuth();

  if (!isOpen || !currentUser) return null;

  // Transactions belonging to this client
  const clientTransactions = transactions.filter(
    (t) =>
      t.userId === currentUser.id ||
      t.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const pendingCount = clientTransactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#1E293B] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden font-sans my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">
                  {currentUser.company || currentUser.name}
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                  Utilizador Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Perfil Empresarial, Saldo de Créditos e Histórico de Pagamentos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshUserData()}
              title="Atualizar dados e saldo"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* MAIN BALANCE & PLAN BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Coins className="w-4 h-4 text-amber-400" /> Saldo Comprado para Simulações
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {currentUser.queriesRemaining.toLocaleString('pt-PT')}
                  </span>
                  <span className="text-sm font-mono text-slate-300 font-bold">Consultas / Créditos Disponíveis</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-indigo-300">
                    <Gem className="w-3.5 h-3.5" /> Plano: <strong>{currentUser.activePlanName || 'Plano Base'}</strong>
                  </span>
                  {currentUser.planExpiresAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Validade:{' '}
                      {new Date(currentUser.planExpiresAt).toLocaleDateString('pt-PT')}
                    </span>
                  )}
                  <span>• Utilizadas: {currentUser.totalQueriesUsed || 0} simulações</span>
                </div>
              </div>

              {/* Action: Buy / Recharge Plan */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPlans();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Escolher Plano / Comprar Crédito</span>
                </button>
                {pendingCount > 0 && (
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" /> {pendingCount} pagamento aguarda confirmação
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COMPANY DETAILS GRID */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" /> Dados Cadastrais da Empresa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Razão Social</span>
                <strong className="text-slate-200">{currentUser.company || 'N/A'}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">NIF Fiscal</span>
                <strong className="text-indigo-300 font-bold">{currentUser.nif || 'Não informado'}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Titular / Responsável</span>
                <strong className="text-slate-200">{currentUser.name}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Email Comercial</span>
                <strong className="text-slate-200 truncate block">{currentUser.email}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Telefone</span>
                <strong className="text-slate-200">{currentUser.phone || 'Não informado'}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">País / Jurisdição</span>
                <strong className="text-slate-200">{currentUser.country || 'Angola'}</strong>
              </div>
            </div>
          </div>

          {/* UNLOCKED MODULES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Acesso aos Módulos do Sistema
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Vendas Comerciais</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Prestação de Serviços</span>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                currentUser.isImportUnlocked
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                {currentUser.isImportUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0 text-slate-600" />
                )}
                <span>Importação Aduaneira</span>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                currentUser.isBatchUnlocked
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                {currentUser.isBatchUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0 text-slate-600" />
                )}
                <span>Lotes Excel (.xlsx)</span>
              </div>
            </div>
          </div>

          {/* PAYMENT ORDERS & BALANCE RECHARGE HISTORY */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Histórico de Compras & Estado do Pagamento
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {clientTransactions.length} registo(s)
              </span>
            </div>

            {clientTransactions.length === 0 ? (
              <div className="text-center py-6 bg-slate-950 rounded-xl border border-dashed border-slate-800">
                <Coins className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400">Ainda não realizou nenhum pedido de plano.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPlans();
                  }}
                  className="mt-3 text-xs font-mono text-indigo-400 hover:text-indigo-300 underline font-bold"
                >
                  Adquirir o seu primeiro plano de consultas →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clientTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-200">{tx.planName}</strong>
                        <span className="text-slate-400 text-[11px]">
                          ({tx.amountKz.toLocaleString('pt-PT')} Kz)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                        <span>Método: {tx.paymentMethod}</span>
                        {tx.paymentReference && <span>Ref: {tx.paymentReference}</span>}
                        <span>Data: {new Date(tx.createdAt).toLocaleDateString('pt-PT')}</span>
                      </div>
                      {tx.paymentProofName && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Comprovativo anexado: {tx.paymentProofName}</span>
                        </div>
                      )}
                    </div>

                    {/* Transaction Status Badge */}
                    <div className="shrink-0">
                      {tx.status === 'pending' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <div>
                            <span className="font-bold block">Pendente de Confirmação</span>
                            <span className="text-[9px] text-amber-400/80">Aguardando aprovação administrativa</span>
                          </div>
                        </div>
                      )}
                      {tx.status === 'approved' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <div>
                            <span className="font-bold block">Confirmado & Creditado</span>
                            <span className="text-[9px] text-emerald-400/80">+{tx.queriesGranted} consultas adicionadas</span>
                          </div>
                        </div>
                      )}
                      {tx.status === 'rejected' && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <div>
                            <span className="font-bold block">Pagamento Rejeitado</span>
                            <span className="text-[9px] text-rose-400/80">{tx.rejectionReason || 'Comprovativo não validado'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenSupportChat) onOpenSupportChat();
            }}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Falar com o Suporte / Administrativo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminar Sessão</span>
          </button>
        </div>

      </div>
    </div>
  );
};
