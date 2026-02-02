// --- MOTOR FINANCEIRO CORE v7.4 ---
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
  const tabelaF = document.getElementById("tabelaFixas");

  if (tabela) tabela.innerHTML = "";
  if (tabelaF) tabelaF.innerHTML = "";

  let totalMes = 0;
  let porPagamento = {};
  let porLocal = {};

  // 1. Processar Variáveis
  let despesasMes = bancoDeDados[periodoAtual] || [];
  despesasMes.forEach((d, index) => {
    totalMes += d.valor;
    porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    porLocal[d.local || "Outros"] =
      (porLocal[d.local || "Outros"] || 0) + d.valor;
    if (tabela) {
      tabela.innerHTML +=
        indexEditando === index
          ? renderRowEdicao(d, index)
          : renderRowNormal(d, index);
    }
  });

  // 2. Processar Fixas
  despesasFixas.forEach((f, index) => {
    totalMes += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    if (tabelaF) {
      tabelaF.innerHTML +=
        indexEditandoFixa === index
          ? renderFixaEdicao(f, index)
          : renderFixaNormal(f, index);
    }
  });

  atualizarResumos(totalMes, porPagamento, porLocal);
}

// --- RENDERS VARIÁVEIS (COLUNA DE AÇÕES PROTEGIDA) ---
function renderRowNormal(d, index) {
  return `<tr class="group hover:bg-slate-500/5 transition-all">
        <td class="text-[10px] font-black text-slate-400">${d.data}</td>
        <td class="font-bold uppercase text-xs">${d.desc}</td>
        <td class="text-center"><span class="badge ${getBadgeClass(
          d.pagamento
        )}">${d.pagamento}</span></td>
        <td class="text-right font-black italic">R$ ${d.valor.toFixed(2)}</td>
        <td class="text-center">
            <div class="flex justify-center gap-3">
                <button onclick="setEditMode(${index})" class="text-indigo-500 hover:scale-125 transition-transform" title="Editar">✏️</button>
                <button onclick="confirmarRemocao(${index})" class="text-red-400 hover:text-red-500 hover:scale-125 transition-transform" title="Excluir">✕</button>
            </div>
        </td>
    </tr>`;
}

function renderRowEdicao(d, index) {
  return `<tr class="bg-indigo-500/10">
        <td colspan="5" class="p-4">
            <div class="flex gap-2">
                <input id="edit-desc" type="text" value="${d.desc}" class="flex-1 p-2 rounded-lg text-xs">
                <input id="edit-valor" type="number" value="${d.valor}" class="w-24 p-2 rounded-lg text-xs">
                <button onclick="salvarEdicao(${index})" class="bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold">SALVAR</button>
                <button onclick="setEditMode(null)" class="text-slate-400 px-2">✕</button>
            </div>
        </td>
    </tr>`;
}

// --- RENDERS FIXAS ---
function renderFixaNormal(f, index) {
  return `<tr class="group hover:bg-indigo-500/5 transition-all">
        <td class="font-bold uppercase text-xs text-slate-700 dark:text-slate-300">${
          f.desc
        }</td>
        <td><span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">${
          f.local || "Fixa"
        }</span></td>
        <td class="text-right font-black italic text-lg text-slate-900 dark:text-white">R$ ${f.valor.toFixed(
          2
        )}</td>
        <td class="text-center">
            <div class="flex justify-center gap-4">
                <button onclick="setEditModeFixa(${index})" class="text-indigo-500 hover:scale-125 transition-transform" title="Editar">✏️</button>
                <button onclick="removerFixa(${index})" class="text-red-400 hover:text-red-500 hover:scale-125 transition-transform" title="Excluir">✕</button>
            </div>
        </td>
    </tr>`;
}

function renderFixaEdicao(f, index) {
  return `<tr class="bg-emerald-500/10">
        <td colspan="4" class="p-4">
            <div class="flex gap-3 items-center">
                <input id="edit-fixa-desc" type="text" value="${f.desc}" class="flex-1 p-3 rounded-xl text-xs font-bold bg-white/10">
                <input id="edit-fixa-valor" type="number" value="${f.valor}" class="w-32 p-3 rounded-xl text-xs font-black bg-white/10">
                <button onclick="salvarEdicaoFixa(${index})" class="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase">Confirmar</button>
                <button onclick="setEditModeFixa(null)" class="text-slate-400 px-2 font-bold">✕</button>
            </div>
        </td>
    </tr>`;
}

// --- FUNÇÕES DE AÇÃO E LIMPEZA ---
function add() {
  const valorInput = document.getElementById("valor");
  const descInput = document.getElementById("desc");
  const localInput = document.getElementById("local");
  const valor = parseFloat(valorInput.value);
  const desc = descInput.value;

  if (!valor || !desc) return alert("Sênior, preencha Descrição e Valor!");

  const d = {
    data:
      document.getElementById("data").value ||
      new Date().toISOString().split("T")[0],
    desc,
    local: localInput.value || "Geral",
    valor,
    pagamento: document.getElementById("pagamento").value,
    hora: document.getElementById("hora").value || "00:00",
  };

  if (!bancoDeDados[periodoAtual]) bancoDeDados[periodoAtual] = [];
  bancoDeDados[periodoAtual].push(d);
  localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));

  // Limpeza de campos
  [valorInput, descInput, localInput].forEach((i) => (i.value = ""));
  renderizarTudo();
}

function addFixa() {
  const dI = document.getElementById("fixaDesc");
  const vI = document.getElementById("fixaValor");
  const lI = document.getElementById("fixaLocal");
  const desc = dI.value;
  const valor = parseFloat(vI.value);

  if (!desc || isNaN(valor)) return alert("Sênior, dados incompletos!");

  despesasFixas.push({ desc, valor, local: lI.value || "Fixa" });
  localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  [dI, vI, lI].forEach((i) => (i.value = ""));
  renderizarTudo();
}

// --- EDIÇÃO E REMOÇÃO ---
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
  if (confirm("Excluir custo fixo?")) {
    despesasFixas.splice(idx, 1);
    localStorage.setItem("fixas", JSON.stringify(despesasFixas));
    renderizarTudo();
  }
}

function confirmarRemocao(idx) {
  const modal = document.getElementById("modalOverlay");
  if (modal) {
    modal.style.display = "flex";
    document.getElementById("btnConfirmarDeletar").onclick = () => {
      bancoDeDados[periodoAtual].splice(idx, 1);
      localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
      renderizarTudo();
      modal.style.display = "none";
    };
  } else {
    if (confirm("Excluir lançamento?")) {
      bancoDeDados[periodoAtual].splice(idx, 1);
      localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
      renderizarTudo();
    }
  }
}

// --- RESUMOS E UI ---
function mostrarAba(aba) {
  document
    .getElementById("abaVariaveis")
    .classList.toggle("hidden", aba !== "variaveis");
  document
    .getElementById("abaFixas")
    .classList.toggle("hidden", aba === "variaveis");
  document
    .getElementById("btn-variaveis")
    .classList.toggle("sidebar-active", aba === "variaveis");
  document
    .getElementById("btn-fixas")
    .classList.toggle("sidebar-active", aba !== "variaveis");
  document.getElementById("tituloPagina").innerText =
    aba === "variaveis" ? "Dashboard de Variáveis" : "Custos Recorrentes";
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

  // Alerta visual de limite
  document
    .getElementById("progressFill")
    .classList.toggle("bg-red-500", percent >= 90);

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
        <div class="flex justify-between items-center p-4 dark:bg-white/5 bg-slate-100 rounded-2xl border-l-4 ${border}">
            <span class="text-[9px] font-black opacity-60 uppercase truncate mr-2">${key}</span>
            <span class="text-xs font-black italic text-indigo-500">R$ ${val.toFixed(
              2
            )}</span>
        </div>`
    )
    .join("");
}

function getBadgeClass(pag) {
  const p = pag.toLowerCase();
  if (p.includes("pix")) return "badge-pix";
  if (p.includes("alice")) return "badge-credito-alice";
  if (p.includes("lucas")) return "badge-credito-lucas";
  return "badge-debito";
}
