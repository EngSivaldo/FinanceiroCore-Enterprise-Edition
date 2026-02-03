const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: "#020617",
    show: false,
  });

  // AJUSTE AQUI:
  // Se o seu arquivo principal agora é 'index.html', use:
  win.loadFile("index.html");

  // Se você ainda quiser que ele comece pelo login,
  // certifique-se que o arquivo 'login.html' existe na raiz.
  // win.loadFile("login.html");

  win.once("ready-to-show", () => {
    win.show();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
