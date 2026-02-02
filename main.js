const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    // Largura ideal para dashboards com sidebar + tabelas
    width: 1366,
    height: 900,

    // Impede que o usuário "esmague" o layout ao redimensionar
    minWidth: 1200,
    minHeight: 800,

    autoHideMenuBar: true,

    // Configurações para garantir que o JS do app funcione no Electron
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // Inicia a janela com um fundo escuro para evitar o "flash branco" antes do CSS carregar
    backgroundColor: "#020617",
    show: false, // Só mostra quando estiver pronto
  });

  win.loadFile("login.html");

  // Efeito de carregamento suave
  win.once("ready-to-show", () => {
    win.show();
    // win.maximize(); // Opcional: Descomente se preferir que ele já abra ocupando tudo
  });
}

app.whenReady().then(createWindow);

// Padrão para fechar o app corretamente em sistemas não-macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
