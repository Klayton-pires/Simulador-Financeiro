# 📙 MANUAL 04: GUIA DE MANUTENÇÃO PREVENTIVA, BACKUPS & RECUPERAÇÃO
**Sistema:** NANUCLOUD - Plataforma de Gestão, Simulação de Preços & Despacho Aduaneiro  
**Versão:** 2.5 Enterprise  
**Classificação:** Manual de Manutenção, Segurança & Disaster Recovery  

---

## 1. Procedimento de Backup Completo da Base de Dados

O NANUCLOUD armazena utilizadores, histórico de simulações, tabelas fiscais e configurações no seu banco de dados persistente.

### A. Exportação de Backup via Painel Administrativo (Interface Gráfica)
1. Aceda ao sistema com conta de **Super Administrador**.
2. Abra a aba **Painel Administrativo > Manutenção & Base de Dados**.
3. Clique no botão **"📥 Descarregar Backup Completo da BD (.json)"**.
4. Guarde o ficheiro gerado `backup_nanucloud_db_YYYY-MM-DD.json` num local seguro ou armazenamento em nuvem.

### B. Backup Automatizado via Linha de Comandos (Cron Job no Servidor Linux)
Para criar cópias diárias automáticas no servidor:
```bash
# Adicione a seguinte linha ao crontab (executa todos os dias às 03:00 da manhã)
0 3 * * * cp /caminho-do-projeto/server/db/database.json /var/backups/nanucloud_db_$(date +\%F).json
```

---

## 2. Restauração de Dados e Recuperação de Desastres (Disaster Recovery)

Caso ocorra falha de hardware, formatação do servidor ou migração para uma nova máquina:

1. **Instalação Limpa:** Faça a instalação limpa do NANUCLOUD na nova máquina conforme o Manual 01.
2. **Restauração via Painel:**
   * Aceda ao Painel de Administração.
   * Na secção **Restaurar Base de Dados**, clique em **Selecionar Ficheiro de Backup (.json)**.
   * Confirme a restauração. Todos os utilizadores, contas e históricos anteriores serão restaurados com precisão.
3. **Restauração Manual via Ficheiro:**
   * Pare o serviço: `pm2 stop nanucloud-app`
   * Substitua o ficheiro `/server/db/database.json` pelo ficheiro de backup descarregado.
   * Reinicie o serviço: `pm2 restart nanucloud-app`

---

## 3. Manutenção Preventiva e Otimização de Performance

### A. Limpeza de Ficheiros Temporários e Cache de Build
Periodicamente, recomenda-se limpar ficheiros antigos:
```bash
# Limpeza de módulos e builds antigos
npm run clean
npm install
npm run build
```

### B. Auditoria de Segurança de Dependências
Para verificar e aplicar patches de segurança em bibliotecas externas:
```bash
npm audit
npm audit fix
```

### C. Certificados de Segurança SSL (Renovação Automática)
O Certbot renova automaticamente certificados SSL a cada 90 dias. Para testar a renovação:
```bash
sudo certbot renew --dry-run
```
