# NANUCLOUD - Plataforma de Gestão e Simulação Fiscal

Aplicação Web Full-Stack para cálculo de preços de venda, margens de lucro, custos de importação e taxas aduaneiras de Angola.

---

## 🌐 Como Publicar e Abrir no GitHub (GitHub Pages)

### ⚠️ Por que a tela ficava em branco no GitHub?
O **NANUCLOUD** é desenvolvido em **React + TypeScript**. Os navegadores não conseguem interpretar ficheiros `.tsx` brutos diretamente. É necessário que o GitHub execute o processo de compilação (**Build**) para gerar os ficheiros finais em HTML/JS na pasta `dist`.

### 🚀 Ativação do GitHub Pages em 3 Passos (100% Automático):

1. **Aceda ao seu repositório no GitHub**.
2. Vá ao menu **Settings** (Definições) > **Pages** (no menu lateral esquerdo).
3. Em **Build and deployment > Source**, selecione **`GitHub Actions`** (em vez de *Deploy from a branch*).

Pronto! O fluxo de trabalho incluído em `.github/workflows/deploy.yml` irá compilar e publicar o site automaticamente a cada atualização, gerando o link oficial (ex: `https://seu-usuario.github.io/nome-do-repositorio/`).

---

## 🚀 Como Executar Localmente no seu Computador (Após Baixar o ZIP)

### 🪟 No Windows (Automático)
1. Extraia o ficheiro ZIP.
2. Dê **duplo clique no ficheiro `INICIAR_SISTEMA.bat`**.
3. O sistema instalará os módulos e abrirá o navegador em `http://localhost:3000`.

### 💻 No Terminal / VS Code (Windows, Mac ou Linux)
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```
Aceda no navegador a: **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Outras Opções de Publicação Online Gratuita (1 Clique)

- **Vercel / Netlify / Cloudflare Pages / Render**:
  - Basta conectar a sua conta do GitHub e selecionar o repositório.
  - Comando de Build: `npm run build`
  - Diretoria de Saída (Output Directory): `dist`

---

## 🔐 Credenciais de Acesso Inicial

| Utilizador / Email | Senha | Função |
| :--- | :--- | :--- |
| `admin` | `admin` | **Super Administrador Nível 1** (Testes rápidos e ilimitados) |
| `joaquim.monteiro@nanucloud.com` | `admin123` | **Super Administrador Oficial** |

---

© 2025-2026 NANUCLOUD. Todos os direitos reservados.
