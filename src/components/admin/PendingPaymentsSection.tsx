import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building,
  User,
  Hash,
  Mail,
  Coins,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth, StoredTransaction } from '../../context/AuthContext';
import { UserSafe } from '../../types';

interface PendingPaymentsSectionProps {
  currentUser: UserSafe;
  showSaveNotice?: (msg: string) => void;
}

export const PendingPaymentsSection: React.FC<PendingPaymentsSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const { transactions, approvePaymentAndCreditClient, rejectPayment } = useAuth();

  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Proof Modal
  const [viewingProofTx, setViewingProofTx] = useState<StoredTransaction | null>(null);

  const pendingList = transactions.filter((t) => t.status === 'pending');
  const approvedList = transactions.filter((t) => t.status === 'approved');
  const rejectedList = transactions.filter((t) => t.status === 'rejected');

  const totalRevenueKz = approvedList.reduce((acc, t) => acc + t.amountKz, 0);
  const totalQueriesIssued = approvedList.reduce((acc, t) => acc + t.queriesGranted, 0);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        tx.userName.toLowerCase().includes(q) ||
        tx.userEmail.toLowerCase().includes(q) ||
        (tx.companyName && tx.companyName.toLowerCase().includes(q)) ||
        (tx.paymentReference && tx.paymentReference.toLowerCase().includes(q)) ||
        tx.planName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleApprove = (tx: StoredTransaction) => {
    const res = approvePaymentAndCreditClient(tx.id, currentUser.name);
    if (res.success) {
      if (showSaveNotice) showSaveNotice(res.message);
    }
  };

  const handleConfirmReject = (txId: string) => {
    if (!rejectionReason.trim()) {
      alert('Por favor informe o motivo da rejeição do pagamento.');
      return;
    }
    const res = rejectPayment(txId, rejectionReason.trim(), currentUser.name);
    if (res.success) {
      if (showSaveNotice) showSaveNotice(res.message);
      setRejectingTxId(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> VALIDAÇÃO DE PAGAMENTOS & ATIVAÇÃO DE CRÉDITOS
            </h3>
            {pendingList.length > 0 && (
              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                {pendingList.length} Pendente{pendingList.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Conferência de comprovativos de transferência e Multicaixa. A confirmação adiciona créditos e ativa o plano do cliente imediatamente.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl font-mono flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
              Aguardando Confirmação
            </span>
            <strong className="text-2xl text-slate-100 font-bold">{pendingList.length}</strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">pedidos de clientes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl font-mono flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">
              Receita Confirmada (Kz)
            </span>
            <strong className="text-2xl text-emerald-400 font-bold">
              {totalRevenueKz.toLocaleString('pt-PT')} Kz
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">{approvedList.length} pagamentos aprovados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl font-mono flex items-center justify-between">
          <div>
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
              Consultas Atribuídas
            </span>
            <strong className="text-2xl text-cyan-400 font-bold">
              {totalQueriesIssued.toLocaleString('pt-PT')}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">créditos no mercado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendentes ({pendingList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprovados ({approvedList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejeitados ({rejectedList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({transactions.length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por cliente, ref ou plano..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">
              Nenhum registo de pagamento encontrado com os filtros atuais.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`p-4 rounded-xl border font-mono text-xs transition ${
                tx.status === 'pending'
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : tx.status === 'approved'
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-rose-950/15 border-rose-500/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Client & Order Details */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      ID: {tx.id}
                    </span>
                    <strong className="text-sm text-slate-100 font-bold">
                      {tx.companyName || tx.userName}
                    </strong>
                    {tx.nif && (
                      <span className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
                        NIF: {tx.nif}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">({tx.userEmail})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">
                      Plano: {tx.planName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-white">
                      Valor: {tx.amountKz.toLocaleString('pt-PT')} Kz
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-cyan-400 font-bold">
                      +{tx.queriesGranted} Consultas / Créditos
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">Validade: {tx.validityDays} dias</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Método: {tx.paymentMethod}</span>
                    {tx.paymentReference && (
                      <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        Ref: {tx.paymentReference}
                      </span>
                    )}
                    <span>Data: {new Date(tx.createdAt).toLocaleString('pt-PT')}</span>
                  </div>

                  {tx.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-850">
                      "{tx.notes}"
                    </p>
                  )}

                  {/* Proof Attachment Badge / Viewer */}
                  {tx.paymentProofName && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Comprovativo: <strong>{tx.paymentProofName}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingProofTx(tx)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Ver Documento
                      </button>
                    </div>
                  )}

                  {/* Status audit trail if approved / rejected */}
                  {tx.reviewedByAdminName && (
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Validado por: <strong>{tx.reviewedByAdminName}</strong> em{' '}
                      {tx.reviewedAt ? new Date(tx.reviewedAt).toLocaleString('pt-PT') : 'N/A'}
                    </div>
                  )}

                  {tx.rejectionReason && (
                    <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                      Motivo de Rejeição: {tx.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  {tx.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(tx)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
                        title="Confirmar pagamento e adicionar créditos imediatamente ao cliente"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar & Creditar (+{tx.queriesGranted})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectingTxId(tx.id);
                          setRejectionReason('');
                        }}
                        className="bg-slate-900 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Rejeitar</span>
                      </button>
                    </>
                  ) : tx.status === 'approved' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Créditos Atribuídos</span>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>Rejeitado</span>
                    </div>
                  )}
                </div>

              </div>

              {/* In-place rejection reason prompt */}
              {rejectingTxId === tx.id && (
                <div className="mt-3 p-3 bg-slate-900 border border-rose-500/40 rounded-xl space-y-2">
                  <label className="block text-[11px] text-rose-300 font-bold">
                    Motivo da Rejeição do Pagamento:
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="ex: Comprovativo ilegível ou valor bancário não recebido"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRejectingTxId(null)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmReject(tx.id)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                    >
                      Confirmar Rejeição
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Proof Document Viewer Modal */}
      {viewingProofTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] border border-slate-700 w-full max-w-lg rounded-2xl p-6 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Comprovativo de Pagamento</span>
              </h4>
              <button
                onClick={() => setViewingProofTx(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2 text-xs">
              <p><strong>Cliente:</strong> {viewingProofTx.companyName || viewingProofTx.userName}</p>
              <p><strong>Plano:</strong> {viewingProofTx.planName} ({viewingProofTx.amountKz.toLocaleString('pt-PT')} Kz)</p>
              <p><strong>Referência:</strong> {viewingProofTx.paymentReference || 'N/A'}</p>
              <p><strong>Ficheiro:</strong> {viewingProofTx.paymentProofName}</p>
              
              {viewingProofTx.paymentProofUrl ? (
                <div className="mt-3 border border-slate-800 rounded-lg p-2 max-h-60 overflow-auto text-center bg-slate-900">
                  <img
                    src={viewingProofTx.paymentProofUrl}
                    alt="Comprovativo"
                    className="max-h-56 mx-auto rounded"
                  />
                </div>
              ) : (
                <div className="p-4 text-center bg-slate-900 rounded-lg text-slate-400 mt-2">
                  <p>Documento submetido e referenciado pelo cliente no sistema bancário.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Ref: {viewingProofTx.paymentReference || 'Talão anexado'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProofTx(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
