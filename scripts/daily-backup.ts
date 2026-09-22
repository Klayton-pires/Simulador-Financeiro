#!/usr/bin/env node
/**
 * NANUCLOUD FISCAL SUITE - SCRIPT DE ROTINA DE BACKUP DIÁRIO NEON POSTGRESQL & CLOUD REDUNDANCY
 *
 * Utilização manual no terminal:
 *   npm run backup
 *   npx tsx scripts/daily-backup.ts
 *
 * Configuração no Crontab do Servidor (executar todos os dias às 03:00 da manhã):
 *   0 3 * * * cd /caminho/do/projeto && /usr/bin/npm run backup >> /var/log/nanucloud-backup.log 2>&1
 */

import dotenv from 'dotenv';
dotenv.config();

import { executeBackupRoutine, getBackupScheduleStatus } from '../server/backupService.js';
import { testNeonConnection, isNeonConfigured } from '../server/neon.js';

async function main() {
  console.log('================================================================');
  console.log('🚀 NANUCLOUD FISCAL SUITE - ROTINA DE BACKUP DIÁRIO & REDUNDÂNCIA');
  console.log('================================================================');
  console.log(`⏱️ Data/Hora Início: ${new Date().toISOString()}`);

  const neonReady = isNeonConfigured();
  console.log(`🔌 Neon PostgreSQL Configurado: ${neonReady ? 'SIM' : 'NÃO (Fallback em Memória)'}`);

  if (neonReady) {
    try {
      const connTest = await testNeonConnection();
      if (connTest.connected) {
        console.log(`✅ Conexão Neon Estabelecida: Base de dados "${connTest.database}", latência ${connTest.latencyMs}ms`);
      } else {
        console.warn(`⚠️ Aviso de Conexão Neon: ${connTest.error}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Falha no teste de conexão Neon: ${err.message}`);
    }
  }

  try {
    const meta = await executeBackupRoutine(
      'cli_routine_script',
      'Execução da rotina de backup diário via script CLI/Crontab'
    );

    console.log('\n----------------------------------------------------------------');
    console.log('🎉 BACKUP CONCLUÍDO COM SUCESSO!');
    console.log('----------------------------------------------------------------');
    console.log(`📦 ID do Snapshot:      ${meta.id}`);
    console.log(`🕒 Timestamp Oficial:    ${meta.timestamp}`);
    console.log(`💾 Base de Dados Origem: ${meta.databaseName} (${meta.source})`);
    console.log(`📊 Total de Registos:   ${meta.totalRecords.toLocaleString('pt-PT')}`);
    console.log(`📁 Ficheiro SQL Dump:   ${meta.sqlDumpPath}`);
    console.log(`📁 Ficheiro JSON Dump:  ${meta.jsonDumpPath}`);
    console.log(`📏 Tamanho Total:       ${meta.sizeFormatted} (${meta.uncompressedBytes} bytes)`);
    console.log(`🔒 Checksum SHA-256:     ${meta.checksumSha256}`);
    console.log(`☁️ Redundância Cloud:   ${meta.cloudDestination} [${meta.cloudStatus.toUpperCase()}]`);

    console.log('\n📋 Contagem de Registos por Tabela:');
    Object.entries(meta.tableCounts).forEach(([tbl, count]) => {
      console.log(`   - ${tbl.padEnd(20)}: ${count} registos`);
    });

    const schedule = getBackupScheduleStatus();
    console.log('\n⏰ Próxima Execução Agendada: ' + schedule.nextRunAt);
    console.log('================================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ ERRO CRÍTICO NA EXECUÇÃO DO BACKUP:', error.message || error);
    process.exit(1);
  }
}

main();
