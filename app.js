// --- MOTOR FINANCEIRO CORE v7.9 (Enterprise Edition) ---
let periodoAtual = obterPeriodoAtual();
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;
let indexEditando = null;
let indexEditandoFixa = null;
let abaAtiva = "variaveis";

function obterPeriodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

window.onload = () => {
  renderizarSeletoresDeMes();
  if (document.getElementById("limiteInput"))
    document.getElementById("limiteInput").value = limite;
  renderizarTudo();
};

function renderizarSeletoresDeMes() {
  const selector = document.getElementById("monthSelector");
  if (!selector) return;
  selector.innerHTML = "";
  const mesesLabels = [
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
  let periodosDisponiveis = Object.keys(bancoDeDados).filter(
    (p) => bancoDeDados[p].length > 0
  );
  if (!periodosDisponiveis.includes(obterPeriodoAtual()))
    periodosDisponiveis.push(obterPeriodoAtual());

  periodosDisponiveis.sort().forEach((p) => {
    const [ano, mes] = p.split("-");
    const btn = document.createElement("button");
    btn.innerText = `${mesesLabels[parseInt(mes) - 1]} ${ano.slice(-2)}`;
    btn.className = `px-5 py-2 rounded-2xl text-[11px] font-bold tracking-tight transition-all ${
      p === periodoAtual
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
        : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-white/5"
    }`;
    btn.onclick = () => {
      periodoAtual = p;
      indexEditando = null;
      renderizarSeletoresDeMes();
      renderizarTudo();
    };
    selector.appendChild(btn);
  });
}

function renderizarTudo() {
  const tabela = document.getElementById("tabela");
  const listaF = document.getElementById("listaFixas");

  if (tabela) tabela.innerHTML = "";
  if (listaF) listaF.innerHTML = "";

  let totalGeralMes = 0;
  let subtotalVariaveis = 0;
  let subtotalFixas = 0;
  let porPagamento = {};
  let porLocal = {};

  // 1. PROCESSAR VARIÁVEIS
  let despesasMes = bancoDeDados[periodoAtual] || [];
  const hoje = new Date().toISOString().split("T")[0];

  despesasMes.forEach((d, index) => {
    totalGeralMes += d.valor;
    subtotalVariaveis += d.valor;
    porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    porLocal[d.local || "Outros"] =
      (porLocal[d.local || "Outros"] || 0) + d.valor;

    if (tabela && abaAtiva === "variaveis") {
      const diffDias =
        (new Date(d.data) - new Date(hoje)) / (1000 * 60 * 60 * 24);
      tabela.innerHTML +=
        indexEditando === index
          ? renderRowEdicao(d, index)
          : renderRowNormal(d, index, diffDias >= 0 && diffDias <= 5);
    }
  });

  // Linha de Total da Tabela de Variáveis
  if (tabela && abaAtiva === "variaveis" && despesasMes.length > 0) {
    tabela.innerHTML += `
      <tr class="bg-slate-100/50 font-black">
        <td colspan="4" class="px-8 py-4 text-[10px] text-slate-500 uppercase">Total Variáveis do Mês</td>
        <td class="px-8 py-4 text-right text-indigo-600">R$ ${subtotalVariaveis.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</td>
        <td></td>
      </tr>`;
  }

  // 2. PROCESSAR FIXAS
  despesasFixas.forEach((f, index) => {
    totalGeralMes += f.valor;
    subtotalFixas += f.valor;
    porLocal[f.local || "Fixas"] =
      (porLocal[f.local || "Fixas"] || 0) + f.valor;
    porPagamento["Recorrente"] = (porPagamento["Recorrente"] || 0) + f.valor;

    if (abaAtiva === "fixas" && listaF) {
      listaF.innerHTML +=
        indexEditandoFixa === index
          ? renderFixaEdicao(f, index)
          : renderFixaNormal(f, index);
    }
  });

  // Card de Total na lista de Fixas
  if (listaF && abaAtiva === "fixas" && despesasFixas.length > 0) {
    listaF.innerHTML += `
      <div class="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-2xl flex justify-between items-center">
        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Recorrentes</span>
        <span class="text-lg font-black text-indigo-600">R$ ${subtotalFixas.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</span>
      </div>`;
  }

  atualizarResumos(totalGeralMes, porPagamento, porLocal);
}

// --- RESTANTE DAS FUNÇÕES ORIGINAIS (Mantidas sem alteração) ---
function mostrarAba(aba) {
  abaAtiva = aba;
  const secVar = document.getElementById("abaVariaveis");
  const secFix = document.getElementById("abaFixas");
  if (secVar) secVar.classList.toggle("hidden", aba !== "variaveis");
  if (secFix) secFix.classList.toggle("hidden", aba !== "fixas");
  const titulo = document.getElementById("tituloPagina");
  if (titulo)
    titulo.innerText =
      aba === "variaveis" ? "Dashboard de Variáveis" : "Custos Recorrentes";
  const btnVar = document.getElementById("btn-variaveis");
  const btnFix = document.getElementById("btn-fixas");
  if (btnVar) btnVar.classList.toggle("sidebar-active", aba === "variaveis");
  if (btnFix) btnFix.classList.toggle("sidebar-active", aba === "fixas");
  renderizarTudo();
}

function renderRowNormal(d, index, alertarVencimento) {
  const isPrimeira = d.desc.includes("(1/");
  const classeAlerta = alertarVencimento
    ? "bg-amber-50/60 border-l-4 border-l-amber-500"
    : "border-b border-slate-50";
  const dataFormatada = d.data.split("-").reverse().join("/");
  return `<tr class="group transition-all ${classeAlerta}">
        <td class="px-8 py-4 text-[11px] font-bold text-slate-500 font-mono">${dataFormatada}</td>
        <td class="px-8 py-4 font-mono">
            <div class="text-[11px] font-black text-indigo-600">${dataFormatada}</div>
            ${
              alertarVencimento
                ? '<span class="text-[8px] text-amber-600 font-black animate-pulse">⚠️ VENCE EM BREVE</span>'
                : ""
            }
        </td>
        <td class="px-8 py-4">
            <div class="text-[12px] font-bold text-slate-800 uppercase tracking-tight">${
              d.desc
            }</div>
            <div class="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">${
              d.local || "Geral"
            }</div>
        </td>
        <td class="px-8 py-4 text-center">
            <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getBadgeClass(
              d.pagamento
            )}">${d.pagamento}</span>
        </td>
        <td class="px-8 py-4 text-right font-black text-indigo-950 text-sm">R$ ${d.valor.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</td>
        <td class="px-6 py-4 text-center">
            <div class="flex justify-center gap-3 transition-all">
                <button onclick="setEditMode(${index})" class="text-slate-300 hover:text-indigo-600 p-1">✏️</button>
                <button onclick="confirmarRemocao(${index}, ${isPrimeira}, '${
    d.desc
  }')" class="text-slate-300 hover:text-red-600 p-1">✕</button>
            </div>
        </td>
    </tr>`;
}

function renderFixaNormal(f, index) {
  return `<div class="flex justify-between items-center p-6 glass-card border-l-4 border-l-indigo-500 mb-3 rounded-2xl">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 text-lg">📌</div>
            <div><span class="font-bold text-slate-800 uppercase text-[12px] tracking-tight">${
              f.desc
            }</span>
            <p class="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">${
              f.local || "Geral"
            }</p></div>
        </div>
        <div class="flex items-center gap-6">
            <span class="font-black text-slate-900 italic text-sm">R$ ${f.valor.toLocaleString(
              "pt-BR",
              { minimumFractionDigits: 2 }
            )}</span>
            <div class="flex gap-3">
                <button onclick="setEditModeFixa(${index})" class="text-indigo-400">✏️</button>
                <button onclick="removerFixa(${index})" class="text-red-300 hover:text-red-500">✕</button>
            </div>
        </div>
    </div>`;
}

function renderRowEdicao(d, index) {
  return `<tr class="bg-indigo-50/30">
        <td colspan="6" class="p-4"><div class="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-indigo-100">
            <input id="edit-desc" type="text" value="${d.desc}" class="flex-1 p-3 text-xs font-bold rounded-xl bg-slate-50 border-none">
            <input id="edit-valor" type="number" value="${d.valor}" class="w-28 p-3 text-xs font-black rounded-xl bg-slate-50 border-none">
            <button onclick="salvarEdicao(${index})" class="bg-indigo-600 text-white px-6 rounded-xl text-[10px] font-black uppercase">Salvar</button>
            <button onclick="setEditMode(null)" class="text-slate-400 px-3">✕</button>
        </div></td>
    </tr>`;
}

function renderFixaEdicao(f, index) {
  return `<div class="p-6 glass-card border-l-4 border-l-emerald-500 bg-emerald-50/10 mb-3 rounded-2xl">
        <div class="flex gap-4">
            <input id="edit-fixa-desc" type="text" value="${f.desc}" class="flex-1 p-3 rounded-xl text-xs font-bold bg-white">
            <input id="edit-fixa-valor" type="number" value="${f.valor}" class="w-32 p-3 rounded-xl text-xs font-black bg-white">
            <button onclick="salvarEdicaoFixa(${index})" class="bg-emerald-500 text-white px-6 rounded-xl text-[10px] font-black uppercase">OK</button>
            <button onclick="setEditModeFixa(null)" class="text-slate-400 text-xs font-bold">CANCELAR</button>
        </div>
    </div>`;
}

function add() {
  const isRecorrente = abaAtiva === "fixas";
  const idDesc = isRecorrente ? "fixaDesc" : "desc";
  const idValor = isRecorrente ? "fixaValor" : "valor";
  const idLocal = isRecorrente ? "fixaLocal" : "local";
  const descEl = document.getElementById(idDesc);
  const valorEl = document.getElementById(idValor);
  const localEl = document.getElementById(idLocal);
  if (!descEl?.value || !valorEl?.value)
    return alert("Sênior, preencha os campos!");
  const desc = descEl.value;
  const valor = parseFloat(valorEl.value.replace(",", "."));
  const local = localEl ? localEl.value : "Geral";
  if (isRecorrente) {
    despesasFixas.push({ desc, valor, local });
    localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  } else {
    const numParcelas =
      parseInt(document.getElementById("parcelas")?.value) || 1;
    const dataBase =
      document.getElementById("data")?.value ||
      new Date().toISOString().split("T")[0];
    const pagamento = document.getElementById("pagamento")?.value || "Pix";
    for (let i = 0; i < numParcelas; i++) {
      let dParc = new Date(dataBase + "T12:00:00");
      dParc.setMonth(dParc.getMonth() + i);
      const pParc = `${dParc.getFullYear()}-${String(
        dParc.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!bancoDeDados[pParc]) bancoDeDados[pParc] = [];
      bancoDeDados[pParc].push({
        data: dParc.toISOString().split("T")[0],
        desc: numParcelas > 1 ? `${desc} (${i + 1}/${numParcelas})` : desc,
        local,
        valor: valor / numParcelas,
        pagamento,
        hora: document.getElementById("hora")?.value || "00:00",
      });
    }
    localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
  }
  descEl.value = "";
  valorEl.value = "";
  renderizarTudo();
}

function confirmarRemocao(idx, isPrimeira, descricao, tipo = "variaveis") {
  const overlay = document.getElementById("modalOverlay");
  const btnConfirmar = document.getElementById("btnConfirmarDeletar");
  const msgElement = document.getElementById("modalMensagem");
  if (!overlay || !btnConfirmar) return;
  msgElement.innerText =
    tipo === "fixas"
      ? `Sênior, remover o custo fixo: "${descricao}"?`
      : isPrimeira
      ? `Deletar TODAS as parcelas de "${descricao.split(" (")[0]}"?`
      : `Remover este lançamento?`;
  overlay.style.display = "flex";
  btnConfirmar.onclick = () => {
    if (tipo === "fixas") {
      despesasFixas.splice(idx, 1);
      localStorage.setItem("fixas", JSON.stringify(despesasFixas));
    } else {
      if (isPrimeira) {
        const nomeBase = descricao.split(" (")[0];
        Object.keys(bancoDeDados).forEach(
          (p) =>
            (bancoDeDados[p] = bancoDeDados[p].filter(
              (item) => !item.desc.startsWith(nomeBase)
            ))
        );
      } else {
        bancoDeDados[periodoAtual].splice(idx, 1);
      }
      localStorage.setItem("financeiro_db", JSON.stringify(bancoDeDados));
    }
    renderizarTudo();
    fecharModal();
  };
}

function removerFixa(idx) {
  confirmarRemocao(idx, false, despesasFixas[idx].desc, "fixas");
}
function atualizarResumos(total, pag, loc) {
  const saldo = limite - total;
  const percentualUsado = limite > 0 ? (total / limite) * 100 : 0;
  if (document.getElementById("total"))
    document.getElementById("total").innerText =
      "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const saldoEl = document.getElementById("saldoLimite");
  if (saldoEl) {
    saldoEl.innerText = `Disponível: R$ ${saldo.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
    saldoEl.className =
      percentualUsado > 85
        ? "text-red-600 font-black text-[11px]"
        : "text-slate-500 font-bold text-[11px]";
  }
  const progress = document.getElementById("progressFill");
  if (progress) {
    progress.style.width = Math.min(percentualUsado, 100) + "%";
    progress.className = `h-full transition-all duration-500 ${
      percentualUsado > 85 ? "bg-red-500" : "bg-indigo-600"
    }`;
  }
  renderizarListaLateral("totaisPag", pag, "border-l-indigo-600");
  renderizarListaLateral("totaisLocal", loc, "border-l-orange-500");
}

function renderizarListaLateral(id, obj, border) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([key, val]) => `
    <div class="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border-l-4 ${border} mb-2">
        <span class="text-[9px] font-bold text-slate-600 uppercase truncate mr-2">${key}</span>
        <span class="text-[11px] font-black text-slate-950 font-mono">R$ ${val.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</span>
    </div>`
    )
    .join("");
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
function definirLimite() {
  limite = parseFloat(document.getElementById("limiteInput").value) || 0;
  localStorage.setItem("limite", limite);
  renderizarTudo();
}
function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
}
function getBadgeClass(pag) {
  if (pag === "Pix") return "badge-pix";
  if (pag.includes("Alice")) return "badge-credito-alice";
  if (pag.includes("Lucas")) return "badge-credito-lucas";
  return "badge-debito";
}
function abrirConfig() {
  document.getElementById("modalConfig")?.classList.replace("hidden", "flex");
}
function fecharConfig() {
  document.getElementById("modalConfig")?.classList.replace("flex", "hidden");
}
function exportarDados() {
  const dados = bancoDeDados[periodoAtual] || [];
  if (dados.length === 0) return alert("Sem dados!");
  let csv = "Data,Descricao,Local,Pagamento,Valor\n";
  dados.forEach(
    (d) =>
      (csv += `${d.data},"${d.desc}","${d.local || ""}",${d.pagamento},${
        d.valor
      }\n`)
  );
  const link = document.createElement("a");
  link.setAttribute(
    "href",
    URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
  );
  link.setAttribute("download", `FinanceiroCore_${periodoAtual}.csv`);
  link.click();
}
function resetarSistema() {
  if (confirm("Apagar TUDO?")) {
    localStorage.clear();
    location.reload();
  }
}
function copiarBackup() {
  navigator.clipboard
    .writeText(JSON.stringify(bancoDeDados))
    .then(() => alert("Copiado!"));
}
