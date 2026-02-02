// --- MOTOR FINANCEIRO CORE v7.0 ---
let periodoAtual = obterPeriodoAtual();
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;
let indexEditando = null;
let indexEditandoFixa = null;

function obterPeriodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

window.onload = () => {
  inicializarAbasPeriodo();
  if (document.getElementById("limiteInput"))
    document.getElementById("limiteInput").value = limite;
  renderizarTudo();
};

function inicializarAbasPeriodo() {
  const selector = document.getElementById("monthSelector");
  if (!selector) return;
  selector.innerHTML = "";
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const hoje = new Date();
  for (let i = -3; i <= 0; i++) {
    let d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    let p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    let btn = document.createElement("button");
    btn.innerText = `${meses[d.getMonth()]} ${d
      .getFullYear()
      .toString()
      .slice(-2)}`;
    btn.className = `px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
      p === periodoAtual
        ? "bg-indigo-600 text-white shadow-md"
        : "text-slate-400 hover:text-slate-600"
    }`;
    btn.onclick = () => {
      periodoAtual = p;
      indexEditando = null;
      indexEditandoFixa = null;
      inicializarAbasPeriodo();
      renderizarTudo();
    };
    selector.appendChild(btn);
  }
}

function renderizarTudo() {
  const tabela = document.getElementById("tabela");
  const listaF = document.getElementById("listaFixas");
  if (tabela) tabela.innerHTML = "";
  if (listaF) listaF.innerHTML = "";

  let totalMes = 0;
  let porPagamento = {};
  let porLocal = {};

  let despesasMes = bancoDeDados[periodoAtual] || [];
  despesasMes.forEach((d, index) => {
    totalMes += d.valor;
    porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    porLocal[d.local || "Outros"] =
      (porLocal[d.local || "Outros"] || 0) + d.valor;
    if (tabela)
      tabela.innerHTML +=
        indexEditando === index
          ? renderRowEdicao(d, index)
          : renderRowNormal(d, index);
  });

  despesasFixas.forEach((f, index) => {
    totalMes += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    if (listaF)
      listaF.innerHTML +=
        indexEditandoFixa === index
          ? renderFixaEdicao(f, index)
          : renderFixaNormal(f, index);
  });

  atualizarResumos(totalMes, porPagamento, porLocal);
}

function renderRowNormal(d, index) {
  return `<tr class="group hover:bg-slate-50 transition-all">
        <td class="px-6 py-4 text-[10px] font-black text-slate-400">${
          d.data
        }</td>
        <td class="px-6 py-4 font-bold text-slate-700 uppercase text-xs">${
          d.desc
        }</td>
        <td class="px-6 py-4"><span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getBadgeClass(
          d.pagamento
        )}">${d.pagamento}</span></td>
        <td class="px-6 py-4 text-right font-black italic text-slate-900">R$ ${d.valor.toFixed(
          2
        )}</td>
        <td class="px-6 py-4 text-center">
            <div class="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button onclick="setEditMode(${index})" class="text-indigo-400">✏️</button>
                <button onclick="confirmarRemocao(${index})" class="text-red-300 hover:text-red-500">✕</button>
            </div>
        </td>
    </tr>`;
}

function renderRowEdicao(d, index) {
  return `<tr class="bg-indigo-50/50">
        <td colspan="5" class="p-4">
            <div class="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-indigo-100">
                <input id="edit-desc" type="text" value="${d.desc}" class="flex-1 p-2 text-xs font-bold rounded-lg bg-slate-50">
                <input id="edit-valor" type="number" value="${d.valor}" class="w-24 p-2 text-xs font-black rounded-lg bg-slate-50">
                <button onclick="salvarEdicao(${index})" class="bg-emerald-500 text-white px-4 rounded-xl text-[10px] font-black">SALVAR</button>
                <button onclick="setEditMode(null)" class="text-slate-400 px-2">X</button>
            </div>
        </td>
    </tr>`;
}

function renderFixaNormal(f, index) {
  return `<div class="flex justify-between items-center p-6 glass-card border-l-4 border-l-indigo-500 group transition-all hover:translate-x-1">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">📌</div>
            <div>
                <span class="font-black text-slate-800 uppercase text-xs">${
                  f.desc
                }</span>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">${
                  f.local || "Geral"
                }</p>
            </div>
        </div>
        <div class="flex items-center gap-6">
            <span class="font-black text-slate-900 italic text-lg">R$ ${f.valor.toFixed(
              2
            )}</span>
            <div class="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button onclick="setEditModeFixa(${index})" class="text-indigo-400">✏️</button>
                <button onclick="removerFixa(${index})" class="text-red-300 hover:text-red-500">✕</button>
            </div>
        </div>
    </div>`;
}

function renderFixaEdicao(f, index) {
  return `<div class="p-6 glass-card border-l-4 border-l-emerald-500 bg-emerald-50/10">
        <div class="flex gap-4">
            <input id="edit-fixa-desc" type="text" value="${f.desc}" class="flex-1 p-3 rounded-xl text-xs font-bold">
            <input id="edit-fixa-valor" type="number" value="${f.valor}" class="w-32 p-3 rounded-xl text-xs font-black">
            <button onclick="salvarEdicaoFixa(${index})" class="bg-emerald-500 text-white px-6 rounded-xl text-[10px] font-black uppercase">OK</button>
            <button onclick="setEditModeFixa(null)" class="text-slate-400">CANCELAR</button>
        </div>
    </div>`;
}

function mostrarAba(aba) {
  document
    .getElementById("abaVariaveis")
    .classList.toggle("hidden", aba !== "variaveis");
  document
    .getElementById("abaFixas")
    .classList.toggle("hidden", aba !== "fixas");
  document.getElementById("tituloPagina").innerText =
    aba === "variaveis" ? "Dashboard de Variáveis" : "Custos Recorrentes";
  document.getElementById(
    "btn-variaveis"
  ).className = `sidebar-item w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
    aba === "variaveis" ? "sidebar-active" : "text-slate-500"
  }`;
  document.getElementById(
    "btn-fixas"
  ).className = `sidebar-item w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
    aba === "fixas" ? "sidebar-active" : "text-slate-500"
  }`;
}

function add() {
  const valor = parseFloat(document.getElementById("valor").value);
  const desc = document.getElementById("desc").value;
  if (!valor || !desc) return alert("Preencha campos!");
  const d = {
    data: document.getElementById("data").value,
    desc,
    local: document.getElementById("local").value,
    valor,
    pagamento: document.getElementById("pagamento").value,
    hora: document.getElementById("hora").value,
  };
  if (!bancoDeDados[periodoAtual]) bancoDeDados[periodoAtual] = [];
  bancoDeDados[periodoAtual].push(d);
  localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
  renderizarTudo();
}

function addFixa() {
  const desc = document.getElementById("fixaDesc").value;
  const valor = parseFloat(document.getElementById("fixaValor").value);
  if (!desc || isNaN(valor)) return alert("Preencha os campos!");
  despesasFixas.push({
    desc,
    valor,
    local: document.getElementById("fixaLocal").value,
  });
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  renderizarTudo();
}

function setEditMode(idx) {
  indexEditando = idx;
  renderizarTudo();
}
function salvarEdicao(idx) {
  bancoDeDados[periodoAtual][idx].desc =
    document.getElementById("edit-desc").value;
  bancoDeDados[periodoAtual][idx].valor =
    parseFloat(document.getElementById("edit-valor").value) || 0;
  localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
  indexEditando = null;
  renderizarTudo();
}

function setEditModeFixa(idx) {
  indexEditandoFixa = idx;
  renderizarTudo();
}
function salvarEdicaoFixa(idx) {
  despesasFixas[idx].desc = document.getElementById("edit-fixa-desc").value;
  despesasFixas[idx].valor =
    parseFloat(document.getElementById("edit-fixa-valor").value) || 0;
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  indexEditandoFixa = null;
  renderizarTudo();
}

function removerFixa(idx) {
  despesasFixas.splice(idx, 1);
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  renderizarTudo();
}
function definirLimite() {
  limite = parseFloat(document.getElementById("limiteInput").value) || 0;
  localStorage.setItem("limite", limite);
  renderizarTudo();
}
function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
}
function confirmarRemocao(idx) {
  document.getElementById("modalOverlay").style.display = "flex";
  document.getElementById("btnConfirmarDeletar").onclick = () => {
    bancoDeDados[periodoAtual].splice(idx, 1);
    localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
    renderizarTudo();
    fecharModal();
  };
}

function getBadgeClass(pag) {
  if (pag === "Pix") return "badge-pix";
  if (pag.includes("Alice")) return "badge-alice";
  if (pag.includes("Lucas")) return "badge-lucas";
  return "badge-debito";
}

function atualizarResumos(total, pag, loc) {
  document.getElementById("total").innerText =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  let saldo = limite - total;
  document.getElementById(
    "saldoLimite"
  ).innerText = `Disponível: R$ ${saldo.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
  let percent = limite > 0 ? (total / limite) * 100 : 0;
  document.getElementById("progressFill").style.width =
    Math.min(percent, 100) + "%";

  renderizarListaLateral("totaisPag", pag, "border-l-indigo-500");
  renderizarListaLateral("totaisLocal", loc, "border-l-amber-400");
}

function renderizarListaLateral(id, obj, border) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([key, val]) => `
        <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-l-4 ${border}">
            <span class="text-[9px] font-black text-slate-400 uppercase truncate mr-2">${key}</span>
            <span class="text-xs font-black text-slate-800 italic">R$ ${val.toFixed(
              2
            )}</span>
        </div>
    `
    )
    .join("");
}
