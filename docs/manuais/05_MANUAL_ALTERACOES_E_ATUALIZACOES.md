# 📓 MANUAL 05: GUIA DE ALTERAÇÕES, ATUALIZAÇÕES FISCAIS & EXTENSIBILIDADE
**Sistema:** NANUCLOUD - Plataforma de Gestão, Simulação de Preços & Despacho Aduaneiro  
**Versão:** 2.5 Enterprise  
**Classificação:** Manual de Engenharia de Software & Customização  

---

## 1. Como Atualizar Alíquotas Fiscais (IVA, Retenção, Imposto Industrial)

As tabelas de tributação de cada país estão centralizadas no ficheiro:
```
/src/data/countries.ts
```

### Exemplo: Atualizar a Taxa Padrão de IVA em Angola ou Portugal
Se a Administração Geral Tributária (AGT) alterar a taxa de IVA padrão ou introduzir um regime transitório:
1. Abra o ficheiro `/src/data/countries.ts`.
2. Localize a entrada do país correspondente (ex: `AO` para Angola):
```typescript
AO: {
  name: 'Angola',
  flag: '🇦🇴',
  curr: 'Kz',
  agency: 'AGT (Administração Geral Tributária)',
  vatOptions: [
    { r: 14, n: '14% (Regime Geral Padrão AGT)' },
    { r: 7, n: '7% (Bens Essenciais / Prod. Nacional - Lei 2024)' },
    { r: 5, n: '5% (Regime Transitório / Pequeno Comércio)' },
    { r: 0, n: '0% (Isento de IVA - Art.º 12.º CIVA)' }
  ],
  retentionDefault: 6.5, // Código do Imposto Industrial
  ii: 25, // Imposto Industrial (25%)
  tpa: 1.0, // Comissão Multicaixa
  margins: [15, 20, 25, 30, 40, 50, 75, 100]
}
```
3. Altere o valor numérico desejado. Ao guardar, todos os simuladores (Local, Serviços, Lotes e Importação) assumem a nova alíquota imediatamente.

---

## 2. Como Adicionar um Novo País ao Sistema

Para suportar um novo mercado (ex: Moçambique, Brasil, Cabo Verde, São Tomé e Príncipe):
1. No ficheiro `/src/data/countries.ts`, adicione a chave do novo país:
```typescript
MZ: {
  name: 'Moçambique',
  flag: '🇲🇿',
  curr: 'MTn',
  agency: 'AT (Autoridade Tributária de Moçambique)',
  vatOptions: [
    { r: 16, n: '16% (Taxa Geral IVA Moçambique)' },
    { r: 0, n: '0% (Isenções Art.º 9.º CIVA)' }
  ],
  retentionDefault: 5.0,
  ii: 32, // IRPC 32%
  tpa: 1.5,
  margins: [15, 20, 25, 30, 40, 50]
}
```
2. O novo país aparecerá instantaneamente nos seletores de bandeira, taxas de câmbio e relatórios.

---

## 3. Como Alterar os Planos de Preços e Vantagens

Os planos de subscrição comercial estão declarados em:
```
/src/data/plans.ts
```
Para alterar o preço do **Plano Platina** ou **Diamante**:
1. Abra `/src/data/plans.ts`.
2. Modifique os valores `priceKz`, `priceEur`, `queriesIncluded` ou os benefícios listados.
3. As alterações refletem-se automaticamente no modal de planos e na página de faturação.

---

## 4. Como Compilar e Publicar uma Nova Versão

Após realizar qualquer alteração no código fonte:
```bash
# 1. Verificar se não existem erros de TypeScript
npm run lint

# 2. Compilar os ficheiros de produção
npm run build

# 3. Reiniciar o serviço de produção (se estiver no servidor VPS)
pm2 restart nanucloud-app
```
