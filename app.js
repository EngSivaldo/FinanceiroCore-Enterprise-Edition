/**
 * ARQUITETURA DE DADOS: Clean & Sync
 * Mantivemos todas as suas variáveis originais para garantir compatibilidade com o LocalStorage.
 */

let despesas = [];
let despesasFixas = [];
let total = 0;
let limite = 0;

// INICIALIZAÇÃO DO SISTEMA
window.onload = () => {
  // Recuperar Dados do LocalStorage
  let d = localStorage.getItem("despesas");
  let f = localStorage.getItem("fixas");
  let lim = localStorage.getItem("limite");

  if (lim) {
    limite = parseFloat(lim);
    document.getElementById("limiteInput").value = limite;
  }
  if (d) {
    despesas = JSON.parse(d);
  }
  if (f) {
    despesasFixas = JSON.parse(f);
  }

  renderizarTudo(); // Renderiza tabelas e reconstrói o dashboard
};

// NAVEGAÇÃO ENTRE ABAS
function mostrarAba(aba) {
  const v = document.getElementById("abaVariaveis");
  const f = document.getElementById("abaFixas");
  const btnV = document.getElementById("btn-variaveis");
  const btnF = document.getElementById("btn-fixas");

  if (aba === "variaveis") {
    v.classList.remove("hidden");
    f.classList.add("hidden");
    btnV.className = "tab-btn tab-active";
    btnF.className = "tab-btn tab-inactive";
  } else {
    v.classList.add("hidden");
    f.classList.remove("hidden");
    btnF.className = "tab-btn tab-active";
    btnV.className = "tab-btn tab-inactive";
  }
}

// LÓGICA DE VARIÁVEIS
function add() {
  let d = {
    data: val("data"),
    hora: val("hora"),
    desc: val("desc"),
    local: val("local"),
    valor: parseFloat(val("valor")),
    pagamento: val("pagamento"),
  };

  if (!d.valor || isNaN(d.valor)) return;

  despesas.push(d);
  salvar();
  renderizarTudo();

  // Limpeza de UI
  ["data", "hora", "desc", "local", "valor"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
}

function inserirLinhaNaTabela(d, index) {
  let tr = `
        <tr class="bg-white hover:bg-indigo-50/50 transition-colors shadow-sm">
            <td class="px-6 py-4 rounded-l-xl border-y border-l border-slate-50">
                <p class="font-bold text-slate-700">${d.data || "---"}</p>
                <p class="text-[10px] text-slate-400">${d.hora || ""}</p>
            </td>
            <td class="px-6 py-4 border-y border-slate-50 font-medium text-slate-600">${
              d.desc || ""
            }</td>
            <td class="px-6 py-4 border-y border-slate-50 text-slate-500">${
              d.local || ""
            }</td>
            <td class="px-6 py-4 border-y border-slate-50 text-right">
                <span class="font-bold text-emerald-600 text-base italic">R$ ${d.valor.toFixed(
                  2
                )}</span>
            </td>
            <td class="px-6 py-4 border-y border-slate-50">
                <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">${
                  d.pagamento || ""
                }</span>
            </td>
            <td class="px-6 py-4 rounded-r-xl border-y border-r border-slate-50 text-center">
                <button onclick="remover(${index})" class="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">🗑️</button>
            </td>
        </tr>
        <tr class="row-spacer"></tr>
    `;
  document.getElementById("tabela").insertAdjacentHTML("beforeend", tr);
}

// LÓGICA DE FIXAS
function addFixa() {
  let f = {
    desc: val("fixaDesc"),
    valor: parseFloat(val("fixaValor")),
    data: val("fixaData"),
    local: val("fixaLocal"),
  };

  if (!f.valor) return;

  despesasFixas.push(f);
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  renderizarTudo();

  // Limpeza
  ["fixaDesc", "fixaValor", "fixaData", "fixaLocal"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
  document.getElementById("fixaDesc").focus();
}

// REMOÇÃO
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

// RECALCULAR (A Única Fonte de Verdade)
function renderizarTudo() {
  // Resetar UI
  document.getElementById("tabela").innerHTML = "";
  document.getElementById("listaFixas").innerHTML = "";

  total = 0;
  let porPagamento = {};
  let porLocal = {};

  // Processar Variáveis
  despesas.forEach((d, index) => {
    total += d.valor;
    inserirLinhaNaTabela(d, index);
    if (d.pagamento)
      porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    if (d.local) porLocal[d.local] = (porLocal[d.local] || 0) + d.valor;
  });

  // Processar Fixas
  despesasFixas.forEach((f, index) => {
    total += f.valor;
    let localFixa = f.local || "Fixas";
    porLocal[localFixa] = (porLocal[localFixa] || 0) + f.valor;

    document.getElementById("listaFixas").innerHTML += `
            <li class="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group transition-all hover:border-indigo-200">
                <div class="flex items-center gap-4">
                    <span class="text-xl">📌</span>
                    <div>
                        <p class="font-bold text-slate-800">${f.desc}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${
                          f.local || "Sem Categoria"
                        }</p>
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <span class="font-black text-slate-700">R$ ${f.valor.toFixed(
                      2
                    )}</span>
                    <button onclick="removerFixa(${index})" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all font-bold text-xs uppercase">Remover</button>
                </div>
            </li>`;
  });

  // Atualizar Dashboard
  document.getElementById("total").innerText = "R$ " + total.toFixed(2);

  // Saldo Limite
  let saldo = limite - total;
  let elSaldo = document.getElementById("saldoLimite");
  elSaldo.innerText = "R$ " + saldo.toFixed(2);
  elSaldo.className = `font-bold ${
    saldo < 0 ? "text-red-600" : "text-purple-600"
  }`;

  // Widgets de Totais
  atualizarWidgetResumo("totaisPag", porPagamento);
  atualizarWidgetResumo("totaisLocal", porLocal);
}

function atualizarWidgetResumo(id, objeto) {
  let el = document.getElementById(id);
  let html = "";
  for (let key in objeto) {
    html += `
            <div class="flex justify-between border-b border-slate-50 pb-1">
                <span class="text-slate-500">${key}:</span>
                <span class="text-slate-800 font-bold">R$ ${objeto[key].toFixed(
                  2
                )}</span>
            </div>`;
  }
  el.innerHTML =
    html || "<p class='text-slate-300 italic text-xs'>Nenhum dado...</p>";
}

// UTILIDADES
function salvar() {
  localStorage.setItem("despesas", JSON.stringify(despesas));
}
function val(id) {
  return document.getElementById(id).value;
}

function definirLimite() {
  let input = document.getElementById("limiteInput").value;
  limite = parseFloat(input) || 0;
  localStorage.setItem("limite", limite);
  renderizarTudo();
}

function exportarExcel() {
  let dados = [
    ...despesas.map((d) => ({ ...d, Tipo: "Variável" })),
    ...despesasFixas.map((f) => ({ ...f, Tipo: "Fixa" })),
  ];
  let ws = XLSX.utils.json_to_sheet(dados);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
  XLSX.writeFile(wb, "Controle_Financeiro.xlsx");
}
