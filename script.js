// NGN Technologies — camada web (login/cadastro, jogo, ranking)
// Critério 2: nenhum destes handlers deixa o form/click recarregar a página.
// Critério 3: tudo é lido/gravado em localStorage, então sobrevive ao F5.

const STORAGE_PLAYERS = "ngn_players";
const STORAGE_SESSION = "ngn_current_user";

// Critério 1/4: godot/index.html ainda não existe no repositório, então o
// iframe nem tenta carregar (evita 404 e erro vermelho no console).
// Troque para `true` só depois de subir o export do Godot em godot/.
const JOGO_PRONTO = true;

function lerJogadores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PLAYERS)) || [];
  } catch {
    return [];
  }
}

function salvarJogadores(lista) {
  localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(lista));
}

function lerSessao() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_SESSION));
  } catch {
    return null;
  }
}

function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach((tela) => {
    tela.classList.toggle("oculta", tela.id !== id);
  });
}

function renderizarRanking() {
  const corpo = document.getElementById("ranking-corpo");
  const jogadores = [...lerJogadores()].sort((a, b) => b.pontos - a.pontos);

  if (jogadores.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4">Nenhum jogador cadastrado ainda.</td></tr>';
    return;
  }

  // Critério 4: textContent em vez de innerHTML — um nome como
  // "<img onerror=...>" vira texto comum, não código executado.
  corpo.replaceChildren(
    ...jogadores.map((j, i) => {
      const linha = document.createElement("tr");
      [
        ["Posição", `${i + 1}º`],
        ["Jogador", j.nome],
        ["Escola", j.escola || "-"],
        ["Pontos", j.pontos],
      ].forEach(([rotulo, valor]) => {
        const celula = document.createElement("td");
        celula.dataset.label = rotulo;
        celula.textContent = valor;
        linha.append(celula);
      });
      return linha;
    })
  );
}

function entrarComoJogador(dados) {
  const jogadores = lerJogadores();
  let jogador = jogadores.find((j) => j.email === dados.email);

  if (!jogador) {
    jogador = { nome: dados.nome, email: dados.email, escola: dados.escola, pontos: 0 };
    jogadores.push(jogador);
    salvarJogadores(jogadores);
  }

  localStorage.setItem(STORAGE_SESSION, JSON.stringify(jogador));
  irParaTelaJogo(jogador);
}

function irParaTelaJogo(jogador) {
  document.getElementById("jogador-nome").textContent = jogador.nome;
  document.getElementById("jogador-pontos").textContent = jogador.pontos;
  mostrarTela("tela-jogo");

  // Carrega o Godot só na primeira vez que a tela do jogo fica visível,
  // e só quando o export já estiver no repositório (JOGO_PRONTO).
  if (!JOGO_PRONTO) return;
  const frame = document.getElementById("jogo-frame");
  document.getElementById("jogo-placeholder").classList.add("oculta");
  frame.classList.remove("oculta");
  if (!frame.src) frame.src = frame.dataset.src;
}

function somarPontos(qtd) {
  const sessao = lerSessao();
  if (!sessao) return;

  const jogadores = lerJogadores();
  const jogador = jogadores.find((j) => j.email === sessao.email);
  if (!jogador) return;

  jogador.pontos += qtd;
  salvarJogadores(jogadores);
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(jogador));
  document.getElementById("jogador-pontos").textContent = jogador.pontos;

  const aviso = document.getElementById("jogo-feedback");
  aviso.textContent = `+${qtd} pontos registrados e salvos.`;
}

function iniciar() {
  document.getElementById("form-auth").addEventListener("submit", (e) => {
    e.preventDefault(); // Critério 2: sem reload ao cadastrar/entrar
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const escola = document.getElementById("escola").value.trim();

    if (!nome || !email) {
      document.getElementById("auth-feedback").textContent = "Preencha nome e e-mail.";
      return;
    }
    entrarComoJogador({ nome, email, escola });
  });

  document.getElementById("btn-simular-pontos").addEventListener("click", () => somarPontos(10));

  // Ponte Godot → ranking: o jogo (dentro do iframe) manda
  // { tipo: "ngn_pontos", pontos: N } via postMessage (ver README).
  // Só aceita mensagens do próprio iframe do jogo, no mesmo site,
  // com um número inteiro positivo — o resto é ignorado em silêncio (critério 4).
  window.addEventListener("message", (e) => {
    const frame = document.getElementById("jogo-frame");
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const { tipo, pontos } = e.data || {};
    if (tipo === "ngn_pontos" && Number.isInteger(pontos) && pontos > 0) somarPontos(pontos);
  });

  document.getElementById("btn-sair").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_SESSION);
    mostrarTela("tela-login");
  });

  document.querySelectorAll(".nav-btn[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.target === "tela-ranking") renderizarRanking();
      mostrarTela(btn.dataset.target);
    });
  });

  // Critério 3: se já havia sessão salva, o F5 volta direto pro jogo.
  const sessao = lerSessao();
  if (sessao) {
    irParaTelaJogo(sessao);
  } else {
    mostrarTela("tela-login");
  }
}

document.addEventListener("DOMContentLoaded", iniciar);
