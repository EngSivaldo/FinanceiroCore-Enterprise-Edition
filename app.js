// --- MOTOR FINANCEIRO CORE v8.1 (Enterprise Edition) ---
let periodoAtual = obterPeriodoAtual();
let bancoDeDados = JSON.parse(localStorage.getItem("financeiro_db")) || {};
let despesasFixas = JSON.parse(localStorage.getItem("fixas")) || [];
let limite = parseFloat(localStorage.getItem("limite")) || 0;
let indexEditando = null;
let indexEditandoFixa = null;
let abaAtiva = "variaveis";

// Controle de Paginação
let paginaAtual = 1;
const itensPorPagina = 10;

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
      paginaAtual = 1; // Reseta página ao mudar mês
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

  let despesasMes = bancoDeDados[periodoAtual] || [];
  const hoje = new Date().toISOString().split("T")[0];

  // Cálculo de totais (Mês inteiro)
  despesasMes.forEach((d) => {
    totalGeralMes += d.valor;
    subtotalVariaveis += d.valor;
    porPagamento[d.pagamento] = (porPagamento[d.pagamento] || 0) + d.valor;
    porLocal[d.local || "Outros"] =
      (porLocal[d.local || "Outros"] || 0) + d.valor;
  });

  // Renderização Variáveis Paginadas
  if (tabela && abaAtiva === "variaveis") {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPaginados = despesasMes.slice(inicio, fim);

    itensPaginados.forEach((d, i) => {
      const indexReal = inicio + i;
      const diffDias =
        (new Date(d.data) - new Date(hoje)) / (1000 * 60 * 60 * 24);
      tabela.innerHTML +=
        indexEditando === indexReal
          ? renderRowEdicao(d, indexReal)
          : renderRowNormal(d, indexReal, diffDias >= 0 && diffDias <= 5);
    });

    if (despesasMes.length > 0) {
      tabela.innerHTML += `<tr class="bg-slate-100/50 font-black"><td colspan="4" class="px-8 py-4 text-[10px] text-slate-500 uppercase">Total Variáveis</td><td class="px-8 py-4 text-right text-indigo-600">R$ ${subtotalVariaveis.toLocaleString(
        "pt-BR",
        { minimumFractionDigits: 2 }
      )}</td><td></td></tr>`;
    }
    renderizarControlesPaginacao(despesasMes.length);
  }

  // Custos Fixos
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

  if (listaF && abaAtiva === "fixas" && despesasFixas.length > 0) {
    listaF.innerHTML += `<div class="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-2xl flex justify-between items-center"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Recorrentes</span><span class="text-lg font-black text-indigo-600">R$ ${subtotalFixas.toLocaleString(
      "pt-BR",
      { minimumFractionDigits: 2 }
    )}</span></div>`;
  }
  atualizarResumos(totalGeralMes, porPagamento, porLocal);
}

// Lógica de Geração dos Botões
function renderizarControlesPaginacao(totalItens) {
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const container = document.getElementById("paginacaoVariaveis");
  if (!container) return;
  if (totalPaginas <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
        <div class="flex items-center justify-center gap-6 py-6">
            <button onclick="mudarPagina(-1)" ${
              paginaAtual === 1 ? "disabled" : ""
            } class="px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-200 disabled:opacity-20 font-bold text-xs">< Anterior</button>
            <span class="text-[11px] font-black text-slate-400 uppercase">Página ${paginaAtual} de ${totalPaginas}</span>
            <button onclick="mudarPagina(1)" ${
              paginaAtual === totalPaginas ? "disabled" : ""
            } class="px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-200 disabled:opacity-20 font-bold text-xs">Próxima ></button>
        </div>`;
}

function mudarPagina(direcao) {
  paginaAtual += direcao;
  renderizarTudo();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Exportação Excel corrigida
function exportarDados() {
  const dados = bancoDeDados[periodoAtual] || [];
  if (dados.length === 0) return alert("Sênior, sem dados para exportar!");

  let csv = "Data;Hora;Descricao;Local;Pagamento;Valor\n";
  dados.forEach((d) => {
    const valorBR = d.valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    const dataBR = d.data.split("-").reverse().join("/");
    csv += `${dataBR};${d.hora || "00:00"};"${d.desc}";"${
      d.local || "Geral"
    }";${d.pagamento};${valorBR}\n`;
  });

  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Relatorio_${periodoAtual}.csv`;
  link.click();
}

// --- FUNÇÕES DE INTERFACE (MANTER ABAIXO) ---
function mostrarAba(aba) {
  abaAtiva = aba;
  paginaAtual = 1;
  document
    .getElementById("abaVariaveis")
    ?.classList.toggle("hidden", aba !== "variaveis");
  document
    .getElementById("abaFixas")
    ?.classList.toggle("hidden", aba !== "fixas");
  if (document.getElementById("tituloPagina"))
    document.getElementById("tituloPagina").innerText =
      aba === "variaveis" ? "Dashboard de Variáveis" : "Custos Recorrentes";
  document
    .getElementById("btn-variaveis")
    ?.classList.toggle("sidebar-active", aba === "variaveis");
  document
    .getElementById("btn-fixas")
    ?.classList.toggle("sidebar-active", aba === "fixas");
  renderizarTudo();
}

function renderRowNormal(d, index, alertarVencimento) {
  const isPrimeira = d.desc.includes("(1/");
  const dataFormatada = d.data.split("-").reverse().join("/");
  return `<tr class="group transition-all ${
    alertarVencimento
      ? "bg-amber-50/60 border-l-4 border-l-amber-500"
      : "border-b border-slate-50"
  }">
        <td class="px-8 py-4 text-[11px] font-bold text-slate-500 font-mono">${dataFormatada}</td>
        <td class="px-8 py-4 font-mono text-[11px] font-black text-indigo-600">${
          d.hora || "00:00"
        }</td>
        <td class="px-8 py-4"><div class="text-[12px] font-bold text-slate-800 uppercase">${
          d.desc
        }</div></td>
        <td class="px-8 py-4 text-center"><span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getBadgeClass(
          d.pagamento
        )}">${d.pagamento}</span></td>
        <td class="px-8 py-4 text-right font-black text-indigo-950 text-sm">R$ ${d.valor.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</td>
        <td class="px-6 py-4 text-center"><div class="flex justify-center gap-3"><button onclick="setEditMode(${index})" class="text-slate-300 hover:text-indigo-600">✏️</button><button onclick="confirmarRemocao(${index}, ${isPrimeira}, '${
    d.desc
  }')" class="text-slate-300 hover:text-red-600">✕</button></div></td>
    </tr>`;
}

function renderFixaNormal(f, index) {
  return `<div class="flex justify-between items-center p-6 glass-card border-l-4 border-l-indigo-500 mb-3 rounded-2xl">
        <div class="flex items-center gap-4"><div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 text-lg">📌</div>
        <div><span class="font-bold text-slate-800 uppercase text-[12px] tracking-tight">${
          f.desc
        }</span></div></div>
        <div class="flex items-center gap-6"><span class="font-black text-slate-900 italic text-sm">R$ ${f.valor.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</span>
        <div class="flex gap-3"><button onclick="setEditModeFixa(${index})" class="text-indigo-400">✏️</button><button onclick="removerFixa(${index})" class="text-red-300 hover:text-red-500">✕</button></div></div></div>`;
}

function renderRowEdicao(d, index) {
  return `<tr class="bg-indigo-50/30"><td colspan="6" class="p-4"><div class="flex gap-2 bg-white p-2 rounded-2xl border border-indigo-100">
  <input id="edit-desc" type="text" value="${d.desc}" class="flex-1 p-3 text-xs font-bold rounded-xl bg-slate-50 border-none">
  <input id="edit-valor" type="number" value="${d.valor}" class="w-28 p-3 text-xs font-black rounded-xl bg-slate-50 border-none">
  <button onclick="salvarEdicao(${index})" class="bg-indigo-600 text-white px-6 rounded-xl text-[10px] font-black uppercase">Salvar</button>
  <button onclick="setEditMode(null)" class="text-slate-400 px-3">✕</button></div></td></tr>`;
}

function renderFixaEdicao(f, index) {
  return `<div class="p-6 glass-card border-l-4 border-l-emerald-500 bg-emerald-50/10 mb-3 rounded-2xl"><div class="flex gap-4">
  <input id="edit-fixa-desc" type="text" value="${f.desc}" class="flex-1 p-3 rounded-xl text-xs font-bold bg-white">
  <input id="edit-fixa-valor" type="number" value="${f.valor}" class="w-32 p-3 rounded-xl text-xs font-black bg-white">
  <button onclick="salvarEdicaoFixa(${index})" class="bg-emerald-500 text-white px-6 rounded-xl text-[10px] font-black uppercase">OK</button>
  <button onclick="setEditModeFixa(null)" class="text-slate-400 text-xs font-bold">CANCELAR</button></div></div>`;
}

function add() {
  const isRecorrente = abaAtiva === "fixas";
  const descEl = document.getElementById(isRecorrente ? "fixaDesc" : "desc");
  const valorEl = document.getElementById(isRecorrente ? "fixaValor" : "valor");
  if (!descEl?.value || !valorEl?.value)
    return alert("Sênior, preencha os campos!");
  const valor = parseFloat(valorEl.value.replace(",", "."));

  if (isRecorrente) {
    despesasFixas.push({
      desc: descEl.value,
      valor,
      local: document.getElementById("fixaLocal")?.value || "Geral",
    });
    localStorage.setItem("fixas", JSON.stringify(despesasFixas));
  } else {
    const numParcelas =
      parseInt(document.getElementById("parcelas")?.value) || 1;
    const dataBase =
      document.getElementById("data")?.value ||
      new Date().toISOString().split("T")[0];
    for (let i = 0; i < numParcelas; i++) {
      let dParc = new Date(dataBase + "T12:00:00");
      dParc.setMonth(dParc.getMonth() + i);
      const pParc = `${dParc.getFullYear()}-${String(
        dParc.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!bancoDeDados[pParc]) bancoDeDados[pParc] = [];
      bancoDeDados[pParc].push({
        data: dParc.toISOString().split("T")[0],
        desc:
          numParcelas > 1
            ? `${descEl.value} (${i + 1}/${numParcelas})`
            : descEl.value,
        local: document.getElementById("local")?.value || "Geral",
        valor: valor / numParcelas,
        pagamento: document.getElementById("pagamento")?.value || "Pix",
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
  if (!overlay) return;
  document.getElementById("modalMensagem").innerText =
    tipo === "fixas"
      ? `Remover custo fixo?`
      : isPrimeira
      ? `Deletar TODAS as parcelas?`
      : `Remover lançamento?`;
  overlay.style.display = "flex";
  document.getElementById("btnConfirmarDeletar").onclick = () => {
    if (tipo === "fixas") {
      despesasFixas.splice(idx, 1);
      localStorage.setItem("fixas", JSON.stringify(despesasFixas));
    } else {
      if (isPrimeira) {
        const nomeBase = descricao.split(" (")[0];
        Object.keys(bancoDeDados).forEach((p) => {
          bancoDeDados[p] = bancoDeDados[p].filter(
            (item) => !item.desc.startsWith(nomeBase)
          );
        });
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
  if (document.getElementById("saldoLimite"))
    document.getElementById(
      "saldoLimite"
    ).innerText = `Disponível: R$ ${saldo.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
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
      ([key, val]) =>
        `<div class="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border-l-4 ${border} mb-2"><span class="text-[9px] font-bold text-slate-600 uppercase truncate mr-2">${key}</span><span class="text-[11px] font-black text-slate-950 font-mono">R$ ${val.toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2 }
        )}</span></div>`
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
