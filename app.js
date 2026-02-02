/**
 * SENIOR ARCHITECTURE: Period-Based Persistence
 * Gerencia dados por mês/ano para evitar lentidão e desorganização.
 */

let periodoAtual = obterPeriodoAtual(); // Formato: "YYYY-MM"
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;

function obterPeriodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

window.onload = () => {
  inicializarAbasPeriodo();
  document.getElementById("limiteInput").value = limite;
  renderizarTudo();
};

// CRIA AS "ABAS DE EXCEL" NO TOPO
function inicializarAbasPeriodo() {
  const selector = document.getElementById("monthSelector");
  selector.innerHTML = "";

  // Gerar últimos 4 meses para navegação
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
    btn.className = `px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
      p === periodoAtual
        ? "bg-indigo-500 text-white shadow-sm"
        : "text-slate-400 hover:text-white"
    }`;
    btn.onclick = () => mudarPeriodo(p);
    selector.appendChild(btn);
  }
}

function mudarPeriodo(p) {
  periodoAtual = p;
  inicializarAbasPeriodo();
  renderizarTudo();
}

function renderizarTudo() {
  const tabela = document.getElementById("tabela");
  const listaF = document.getElementById("listaFixas");
  tabela.innerHTML = "";
  listaF.innerHTML = "";

  // Legenda do período
  const [ano, mes] = periodoAtual.split("-");
  const mesesNome = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  document.getElementById("currentPeriodLabel").innerText = `${
    mesesNome[parseInt(mes) - 1]
  } / ${ano}`;

  let totalMes = 0;
  let porPagamento = {};
  let porLocal = {};

  // 1. Processar Variáveis do Mês Selecionado
  let despesasMes = bancoDeDados[periodoAtual] || [];
  despesasMes.forEach((d, index) => {
    totalMes += d.valor;
    if (d.pagamento)
      porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    if (d.local) porLocal[d.local] = (porLocal[d.local] || 0) + d.valor;

    tabela.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-3 text-slate-500 text-xs">${
                  d.data
                } <span class="opacity-50">${d.hora}</span></td>
                <td class="px-6 py-3 font-semibold text-slate-700">${
                  d.desc
                }</td>
                <td class="px-6 py-3 text-slate-500">${d.local}</td>
                <td class="px-6 py-3"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">${
                  d.pagamento
                }</span></td>
                <td class="px-6 py-3 text-right font-bold text-slate-800 italic">R$ ${d.valor.toFixed(
                  2
                )}</td>
                <td class="px-6 py-3 text-center">
                    <button onclick="remover(${index})" class="text-slate-300 hover:text-red-500 transition-all">🗑️</button>
                </td>
            </tr>`;
  });

  // 2. Processar Fixas (Sempre somam em todos os meses)
  despesasFixas.forEach((f, index) => {
    totalMes += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    listaF.innerHTML += `
            <li class="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <span class="font-bold text-slate-700 text-sm">📌 ${
                  f.desc
                }</span>
                <div class="flex items-center gap-4">
                    <span class="font-black text-slate-800 text-sm">R$ ${f.valor.toFixed(
                      2
                    )}</span>
                    <button onclick="removerFixa(${index})" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-all">Excluir</button>
                </div>
            </li>`;
  });

  // 3. Dashboards
  document.getElementById("total").innerText = "R$ " + totalMes.toFixed(2);
  let saldo = limite - totalMes;
  const elSaldo = document.getElementById("saldoLimite");
  elSaldo.innerText = "R$ " + saldo.toFixed(2);
  elSaldo.className = `font-bold text-lg ${
    saldo < 0 ? "text-red-500" : "text-purple-600"
  }`;

  // Widgets Resumo Compacto
  renderizarWidgetCompacto("totaisPag", porPagamento);
  renderizarWidgetCompacto("totaisLocal", porLocal);
}

function renderizarWidgetCompacto(id, obj) {
  const el = document.getElementById(id);
  el.innerHTML = Object.entries(obj)
    .map(([k, v]) => `${k}: R$${v.toFixed(0)}`)
    .join(" | ");
  if (!el.innerHTML) el.innerHTML = "---";
}

// MÉTODOS DE ADIÇÃO
function add() {
  const d = {
    data: val("data"),
    hora: val("hora"),
    desc: val("desc"),
    local: val("local"),
    valor: parseFloat(val("valor")),
    pagamento: val("pagamento"),
  };
  if (!d.valor) return;

  // Se o período da data for diferente do atual, avisa ou muda
  if (!bancoDeDados[periodoAtual]) bancoDeDados[periodoAtual] = [];
  bancoDeDados[periodoAtual].push(d);

  salvarGeral();
  renderizarTudo();
  ["data", "hora", "desc", "local", "valor"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
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
}

function remover(index) {
  bancoDeDados[periodoAtual].splice(index, 1);
  salvarGeral();
  renderizarTudo();
}

function removerFixa(index) {
  despesasFixas.splice(index, 1);
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  renderizarTudo();
}

// UTIL
function salvarGeral() {
  localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
}
function val(id) {
  return document.getElementById(id).value;
}
function definirLimite() {
  limite = parseFloat(document.getElementById("limiteInput").value) || 0;
  localStorage.setItem("limite", limite);
  renderizarTudo();
}

function mostrarAba(aba) {
  document
    .getElementById("abaVariaveis")
    .classList.toggle("hidden", aba !== "variaveis");
  document
    .getElementById("abaFixas")
    .classList.toggle("hidden", aba !== "fixas");
  document.getElementById("btn-variaveis").className = `nav-tab ${
    aba === "variaveis" ? "nav-active" : "nav-inactive"
  }`;
  document.getElementById("btn-fixas").className = `nav-tab ${
    aba === "fixas" ? "nav-active" : "nav-inactive"
  }`;
}

function exportarExcel() {
  let raw = bancoDeDados[periodoAtual] || [];
  let ws = XLSX.utils.json_to_sheet(raw);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `Financeiro_${periodoAtual}.xlsx`);
}
