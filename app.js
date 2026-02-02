/** * SENIOR ARCHITECTURE v4.0 - Sidebar Intelligence & Persistence
 */

let periodoAtual = obterPeriodoAtual();
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;
let indexEditando = null;

// SISTEMA DE MODAL
function abrirModal(callback) {
  const overlay = document.getElementById("modalOverlay");
  const btn = document.getElementById("btnConfirmarDeletar");
  overlay.style.display = "flex";
  const novoBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(novoBtn, btn);
  novoBtn.onclick = () => {
    callback();
    fecharModal();
  };
}
function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
}

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
    btn.className = `px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
      p === periodoAtual
        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
        : "text-slate-400 hover:text-slate-600"
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
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO",
  ];
  document.getElementById("currentPeriodLabel").innerText = `${
    mesesNome[parseInt(mes) - 1]
  } / ${ano}`;

  let totalMes = 0;
  let porPagamento = {};
  let porLocal = {};

  let despesasMes = bancoDeDados[periodoAtual] || [];
  despesasMes.forEach((d, index) => {
    totalMes += d.valor;
    porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    porLocal[d.local || "Outros"] =
      (porLocal[d.local || "Outros"] || 0) + d.valor;
    tabela.innerHTML +=
      indexEditando === index
        ? renderRowEdicao(d, index)
        : renderRowNormal(d, index);
  });

  despesasFixas.forEach((f, index) => {
    totalMes += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    listaF.innerHTML += `
            <div class="flex justify-between p-5 bg-white rounded-2xl border border-slate-200 items-center shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-red-50 text-red-500 rounded-xl">📌</div>
                    <div><span class="font-bold text-slate-800">${
                      f.desc
                    }</span><p class="text-[10px] text-slate-400 uppercase tracking-tighter">${
      f.local || "Recorrente"
    }</p></div>
                </div>
                <div class="flex items-center gap-6">
                    <span class="font-black text-slate-900 text-lg">R$ ${f.valor.toFixed(
                      2
                    )}</span>
                    <button onclick="removerFixa(${index})" class="text-slate-300 hover:text-red-500 text-xl font-light transition-all">✕</button>
                </div>
            </div>`;
  });

  // Dashboards Central
  document.getElementById("total").innerText = "R$ " + totalMes.toFixed(2);
  let saldo = limite - totalMes;
  const elSaldo = document.getElementById("saldoLimite");
  elSaldo.innerText = `Disponível: R$ ${saldo.toFixed(2)}`;
  elSaldo.className = `text-xs font-bold mt-1 ${
    saldo < 0 ? "text-red-500" : "text-indigo-500"
  }`;

  // Sidebar Widgets
  renderizarWidgetSidebar(
    "totaisPag",
    porPagamento,
    "bg-slate-50 border-slate-100"
  );
  renderizarWidgetSidebar(
    "totaisLocal",
    porLocal,
    "bg-slate-50 border-slate-100"
  );
}

function renderizarWidgetSidebar(id, obj, style) {
  const container = document.getElementById(id);
  container.innerHTML = Object.entries(obj)
    .map(
      ([key, val]) => `
        <div class="flex justify-between items-center p-3 ${style} border rounded-xl">
            <span class="text-[11px] font-bold text-slate-500 truncate mr-2 uppercase">${key}</span>
            <span class="text-xs font-black text-slate-800 whitespace-nowrap">R$ ${val.toFixed(
              2
            )}</span>
        </div>
    `
    )
    .join("");
  if (!container.innerHTML)
    container.innerHTML = `<p class="text-[10px] text-slate-300 italic">Sem registros neste mês.</p>`;
}

function renderRowNormal(d, index) {
  return `<tr class="hover:bg-slate-50/80 transition-all group">
        <td class="px-6 py-4 text-slate-400 text-xs font-medium">${
          d.data
        } <span class="opacity-30 ml-1 font-normal">${d.hora}</span></td>
        <td class="px-6 py-4 font-bold text-slate-700">${d.desc}</td>
        <td class="px-6 py-4 text-slate-500 font-semibold text-xs uppercase">${
          d.local || "-"
        }</td>
        <td class="px-6 py-4"><span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-indigo-100 uppercase">${
          d.pagamento
        }</span></td>
        <td class="px-6 py-4 text-right font-black text-slate-900">R$ ${d.valor.toFixed(
          2
        )}</td>
        <td class="px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                <button onclick="setEditMode(${index})" class="text-indigo-400 hover:text-indigo-700">✏️</button>
                <button onclick="confirmarRemocao(${index})" class="text-slate-300 hover:text-red-500">🗑️</button>
            </div>
        </td>
    </tr>`;
}

function renderRowEdicao(d, index) {
  return `<tr class="editing-row">
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
        <td class="px-4 py-3"><select id="editPag" class="edit-input"><option ${
          d.pagamento === "Pix" ? "selected" : ""
        }>Pix</option><option ${
    d.pagamento === "Débito" ? "selected" : ""
  }>Débito</option><option ${
    d.pagamento === "Crédito Alice" ? "selected" : ""
  }>Crédito Alice</option><option ${
    d.pagamento === "Crédito Lucas" ? "selected" : ""
  }>Crédito Lucas</option></select></td>
        <td class="px-4 py-3 text-right"><input id="editValor" type="number" value="${
          d.valor
        }" class="edit-input text-right font-bold"></td>
        <td class="px-4 py-3 text-center"><div class="flex gap-2"><button onclick="salvarEdicao(${index})" class="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">OK</button><button onclick="setEditMode(null)" class="bg-slate-400 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">X</button></div></td>
    </tr>`;
}

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
  if (!d.valor) return;
  bancoDeDados[periodoAtual][index] = d;
  indexEditando = null;
  salvarGeral();
  renderizarTudo();
}
function confirmarRemocao(index) {
  abrirModal(() => {
    bancoDeDados[periodoAtual].splice(index, 1);
    salvarGeral();
    renderizarTudo();
  });
}
function removerFixa(index) {
  abrirModal(() => {
    despesasFixas.splice(index, 1);
    localStorage.setItem("fixas", JSON.stringify(despesasFixas));
    renderizarTudo();
  });
}
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
