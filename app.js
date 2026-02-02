/** * ARCHITECTURE: Event-Driven Dashboard
 * Todas as funções de dados invocam 'recalcular()' para garantir sincronia da UI.
 */

let despesas = JSON.parse(localStorage.getItem("despesas")) || [];
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;

// Inicialização segura
window.onload = () => {
  document.getElementById("limiteInput").value = limite || "";
  renderizarTudo();
};

function renderizarTudo() {
  // 1. Limpar e Popular Tabela Variáveis
  const tabela = document.getElementById("tabela");
  tabela.innerHTML = "";
  despesas.forEach((d, index) => inserirLinhaNaTabela(d, index));

  // 2. Limpar e Popular Lista de Fixas
  const listaF = document.getElementById("listaFixas");
  listaF.innerHTML = "";
  despesasFixas.forEach((f, index) => {
    listaF.innerHTML += `
            <li class="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                <div class="flex items-center gap-3">
                    <span class="bg-white p-2 rounded-lg shadow-sm">📌</span>
                    <div>
                        <p class="font-bold text-slate-700">${f.desc}</p>
                        <p class="text-xs text-slate-400">${
                          f.local || "Sem local"
                        } • Vence dia: ${
      f.data ? f.data.split("-").reverse()[0] : "--"
    }</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-bold text-slate-900">R$ ${f.valor.toFixed(
                      2
                    )}</span>
                    <button onclick="removerFixa(${index})" class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600">remover</button>
                </div>
            </li>`;
  });

  recalcular();
}

function mostrarAba(aba) {
  const v = document.getElementById("abaVariaveis");
  const f = document.getElementById("abaFixas");
  const tV = document.getElementById("tabVariaveis");
  const tF = document.getElementById("tabFixas");

  if (aba === "variaveis") {
    v.classList.remove("hidden");
    f.classList.add("hidden");
    tV.className = "tab-btn tab-active";
    tF.className = "tab-btn tab-inactive";
  } else {
    v.classList.add("hidden");
    f.classList.remove("hidden");
    tF.className = "tab-btn tab-active";
    tV.className = "tab-btn tab-inactive";
  }
}

// LOGICA DE ADIÇÃO (MELHORADA)
function add() {
  const d = {
    data: val("data"),
    hora: val("hora"),
    desc: val("desc"),
    local: val("local"),
    valor: parseFloat(val("valor")),
    pagamento: val("pagamento"),
  };

  if (!d.valor || isNaN(d.valor)) {
    alert("⚠️ Por favor, insira um valor válido.");
    return;
  }

  despesas.push(d);
  salvar();
  renderizarTudo();
  limparCampos(["data", "hora", "desc", "local", "valor"]);
}

function addFixa() {
  const f = {
    desc: val("fixaDesc"),
    valor: parseFloat(val("fixaValor")),
    data: val("fixaData"),
    local: val("fixaLocal"),
  };

  if (!f.valor) return;

  despesasFixas.push(f);
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  renderizarTudo();
  limparCampos(["fixaDesc", "fixaValor", "fixaData", "fixaLocal"]);
}

function inserirLinhaNaTabela(d, index) {
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50 transition-colors group";
  tr.innerHTML = `
        <td class="px-6 py-4">
            <span class="font-medium text-slate-700">${d.data}</span><br>
            <span class="text-[10px] text-slate-400">${d.hora}</span>
        </td>
        <td class="px-6 py-4 font-semibold text-slate-800">${d.desc}</td>
        <td class="px-6 py-4 text-slate-500">${d.local || "-"}</td>
        <td class="px-6 py-4 text-right font-bold text-emerald-600 italic">R$ ${d.valor.toFixed(
          2
        )}</td>
        <td class="px-6 py-4"><span class="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase">${
          d.pagamento
        }</span></td>
        <td class="px-6 py-4 text-center">
            <button onclick="remover(${index})" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                🗑️
            </button>
        </td>
    `;
  document.getElementById("tabela").appendChild(tr);
}

function recalcular() {
  let total = 0;
  let porPagamento = {};
  let porLocal = {};

  // Processar Variáveis
  despesas.forEach((d) => {
    total += d.valor;
    if (d.pagamento)
      porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    if (d.local) porLocal[d.local] = (porLocal[d.local] || 0) + d.valor;
  });

  // Processar Fixas
  despesasFixas.forEach((f) => {
    total += f.valor;
    let loc = f.local || "Fixas";
    porLocal[loc] = (porLocal[loc] || 0) + f.valor;
  });

  // Dashboard UI
  document.getElementById("total").innerText = "R$ " + total.toFixed(2);

  const saldo = limite - total;
  const elSaldo = document.getElementById("saldoLimite");
  elSaldo.innerText = "R$ " + saldo.toFixed(2);
  elSaldo.className = `font-bold ${
    saldo < 0 ? "text-red-500" : "text-indigo-600"
  }`;

  // Renderizar Listas Auxiliares
  atualizarWidgets("totaisPag", porPagamento);
  atualizarWidgets("totaisLocal", porLocal);
}

function atualizarWidgets(id, objeto) {
  const el = document.getElementById(id);
  let html = "";
  for (let key in objeto) {
    html += `
            <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400">${key}</span>
                <span class="font-bold text-slate-700">R$ ${objeto[key].toFixed(
                  2
                )}</span>
            </div>`;
  }
  el.innerHTML =
    html ||
    '<p class="text-[10px] text-slate-300 italic text-center py-2">Sem dados</p>';
}

// Funções de Gerenciamento
function remover(index) {
  despesas.splice(index, 1);
  salvar();
  renderizarTudo();
}

function removerFixa(index) {
  despesasFixas.splice(index, 1);
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  renderizarTudo();
}

function definirLimite() {
  const valInput = document.getElementById("limiteInput").value;
  limite = parseFloat(valInput) || 0;
  localStorage.setItem("limite", limite);
  recalcular();
}

// Helpers
function val(id) {
  return document.getElementById(id).value;
}
function salvar() {
  localStorage.setItem("despesas", JSON.stringify(despesas));
}
function limparCampos(ids) {
  ids.forEach((id) => (document.getElementById(id).value = ""));
}

function exportarExcel() {
  const data = [
    ...despesas.map((d) => ({ ...d, Tipo: "Variável" })),
    ...despesasFixas.map((f) => ({ ...f, Tipo: "Fixa" })),
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório Geral");
  XLSX.writeFile(wb, "Relatorio_Financeiro.xlsx");
}
