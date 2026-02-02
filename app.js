/** * SENIOR ARCHITECTURE: Data Management with Editability
 * @version 2.0 - Added Inline Editing & Deletion Guards
 */

let periodoAtual = obterPeriodoAtual();
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;
let indexEditando = null; // Controla qual linha está sendo alterada

function obterPeriodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

window.onload = () => {
  inicializarAbasPeriodo();
  document.getElementById("limiteInput").value = limite;
  renderizarTudo();
};

function inicializarAbasPeriodo() {
  const selector = document.getElementById("monthSelector");
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
    btn.className = `px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
      p === periodoAtual
        ? "bg-indigo-500 text-white shadow-sm"
        : "text-slate-400 hover:text-white"
    }`;
    btn.onclick = () => {
      periodoAtual = p;
      indexEditando = null;
      inicializarAbasPeriodo();
      renderizarTudo();
    };
    selector.appendChild(btn);
  }
}

function renderizarTudo() {
  const tabela = document.getElementById("tabela");
  const listaF = document.getElementById("listaFixas");
  tabela.innerHTML = "";
  listaF.innerHTML = "";

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

  // 1. Variáveis
  let despesasMes = bancoDeDados[periodoAtual] || [];
  despesasMes.forEach((d, index) => {
    totalMes += d.valor;
    if (d.pagamento)
      porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    if (d.local) porLocal[d.local] = (porLocal[d.local] || 0) + d.valor;

    if (indexEditando === index) {
      tabela.innerHTML += renderRowEdicao(d, index);
    } else {
      tabela.innerHTML += renderRowNormal(d, index);
    }
  });

  // 2. Fixas
  despesasFixas.forEach((f, index) => {
    totalMes += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    listaF.innerHTML += `
            <li class="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group items-center">
                <span class="font-bold text-slate-700 text-xs uppercase tracking-tight">📌 ${
                  f.desc
                }</span>
                <div class="flex items-center gap-6">
                    <span class="font-black text-slate-800 text-sm">R$ ${f.valor.toFixed(
                      2
                    )}</span>
                    <button onclick="removerFixa(${index})" class="text-red-400 hover:text-red-600 transition-all text-lg leading-none">×</button>
                </div>
            </li>`;
  });

  // Dashboards
  document.getElementById("total").innerText = "R$ " + totalMes.toFixed(2);
  let saldo = limite - totalMes;
  const elSaldo = document.getElementById("saldoLimite");
  elSaldo.innerText = "R$ " + saldo.toFixed(2);
  elSaldo.className = `font-bold text-lg ${
    saldo < 0 ? "text-red-500" : "text-purple-600"
  }`;

  renderizarWidgetCompacto("totaisPag", porPagamento);
  renderizarWidgetCompacto("totaisLocal", porLocal);
}

// COMPONENTES DE TABELA
function renderRowNormal(d, index) {
  return `
        <tr class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4 text-slate-400 text-xs">${
              d.data
            } <span class="opacity-40 ml-1 font-medium">${d.hora}</span></td>
            <td class="px-6 py-4 font-semibold text-slate-700">${d.desc}</td>
            <td class="px-6 py-4 text-slate-500 font-medium">${
              d.local || "-"
            }</td>
            <td class="px-6 py-4"><span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-indigo-100">${
              d.pagamento
            }</span></td>
            <td class="px-6 py-4 text-right font-bold text-slate-800 tracking-tight">R$ ${d.valor.toFixed(
              2
            )}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-3">
                    <button onclick="setEditMode(${index})" title="Editar" class="text-slate-300 hover:text-indigo-600 transition-all">✏️</button>
                    <button onclick="remover(${index})" title="Excluir" class="text-slate-300 hover:text-red-500 transition-all">🗑️</button>
                </div>
            </td>
        </tr>`;
}

function renderRowEdicao(d, index) {
  return `
        <tr class="editing-row">
            <td class="px-4 py-3"><div class="flex gap-1"><input id="editData" type="date" value="${
              d.data
            }" class="edit-input"><input id="editHora" type="time" value="${
    d.hora
  }" class="edit-input"></div></td>
            <td class="px-4 py-3"><input id="editDesc" type="text" value="${
              d.desc
            }" class="edit-input"></td>
            <td class="px-4 py-3"><input id="editLocal" type="text" value="${
              d.local
            }" class="edit-input"></td>
            <td class="px-4 py-3">
                <select id="editPag" class="edit-input">
                    <option ${
                      d.pagamento === "Pix" ? "selected" : ""
                    }>Pix</option>
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
            <td class="px-4 py-3 text-right"><input id="editValor" type="number" value="${
              d.valor
            }" class="edit-input text-right font-bold"></td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="salvarEdicao(${index})" class="bg-emerald-500 text-white p-1.5 rounded-lg text-[10px] font-bold shadow-sm">SALVAR</button>
                    <button onclick="setEditMode(null)" class="bg-slate-400 text-white p-1.5 rounded-lg text-[10px] font-bold">X</button>
                </div>
            </td>
        </tr>`;
}

// LOGICA DE EDIÇÃO E REMOÇÃO
function setEditMode(index) {
  indexEditando = index;
  renderizarTudo();
}

function salvarEdicao(index) {
  const d = {
    data: val("editData"),
    hora: val("editHora"),
    desc: val("editDesc"),
    local: val("editLocal"),
    valor: parseFloat(val("editValor")),
    pagamento: val("editPag"),
  };

  if (!d.valor) return alert("Insira um valor!");

  bancoDeDados[periodoAtual][index] = d;
  indexEditando = null;
  salvarGeral();
  renderizarTudo();
}

function remover(index) {
  const confirmacao = confirm(
    "⚠️ Tem certeza que deseja excluir esta despesa?"
  );
  if (confirmacao) {
    bancoDeDados[periodoAtual].splice(index, 1);
    salvarGeral();
    renderizarTudo();
  }
}

function removerFixa(index) {
  const confirmacao = confirm(
    "⚠️ Deseja remover este custo fixo da sua lista permanente?"
  );
  if (confirmacao) {
    despesasFixas.splice(index, 1);
    localStorage.setItem("fixas", JSON.stringify(despesasFixas));
    renderizarTudo();
  }
}

// DEMAIS FUNÇÕES (MANTIDAS)
function add() {
  const d = {
    data: val("data"),
    hora: val("hora"),
    desc: val("desc"),
    local: val("local"),
    valor: parseFloat(val("valor")),
    pagamento: val("pagamento"),
  };
  if (!d.valor) return alert("Insira o valor!");
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
  ["fixaDesc", "fixaValor", "fixaData", "fixaLocal"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
}

function renderizarWidgetCompacto(id, obj) {
  const el = document.getElementById(id);
  el.innerHTML = Object.entries(obj)
    .map(
      ([k, v]) => `${k}: <span class="text-slate-900">R$${v.toFixed(0)}</span>`
    )
    .join(" • ");
  if (!el.innerHTML) el.innerHTML = "---";
}

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
