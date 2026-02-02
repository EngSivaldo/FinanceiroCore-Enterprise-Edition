/** * FINANCEIRO CORE v6.6 - Full CRUD Edition
 * Inclusão: Edição de Despesas Fixas
 */

let periodoAtual = obterPeriodoAtual();
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;

let indexEditando = null; // Para variáveis
let indexEditandoFixa = null; // Para fixas

function obterPeriodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

window.onload = () => {
  inicializarAbasPeriodo();
  const limInput = document.getElementById("limiteInput");
  if (limInput) limInput.value = limite;
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

  // 1. PROCESSAR VARIÁVEIS
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

  // 2. PROCESSAR FIXAS
  despesasFixas.forEach((f, index) => {
    totalMes += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    if (listaF) {
      listaF.innerHTML +=
        indexEditandoFixa === index
          ? renderFixaEdicao(f, index)
          : renderFixaNormal(f, index);
    }
  });

  atualizarResumos(totalMes, porPagamento, porLocal);
}

// --- RENDERS DE FIXAS ---

function renderFixaNormal(f, index) {
  return `
        <div class="flex justify-between p-6 bg-white rounded-3xl border-l-4 border-l-indigo-500 shadow-sm transition-all hover:shadow-md mb-3 group">
            <div class="flex items-center gap-4">
                <span class="text-xl">📌</span>
                <div>
                    <span class="font-extrabold text-slate-800 uppercase">${
                      f.desc
                    }</span>
                    <p class="text-[9px] font-black text-slate-300 uppercase">${
                      f.local || "Recorrente"
                    }</p>
                </div>
            </div>
            <div class="flex items-center gap-6">
                <span class="font-black text-slate-900 text-lg italic">R$ ${f.valor.toFixed(
                  2
                )}</span>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onclick="setEditModeFixa(${index})" class="text-indigo-400 hover:scale-110">✏️</button>
                    <button onclick="removerFixa(${index})" class="text-slate-300 hover:text-red-500">✕</button>
                </div>
            </div>
        </div>`;
}

function renderFixaEdicao(f, index) {
  return `
        <div class="p-6 bg-indigo-50 rounded-3xl border-l-4 border-l-emerald-500 shadow-inner mb-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input id="edit-fixa-desc" type="text" value="${f.desc}" class="p-3 rounded-xl border-none text-xs font-bold shadow-sm">
                <input id="edit-fixa-local" type="text" value="${f.local}" class="p-3 rounded-xl border-none text-xs shadow-sm">
                <input id="edit-fixa-valor" type="number" value="${f.valor}" class="p-3 rounded-xl border-none text-xs font-black shadow-sm text-right">
                <div class="md:col-span-3 flex justify-end gap-2 mt-2">
                    <button onclick="setEditModeFixa(null)" class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Cancelar</button>
                    <button onclick="salvarEdicaoFixa(${index})" class="bg-emerald-500 text-white px-6 py-2 rounded-xl text-[10px] font-bold shadow-lg">Salvar Alteração</button>
                </div>
            </div>
        </div>`;
}

// --- RENDERS DE VARIÁVEIS ---

function renderRowNormal(d, index) {
  return `<tr class="hover:bg-slate-50 transition-all group">
        <td class="px-8 py-5 text-slate-400 text-[10px] font-black">${
          d.data
        }</td>
        <td class="px-8 py-5 font-bold text-slate-700">${d.desc}</td>
        <td class="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">${
          d.local || "-"
        }</td>
        <td class="px-8 py-5"><span class="px-3 py-1.5 rounded-xl text-[9px] font-black border uppercase ${getBadgeClass(
          d.pagamento
        )}">${d.pagamento}</span></td>
        <td class="px-8 py-5 text-right font-black text-slate-900 italic">R$ ${d.valor.toFixed(
          2
        )}</td>
        <td class="px-8 py-5 text-center">
            <div class="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                <button onclick="setEditMode(${index})" class="text-indigo-400">✏️</button>
                <button onclick="confirmarRemocao(${index})" class="text-slate-300 hover:text-red-500">🗑️</button>
            </div>
        </td>
    </tr>`;
}

function renderRowEdicao(d, index) {
  return `<tr class="bg-indigo-50/50">
        <td class="px-4 py-2"><input id="edit-data" type="date" value="${
          d.data
        }" class="w-full p-2 rounded-lg border-none text-[10px] shadow-sm"></td>
        <td class="px-4 py-2"><input id="edit-desc" type="text" value="${
          d.desc
        }" class="w-full p-2 rounded-lg border-none text-[10px] shadow-sm font-bold"></td>
        <td class="px-4 py-2"><input id="edit-local" type="text" value="${
          d.local
        }" class="w-full p-2 rounded-lg border-none text-[10px] shadow-sm"></td>
        <td class="px-4 py-2">
            <select id="edit-pag" class="w-full p-2 rounded-lg border-none text-[10px] shadow-sm font-bold">
                <option ${d.pagamento === "Pix" ? "selected" : ""}>Pix</option>
                <option ${
                  d.pagamento === "Débito" ? "selected" : ""
                }>Débito</option>
                <option ${
                  d.pagamento === "Crédito Alice" ? "selected" : ""
                }>Crédito Alice</option>
                <option ${
                  d.pagamento === "Crédito Lucas" ? "selected" : ""
                }>Crédito Lucas</option>
            </select>
        </td>
        <td class="px-4 py-2"><input id="edit-valor" type="number" value="${
          d.valor
        }" class="w-full p-2 rounded-lg border-none text-[10px] shadow-sm font-black text-right"></td>
        <td class="px-4 py-2 text-center">
            <div class="flex gap-2 justify-center">
                <button onclick="salvarEdicao(${index})" class="bg-emerald-500 text-white p-2 rounded-lg text-[10px] font-bold shadow-sm">OK</button>
                <button onclick="setEditMode(null)" class="bg-slate-300 text-slate-600 p-2 rounded-lg text-[10px] font-bold">X</button>
            </div>
        </td>
    </tr>`;
}

// --- CONTROLE DE ESTADOS ---

function setEditMode(idx) {
  indexEditando = idx;
  renderizarTudo();
}
function setEditModeFixa(idx) {
  indexEditandoFixa = idx;
  renderizarTudo();
}

function salvarEdicao(idx) {
  const d = {
    data: document.getElementById("edit-data").value,
    desc: document.getElementById("edit-desc").value,
    local: document.getElementById("edit-local").value,
    pagamento: document.getElementById("edit-pag").value,
    valor: parseFloat(document.getElementById("edit-valor").value) || 0,
    hora: bancoDeDados[periodoAtual][idx].hora, // Preserva a hora original
  };
  bancoDeDados[periodoAtual][idx] = d;
  localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
  indexEditando = null;
  renderizarTudo();
}

function salvarEdicaoFixa(idx) {
  const f = {
    desc: document.getElementById("edit-fixa-desc").value,
    local: document.getElementById("edit-fixa-local").value,
    valor: parseFloat(document.getElementById("edit-fixa-valor").value) || 0,
  };
  despesasFixas[idx] = f;
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  indexEditandoFixa = null;
  renderizarTudo();
}

// --- AUXILIARES ---

function atualizarResumos(total, pag, loc) {
  const totalEl = document.getElementById("total");
  const saldoEl = document.getElementById("saldoLimite");
  const fill = document.getElementById("progressFill");

  if (totalEl)
    totalEl.innerText =
      "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  let saldo = limite - total;
  if (saldoEl)
    saldoEl.innerText = `Disponível: R$ ${saldo.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;

  let percent = limite > 0 ? (total / limite) * 100 : 0;
  if (fill) fill.style.width = Math.min(percent, 100) + "%";

  renderizarSidebarList("totaisPag", pag, "card-accent-blue");
  renderizarSidebarList("totaisLocal", loc, "card-accent-amber");
}

function renderizarSidebarList(id, obj, accent) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([key, val]) => `
        <div class="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm ${accent}">
            <span class="text-[10px] font-black text-slate-400 uppercase truncate mr-2">${key}</span>
            <span class="text-xs font-black text-slate-800">R$ ${val.toFixed(
              2
            )}</span>
        </div>
    `
    )
    .join("");
}

function getBadgeClass(pag) {
  const classes = {
    Pix: "badge-pix",
    "Crédito Alice": "badge-credito-alice",
    "Crédito Lucas": "badge-credito-lucas",
  };
  return classes[pag] || "badge-debito";
}

function add() {
  const valor = parseFloat(document.getElementById("valor").value);
  const desc = document.getElementById("desc").value;
  if (!valor || !desc) return alert("Preencha descrição e valor!");

  const d = {
    data: document.getElementById("data").value,
    hora: document.getElementById("hora").value,
    desc,
    local: document.getElementById("local").value,
    valor,
    pagamento: document.getElementById("pagamento").value,
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

function removerFixa(index) {
  despesasFixas.splice(index, 1);
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
function confirmarRemocao(index) {
  const overlay = document.getElementById("modalOverlay");
  overlay.style.display = "flex";
  document.getElementById("btnConfirmarDeletar").onclick = () => {
    bancoDeDados[periodoAtual].splice(index, 1);
    localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
    renderizarTudo();
    fecharModal();
  };
}

function mostrarAba(aba) {
  document
    .getElementById("abaVariaveis")
    .classList.toggle("hidden", aba !== "variaveis");
  document
    .getElementById("abaFixas")
    .classList.toggle("hidden", aba !== "fixas");
  document.getElementById(
    "btn-variaveis"
  ).className = `px-6 py-2 rounded-xl font-bold text-sm transition-all ${
    aba === "variaveis"
      ? "bg-white text-indigo-600 shadow-sm"
      : "text-slate-500"
  }`;
  document.getElementById(
    "btn-fixas"
  ).className = `px-6 py-2 rounded-xl font-bold text-sm transition-all ${
    aba === "fixas" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
  }`;
}
