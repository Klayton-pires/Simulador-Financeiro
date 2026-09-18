# 📘 MANUAL 01: GUIA DE INSTALAÇÃO, DEPLOY & CONFIGURAÇÃO DO SERVIDOR
**Sistema:** NANUCLOUD - Plataforma de Gestão, Simulação de Preços & Despacho Aduaneiro  
**Versão:** 2.5 Enterprise  
**Classificação:** Manual Técnico de Engenharia & Infraestrutura  

---

## 1. Visão Geral da Arquitetura
O **NANUCLOUD** é concebido com arquitetura híbrida de alta resiliência:
* **Frontend SPA:** React 19 + TypeScript + Vite 6 + Tailwind CSS, com renderização reativa e compatibilidade transversal (Browsers novos e legados, Chrome, Safari, Firefox, Edge, Android e iOS).
* **Backend API & SSR Server:** Node.js + Express + TypeScript, responsável pela persistência de histórico, validação de regras fiscais, autenticação com encriptação Bcrypt e emissão de tokens seguros.
* **Modo Offline / Standalone (Fallback Inteligente):** Caso o sistema seja implantado em servidores puramente estáticos (ex: GitHub Pages), a camada de simulação ativa automaticamente o motor de cálculo local no navegador (`LocalStorage` & `Web Workers`), garantindo 100% de disponibilidade.

---

## 2. Requisitos Mínimos de Sistema

### 🖥️ Para Computadores Locais (Windows / Mac / Linux)
* **Sistema Operativo:** Windows 10/11, macOS 11+ ou Linux (Ubuntu 20.04+, Debian 11+, Fedora, Arch).
* **Processador:** Dual-Core 1.6 GHz ou superior.
* **Memória RAM:** Mínimo 2 GB (Recomendado 4 GB).
* **Ambiente de Execução:** Node.js v18.0.0 ou superior (Recomendado: Node.js LTS v20.x).
* **Navegador:** Qualquer navegador moderno ou antigo (Google Chrome 58+, Safari 11+, Mozilla Firefox 57+, Microsoft Edge 16+, Opera, Samsung Internet).

### ☁️ Para Servidores Cloud / VPS de Produção
* **Servidor:** Ubuntu 22.04 LTS / Debian 12 / AlmaLinux.
* **Recursos:** 1 vCPU, 1 GB RAM, 10 GB SSD.
* **Portas de Rede:** Porta `3000` (porta de serviço interno) e Portas `80` (HTTP) / `443` (HTTPS) para o NGINX Reverse Proxy.

---

## 3. Instalação e Execução Local

### A. Método Automático no Windows (1 Clique)
1. Extraia o ficheiro ZIP do projeto para a sua pasta de trabalho (ex: `C:\NANUCLOUD\`).
2. Dê **duplo clique** no ficheiro executável `INICIAR_SISTEMA.bat`.
3. O script irá detetar se o Node.js está presente, instalar as dependências automaticamente e abrir o navegador no endereço:
   ```
   http://localhost:3000
   ```

### B. Método Manual via Linha de Comandos / Terminal (Windows, Mac ou Linux)
1. Abra o Terminal ou Prompt de Comando na raiz do projeto.
2. Execute a instalação de pacotes:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento e cálculo:
   ```bash
   npm run dev
   ```
4. Aceda no seu navegador a: `http://localhost:3000`

---

## 4. Deploy em Produção (Servidor VPS / Cloud Dedicado)

### A. Compilação para Produção (Build)
Para gerar a versão final ultra-otimizada:
```bash
npm run build
```
Este comando cria o diretório `/dist` com os ficheiros compilados e empacota o servidor Node.js.

### B. Executar como Serviço Contínuo (PM2 no Linux)
Instale o gestor de processos PM2:
```bash
sudo npm install -g pm2
pm2 start dist/server.cjs --name "nanucloud-app"
pm2 startup
pm2 save
```

### C. Configuração do Reverse Proxy NGINX com Certificado SSL (HTTPS)
Crie o ficheiro de configuração `/etc/nginx/sites-available/nanucloud.conf`:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Ative o site e emita o certificado SSL gratuito via Let's Encrypt / Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/nanucloud.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## 5. Deploy Gratuito em Nuvem (1 Clique)

### A. Vercel / Netlify / Cloudflare Pages / Render
1. Conecte a sua conta do GitHub ao serviço de cloud escolhido.
2. Selecione o repositório do **NANUCLOUD**.
3. Defina as seguintes configurações:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Clique em **Deploy**. A aplicação estará online com HTTPS automático em menos de 1 minuto.

### B. GitHub Pages (Fluxo Automático Integrado)
1. No seu repositório do GitHub, vá a **Settings > Pages**.
2. Em **Source**, selecione **GitHub Actions**.
3. O workflow automático em `.github/workflows/deploy.yml` compilará e publicará a aplicação sem necessidade de configurações manuais adicionais.

---

## 6. Credenciais Iniciais de Administrador
Após a primeira instalação, utilize os dados de acesso padrão para testes e administração:
* **Super Administrador Nível 1:**
  * Utilizador / Email: `admin` ou `admin@nanucloud.com`
  * Senha: `admin` ou `admin123`
* **Super Administrador Oficial:**
  * Utilizador: `joaquim.monteiro@nanucloud.com`
  * Senha: `admin123`
