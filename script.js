// NGN Technologies — camada web (cadastro/entrada, telas, módulos, jogo, ranking)
// Critério 2: nenhum destes handlers deixa o form/click recarregar a página.
// Critério 3: jogadores, sessão e módulos concluídos ficam em localStorage;
//             a última tela aberta fica em sessionStorage.

const STORAGE_PLAYERS = "ngn_players";
const STORAGE_SESSION = "ngn_current_user";
const STORAGE_MODULOS = "ngn_modulos";
const STORAGE_TELA = "ngn_tela";

// Critério 1/4: false evita o iframe tentar carregar godot/index.html
// quando o export do Godot não está no repositório (evita 404 no console).
const JOGO_PRONTO = true;

const TELAS = ["tela-inicio", "tela-aprender", "tela-jogo", "tela-ranking", "tela-sobre"];

// Nível = 1 + 1 a cada PONTOS_NIVEL pontos. Conquistas por pontos acumulados.
const PONTOS_NIVEL = 150;
const CONQUISTAS = [
  { min: 1, icone: "i-folha", nome: "Primeira missão" },
  { min: 300, icone: "i-escudo", nome: "Cidade preparada" },
  { min: 600, icone: "i-trofeu", nome: "Cidade resistiu" },
];

const MODULOS = {
  clima: {
    titulo: "Mudanças climáticas",
    resumo: "Entenda causas, efeitos e impactos no planeta.",
    topicos: [
      ["O que é", "Mudança climática é a alteração do clima da Terra ao longo de muitos anos. O aquecimento das últimas décadas está ligado principalmente à queima de combustíveis fósseis, que lança gases de efeito estufa na atmosfera."],
      ["Efeitos", "Eventos extremos ficam mais frequentes e intensos: chuvas muito fortes, secas e ondas de calor. No Rio Grande do Sul, isso aparece em enchentes e estiagens."],
      ["O que cada um pode fazer", "Economizar energia, preferir transporte coletivo ou bicicleta, evitar desperdício de comida e plantar árvores ajudam a reduzir as emissões."],
    ],
  },
  desastres: {
    titulo: "Desastres naturais",
    resumo: "Aprenda sobre enchentes, secas, deslizamentos e prevenção.",
    topicos: [
      ["Enchentes", "Acontecem quando o rio transborda ou a chuva é maior do que a cidade consegue escoar. Acompanhe os alertas da Defesa Civil e saia cedo de áreas de risco."],
      ["Deslizamentos", "Solo encharcado em encostas pode ceder. Rachaduras, árvores inclinadas e barulho de terra caindo são sinais de alerta: afaste-se e avise a Defesa Civil."],
      ["Mochila de emergência", "Deixe em local de fácil acesso: documentos, remédios, água, lanterna, carregador de celular e itens essenciais da família."],
      ["Depois da enchente", "Água e alimentos que tocaram a enchente podem estar contaminados. Use botas e luvas e trate a água antes de beber, para evitar doenças como a leptospirose."],
      ["Quem ajuda", "Defesa Civil: 199. Bombeiros: 193. SAMU: 192."],
    ],
  },
  sustentabilidade: {
    titulo: "Sustentabilidade",
    resumo: "Descubra práticas sustentáveis para o dia a dia.",
    topicos: [
      ["Ideia central", "Ser sustentável é usar os recursos de hoje sem comprometer os das próximas gerações."],
      ["Reduzir, reutilizar, reciclar", "Consumir menos, dar nova vida aos objetos e separar o lixo reciclável diminuem o que vai para aterros e para a natureza."],
      ["Água e energia", "Banhos mais curtos, torneiras fechadas e aparelhos desligados economizam recursos e dinheiro."],
      ["Cidade resiliente", "Drenagem, árvores, rios limpos e alertas reduzem os danos dos desastres. É o que você pratica nos Desafios."],
    ],
  },
  biomas: {
    titulo: "Biomas do RS",
    resumo: "Conheça o Pampa, a Mata Atlântica e sua importância.",
    topicos: [
      ["Dois biomas", "O Rio Grande do Sul tem dois biomas: o Pampa, de campos e vegetação rasteira, e a Mata Atlântica, de florestas."],
      ["Por que importam", "Abrigam muitas espécies de plantas e animais, protegem o solo e ajudam a manter a água limpa."],
      ["Matas ciliares", "A vegetação ao redor dos rios segura a terra das margens, reduz a erosão e ajuda a diminuir o impacto das enchentes."],
      ["Como proteger", "Evitar queimadas, respeitar áreas de preservação, não jogar lixo em rios e plantar espécies nativas."],
    ],
  },
};

const $ = (id) => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";

// ---------- Armazenamento (tudo em try/catch: critério 4) ----------

function lerJSON(chave, padrao) {
  try {
    const v = JSON.parse(localStorage.getItem(chave));
    return v === null || v === undefined ? padrao : v;
  } catch {
    return padrao;
  }
}

function gravarJSON(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento bloqueado: o site continua, só não salva */
  }
}

function lerJogadores() {
  const lista = lerJSON(STORAGE_PLAYERS, []);
  return Array.isArray(lista) ? lista : [];
}
const salvarJogadores = (lista) => gravarJSON(STORAGE_PLAYERS, lista);
const lerSessao = () => lerJSON(STORAGE_SESSION, null);
const salvarSessao = (j) => gravarJSON(STORAGE_SESSION, j);

function modulosConcluidos() {
  const sessao = lerSessao();
  if (!sessao) return [];
  const tudo = lerJSON(STORAGE_MODULOS, {});
  const lista = tudo && tudo[sessao.email];
  return Array.isArray(lista) ? lista.filter((id) => id in MODULOS) : [];
}

function concluirModulo(id) {
  const sessao = lerSessao();
  if (!sessao || !(id in MODULOS)) return;
  const tudo = lerJSON(STORAGE_MODULOS, {});
  const lista = new Set(Array.isArray(tudo[sessao.email]) ? tudo[sessao.email] : []);
  lista.add(id);
  tudo[sessao.email] = [...lista];
  gravarJSON(STORAGE_MODULOS, tudo);
}

function lerTelaSalva() {
  try {
    const t = sessionStorage.getItem(STORAGE_TELA);
    return TELAS.includes(t) ? t : "tela-inicio";
  } catch {
    return "tela-inicio";
  }
}

function salvarTela(id) {
  try {
    sessionStorage.setItem(STORAGE_TELA, id);
  } catch {
    /* idem */
  }
}

// ---------- Utilidades de DOM (sempre textContent: critério 4) ----------

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function icone(id) {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("aria-hidden", "true");
  const uso = document.createElementNS(SVGNS, "use");
  uso.setAttribute("href", `#${id}`);
  svg.append(uso);
  return svg;
}

const nivelDe = (pontos) => 1 + Math.floor(pontos / PONTOS_NIVEL);

// ---------- Telas ----------

function mostrarTela(id, { foco = true } = {}) {
  if (!TELAS.includes(id)) id = "tela-inicio";

  TELAS.forEach((t) => $(t).classList.toggle("oculta", t !== id));
  document.body.dataset.tela = id;
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    if (btn.dataset.target === id) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
  salvarTela(id);

  if (id === "tela-ranking") renderizarRanking();
  if (id === "tela-jogo") prepararTelaJogo();
  if (id === "tela-aprender") atualizarProgresso();

  if (foco) {
    window.scrollTo(0, 0);
    // Leva o foco para o título: leitor de tela anuncia a nova tela
    const titulo = document.querySelector(`#${id} h1`);
    if (titulo) titulo.focus({ preventScroll: true });
  }
}

// Mostra o aviso "entre para jogar" ou o jogo, conforme a sessão
function prepararTelaJogo() {
  const sessao = lerSessao();
  $("jogo-bloqueado").classList.toggle("oculta", !!sessao);
  $("jogo-area").classList.toggle("oculta", !sessao);
  if (!sessao) return;

  $("jogador-nome").textContent = sessao.nome;
  $("jogador-pontos").textContent = sessao.pontos;

  // Carrega o Godot só quando a tela do jogo fica visível (e o export existe).
  if (!JOGO_PRONTO) return;
  const frame = $("jogo-frame");
  $("jogo-placeholder").classList.add("oculta");
  frame.classList.remove("oculta");
  if (!frame.getAttribute("src")) frame.src = frame.dataset.src;
}

function atualizarTopo() {
  const sessao = lerSessao();
  $("auth-visitante").classList.toggle("oculta", !!sessao);
  $("auth-logado").classList.toggle("oculta", !sessao);
  if (sessao) {
    $("chip-nome").textContent = sessao.nome;
    $("chip-pontos").textContent = sessao.pontos;
  }
}

// ---------- Aprender: módulos e progresso ----------

function atualizarProgresso() {
  const feitos = modulosConcluidos();
  const total = Object.keys(MODULOS).length;
  const pct = feitos.length / total;

  $("anel-num").textContent = `${feitos.length}/${total}`;
  $("anel-valor").setAttribute("stroke-dashoffset", String(188.5 * (1 - pct)));
  $("barra-modulos").style.width = `${pct * 100}%`;
  $("progresso-nota").textContent = lerSessao()
    ? feitos.length === total
      ? "Parabéns! Você concluiu todos os módulos."
      : "Conclua os módulos para completar a barra."
    : "Entre para salvar seu progresso.";

  document.querySelectorAll(".modulo").forEach((card) => {
    card.querySelector(".selo-ok").classList.toggle("oculta", !feitos.includes(card.dataset.id));
  });
}

let moduloAberto = null;

function abrirModulo(id) {
  const m = MODULOS[id];
  if (!m) return;
  moduloAberto = id;
  $("modulo-titulo").textContent = m.titulo;
  $("modulo-resumo").textContent = m.resumo;
  $("modulo-topicos").replaceChildren(
    ...m.topicos.map(([t, p]) => {
      const bloco = el("div");
      bloco.append(el("h3", "", t), el("p", "", p));
      return bloco;
    })
  );
  const feito = modulosConcluidos().includes(id);
  const botao = $("modulo-concluir");
  botao.disabled = feito;
  botao.textContent = feito ? "Módulo concluído" : "Marcar como concluído";
  avisar("modulo-feedback", "", "");
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  $("dlg-modulo").showModal();
}

// ---------- Ranking ----------

function medalhas(pontos) {
  const grupo = el("div", "insignias");
  CONQUISTAS.forEach((c, i) => {
    const ganhou = pontos >= c.min;
    const ins = el("span", `insignia i${i + 1}${ganhou ? "" : " vazia"}`);
    ins.title = ganhou ? c.nome : `${c.nome} (bloqueada)`;
    ins.setAttribute("role", "img");
    ins.setAttribute("aria-label", ins.title);
    ins.append(icone(c.icone));
    grupo.append(ins);
  });
  return grupo;
}

function renderizarRanking() {
  const corpo = $("ranking-corpo");
  const jogadores = [...lerJogadores()].sort((a, b) => b.pontos - a.pontos);
  const sessao = lerSessao();

  renderizarLado(jogadores, sessao);

  if (jogadores.length === 0) {
    const linha = el("tr");
    const celula = el("td", "", "Nenhum jogador cadastrado ainda.");
    celula.colSpan = 5;
    linha.append(celula);
    corpo.replaceChildren(linha);
    return;
  }

  // Critério 4: textContent em vez de innerHTML — um nome como
  // "<img onerror=...>" vira texto comum, não código executado.
  corpo.replaceChildren(
    ...jogadores.map((j, i) => {
      const linha = el("tr");
      if (sessao && sessao.email === j.email) linha.classList.add("eu");

      const celula = (rotulo, classe) => {
        const td = el("td", classe || "");
        td.dataset.label = rotulo;
        linha.append(td);
        return td;
      };

      celula("Posição").append(el("span", `pos${i < 3 ? ` pos-${i + 1}` : ""}`, String(i + 1)));

      const quem = celula("Jogador");
      const bloco = el("div", "jog");
      const avatar = el("span", "avatar");
      avatar.append(icone("i-usuario"));
      const nomes = el("span");
      nomes.append(el("span", "jog-nome", j.nome), el("span", "jog-escola", j.escola || "-"));
      bloco.append(avatar, nomes);
      quem.append(bloco);

      celula("Nível").append(el("span", "nivel", `Nível ${nivelDe(j.pontos)}`));

      const pts = celula("Pontos", "pontos");
      pts.append(document.createTextNode(String(j.pontos)), icone("i-folha"));

      celula("Conquistas").append(medalhas(j.pontos));
      return linha;
    })
  );
}

// Painel escuro "Sua posição"
function renderizarLado(jogadores, sessao) {
  const lado = $("rank-lado");
  lado.replaceChildren(el("h2", "", "Sua posição"));

  const eu = sessao && jogadores.find((j) => j.email === sessao.email);
  if (!eu) {
    lado.append(el("p", "lado-vazio", "Entre e jogue para aparecer no ranking."));
    const b = el("button", "btn btn-claro", "Entrar");
    b.type = "button";
    b.addEventListener("click", () => abrirModal("dlg-entrar"));
    lado.append(b);
    return;
  }

  const posicao = jogadores.findIndex((j) => j.email === eu.email) + 1;
  const nivel = nivelDe(eu.pontos);
  const xp = eu.pontos % PONTOS_NIVEL;

  const cartao = el("div", "lado-jogador");
  const avatar = el("span", "avatar");
  avatar.append(icone("i-usuario"));
  const dados = el("div");
  dados.append(el("span", "lado-nome", eu.nome), el("span", "lado-pos", `${posicao}º`));
  cartao.append(avatar, dados);

  const duplo = el("div", "lado-duplo");
  const colNivel = el("div");
  colNivel.append(el("small", "", "Nível"), el("b", "", String(nivel)));
  const barra = el("div", "barra");
  const preenchida = el("span");
  preenchida.style.width = `${(xp / PONTOS_NIVEL) * 100}%`;
  barra.append(preenchida);
  colNivel.append(barra, el("span", "lado-xp", `${xp} / ${PONTOS_NIVEL} pts`));
  const colPontos = el("div");
  colPontos.append(el("small", "", "Pontos"), el("b", "", String(eu.pontos)));
  duplo.append(colNivel, colPontos);

  const conquistas = el("ul", "lado-conquistas");
  CONQUISTAS.forEach((c, i) => {
    const ganhou = eu.pontos >= c.min;
    const li = el("li", ganhou ? "" : "trancada");
    const ins = el("span", `insignia i${i + 1}`);
    ins.append(icone(c.icone));
    li.append(ins, el("span", "", c.nome));
    conquistas.append(li);
  });

  const jogar = el("button", "btn btn-claro", "Jogar agora");
  jogar.type = "button";
  jogar.addEventListener("click", () => mostrarTela("tela-jogo"));

  lado.append(cartao, duplo, el("h2", "", "Conquistas"), conquistas, jogar);
}

// ---------- Conta ----------

function entrarComoJogador(jogador) {
  salvarSessao(jogador);
  atualizarTopo();
  mostrarTela("tela-jogo");
}

function cadastrar(dados) {
  const jogadores = lerJogadores();
  let jogador = jogadores.find((j) => j.email.toLowerCase() === dados.email.toLowerCase());

  if (!jogador) {
    jogador = { nome: dados.nome, email: dados.email, escola: dados.escola, pontos: 0 };
    jogadores.push(jogador);
    salvarJogadores(jogadores);
  }
  entrarComoJogador(jogador);
}

function somarPontos(qtd) {
  const sessao = lerSessao();
  if (!sessao) return;

  const jogadores = lerJogadores();
  const jogador = jogadores.find((j) => j.email === sessao.email);
  if (!jogador) return;

  jogador.pontos += qtd;
  salvarJogadores(jogadores);
  salvarSessao(jogador);

  $("jogador-pontos").textContent = jogador.pontos;
  $("chip-pontos").textContent = jogador.pontos;
  $("jogo-feedback").textContent = `+${qtd} pontos registrados e salvos.`;
}

// ---------- Modais ----------

function abrirModal(id) {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  const dlg = $(id);
  dlg.showModal();
  const primeiro = dlg.querySelector("input");
  if (primeiro) primeiro.focus();
}

function fecharModais() {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
}

function avisar(id, texto, tipo) {
  const e = $(id);
  e.textContent = texto;
  e.className = `feedback ${tipo || ""}`;
}

// ---------- Início ----------

function iniciar() {
  // Navegação: troca de seção sem recarregar a página (critério 2)
  document.querySelectorAll(".nav-btn[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => mostrarTela(btn.dataset.target));
  });
  document.querySelectorAll("[data-ir]").forEach((btn) => {
    btn.addEventListener("click", () => mostrarTela(btn.dataset.ir));
  });

  // Módulos de aprendizagem
  document.querySelectorAll("[data-modulo]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModulo(btn.dataset.modulo));
  });
  $("modulo-concluir").addEventListener("click", () => {
    if (!lerSessao()) {
      avisar("modulo-feedback", "Entre na sua conta para salvar o progresso.", "erro");
      return;
    }
    concluirModulo(moduloAberto);
    $("modulo-concluir").disabled = true;
    $("modulo-concluir").textContent = "Módulo concluído";
    avisar("modulo-feedback", "Progresso salvo!", "ok");
    atualizarProgresso();
  });

  // Abrir/fechar modais
  $("abrir-entrar").addEventListener("click", () => abrirModal("dlg-entrar"));
  $("abrir-cadastro").addEventListener("click", () => abrirModal("dlg-cadastro"));
  document.querySelectorAll("[data-abrir]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModal(btn.dataset.abrir));
  });
  document.querySelectorAll("[data-fechar]").forEach((btn) => {
    btn.addEventListener("click", fecharModais);
  });
  // Clique no fundo escuro fecha o modal
  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
  });

  // Cadastro
  $("form-cadastro").addEventListener("submit", (e) => {
    e.preventDefault(); // Critério 2: sem reload ao cadastrar
    const nome = $("nome").value.trim();
    const email = $("email").value.trim();
    const escola = $("escola").value.trim();

    if (nome.length < 2 || !email) {
      avisar("auth-feedback", "Preencha nome e e-mail.", "erro");
      return;
    }
    if (!$("email").checkValidity()) {
      avisar("auth-feedback", "Esse e-mail não parece válido.", "erro");
      return;
    }
    avisar("auth-feedback", "", "");
    $("form-cadastro").reset();
    fecharModais();
    cadastrar({ nome, email, escola });
  });

  // Entrar (só quem já tem cadastro neste navegador)
  $("form-entrar").addEventListener("submit", (e) => {
    e.preventDefault(); // Critério 2: sem reload ao entrar
    const email = $("entrar-email").value.trim().toLowerCase();
    if (!email) {
      avisar("entrar-feedback", "Digite o seu e-mail.", "erro");
      return;
    }
    const jogador = lerJogadores().find((j) => j.email.toLowerCase() === email);
    if (!jogador) {
      avisar("entrar-feedback", "Não encontramos esse e-mail. Cadastre-se primeiro.", "erro");
      return;
    }
    avisar("entrar-feedback", "", "");
    $("form-entrar").reset();
    fecharModais();
    entrarComoJogador(jogador);
  });

  // Ponte Godot → ranking: o jogo (dentro do iframe) manda
  // { tipo: "ngn_pontos", pontos: N } via postMessage (ver README).
  // Só aceita mensagens do próprio iframe do jogo, no mesmo site,
  // com um número inteiro positivo — o resto é ignorado em silêncio (critério 4).
  window.addEventListener("message", (e) => {
    const frame = $("jogo-frame");
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const { tipo, pontos } = e.data || {};
    if (tipo === "ngn_pontos" && Number.isInteger(pontos) && pontos > 0) somarPontos(pontos);
  });

  $("btn-sair").addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_SESSION);
    } catch {
      /* idem */
    }
    atualizarTopo();
    $("jogo-feedback").textContent = "";
    mostrarTela("tela-inicio");
  });

  // Critério 3: se já havia sessão, o F5 volta para a tela em que o jogador estava.
  atualizarTopo();
  mostrarTela(lerTelaSalva(), { foco: false });
}

document.addEventListener("DOMContentLoaded", iniciar);
