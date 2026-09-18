# 📕 MANUAL 03: GUIA DE ADMINISTRAÇÃO, CONTROLO DE ACESSOS & AUDITORIA
**Sistema:** NANUCLOUD - Plataforma de Gestão, Simulação de Preços & Despacho Aduaneiro  
**Versão:** 2.5 Enterprise  
**Classificação:** Manual de Governança e Administração de TI  

---

## 1. Níveis de Privilégios e Hierarquia de Perfis (RBAC)

O sistema implementa controlo de acessos baseado em perfis (Role-Based Access Control) com 3 níveis rigorosos:

| Nível de Acesso | Identificador | Capacidades & Permissões |
| :--- | :--- | :--- |
| **Super Administrador Nível 1** | `admin_level1` | **Acesso Total Irrestrito**: Gestão de administradores, alteração de parâmetros globais, concessão de planos ilimitados, edição de tabelas de impostos, visualização de logs de auditoria de todos os utilizadores e backup do banco de dados. |
| **Administrador Nível 2** | `admin_level2` | **Gestão Operacional**: Gestão de utilizadores normais, recarga manual de créditos, aprovação de comprovativos de transferência e visualização de métricas financeiras. |
| **Utilizador Registado** | `user` | **Execução de Cálculos**: Acesso aos simuladores liberados pelo seu plano ativo (Simulação Local, Importação, Lotes Excel) e histórico pessoal. |

---

## 2. Gestão de Contas de Utilizadores

No **Painel Administrativo** (`/admin`), o administrador tem acesso ao painel de utilizadores:
1. **Adicionar Novo Utilizador:**
   * Clique em `+ Novo Utilizador`.
   * Preencha Nome, Email, Senha inicial, Empresa, País e Nível de Acesso.
2. **Ativação / Suspensão de Contas:**
   * Clique no botão `Suspender / Ativar` para bloquear o acesso de qualquer utilizador instantaneamente sem apagar o histórico de simulações.
3. **Redefinição de Senha:**
   * O administrador pode definir uma nova senha criptografada caso o utilizador a tenha esquecido.
4. **Atribuição Manual de Planos & Desbloqueio de Módulos:**
   * Possibilidade de promover qualquer conta para:
     * **Plano Prata:** 20 consultas.
     * **Plano Ouro:** 50 consultas + Módulo de Importação Aduaneira.
     * **Plano Platina:** 100 consultas + Módulo de Importação + Lotes Excel.
     * **Plano Diamante / Corporativo:** Consultas ilimitadas + Todos os módulos desbloqueados.
     * **Plano Personalizado:** Configuração à medida para grandes corporações.

---

## 3. Gestão e Recarga Manual de Créditos / Consultas

Quando um cliente efetua o pagamento por Transferência Bancária / Multicaixa Express (MCX) ou IBAN:
1. Localize o utilizador na lista de contas.
2. Clique em **"Recarregar Créditos"**.
3. Insira a quantidade de consultas a creditar (ex: `+50`, `+100` ou `+500`).
4. Os créditos tornam-se disponíveis na conta do utilizador em tempo real, sem necessidade de reiniciar a sessão.

---

## 4. Auditoria de Cálculos e Histórico do Sistema

O NANUCLOUD armazena um registo de auditoria detalhado de cada cálculo efetuado:
* Data e hora exatas da simulação (ISO Timestamp).
* Utilizador que executou o cálculo (Email, Nome e Empresa).
* Tipo de operação: `local` (Comércio/Serviços), `import` (Despacho Aduaneiro) ou `batch` (Lote Excel).
* Parâmetros de entrada e resultados financeiros gerados.
* Exportação dos registos de auditoria em formato JSON e PDF para conformidade contabilística.
