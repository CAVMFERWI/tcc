# NGN Technologies — Frontend

Site do projeto NGN Technologies, no visual do protótipo do Figma: área bege-creme, menu lateral verde escuro, títulos condensados e formas diagonais. Telas: Início, Aprender, Desafios (o jogo Godot "Missão 1: Cidade Resiliente"), Ranking e Sobre, com janelas de Entrar e Cadastre-se. HTML, CSS e JavaScript puros, sem build e sem bibliotecas.

## Como rodar

Abra `index.html` direto no navegador, ou publique a pasta no GitHub Pages / Vercel / Netlify.

As fontes (Barlow Condensed e Poppins, licença OFL) ficam em `fonts/`, então o site não depende de internet nem do Google Fonts.

## Enviando pontos do jogo para o ranking

O export HTML5 do Godot fica em `godot/` (arquivo `index.html`; no Godot 4, deixe **Thread Support** desligado no preset Web). A página carrega esse export num `<iframe>` e escuta mensagens `postMessage`.

No GDScript (Godot 4), o jogo avisa o site ao terminar uma partida:

```gdscript
func enviar_pontos(qtd: int) -> void:
	# Só existe no export Web; no editor/desktop não faz nada.
	if OS.has_feature("web"):
		JavaScriptBridge.eval(
			"window.parent.postMessage({tipo: 'ngn_pontos', pontos: %d}, window.location.origin)" % qtd
		)
```

A página soma os pontos ao jogador logado, salva no `localStorage` e atualiza o ranking. Mensagens de outra origem, de fora do iframe do jogo ou com valor que não seja inteiro positivo são ignoradas.

## Como o site guarda os dados

| Chave | Onde | O quê |
| --- | --- | --- |
| `ngn_players` | localStorage | lista de jogadores (nome, e-mail, escola, pontos) |
| `ngn_current_user` | localStorage | jogador logado |
| `ngn_modulos` | localStorage | módulos de Aprender concluídos, por e-mail |
| `ngn_tela` | sessionStorage | última tela aberta (o F5 volta para ela) |

Não há senha: o "login" é só por e-mail, dentro do próprio navegador. Nível = 1 + 1 a cada 150 pontos; conquistas aos 1, 300 e 600 pontos acumulados.

## Cache

Em `index.html`, o número depois de `?v=` em `styles.css` e `script.js` sobe a cada mudança, para o navegador não usar arquivos antigos (hoje: `?v=4`).

## Checklist dos 5 critérios de avaliação

| Critério | Atende? | Por quê |
| --- | --- | --- |
| 1. Deploy e Funcionamento | ✅ | Site estático (sem build), publicado no GitHub Pages. Caminhos relativos para `godot/` (`.wasm`/`.pck`) e `fonts/`. |
| 2. Interatividade sem Recarregamento | ✅ | Os formulários Entrar e Cadastre-se usam `e.preventDefault()`; o menu lateral troca `classList`, sem `<a href>` nem reload; módulos de Aprender abrem em `<dialog>`. |
| 3. Persistência de Dados | ✅ | Jogadores, sessão e módulos concluídos em `localStorage`; última tela em `sessionStorage`. Após F5, sessão e tela são restauradas. |
| 4. Estabilidade do Console | ✅ | Todo acesso ao storage está em `try/catch`; favicon vazio evita o 404; fontes locais; textos de usuário só entram com `textContent` (sem `innerHTML`); a ponte do jogo valida origem, iframe e valor. Testado sem erros no console. |
| 5. Adaptabilidade e Responsividade | ✅ | Testado de 360px a 1366px, sem scroll horizontal. Até 820px o menu lateral vira barra fixa embaixo; até 640px a tabela do ranking vira cartões. Acessibilidade: foco visível, link "Ir para o conteúdo", `<dialog>` com título e rótulos, `<caption>` e `scope` na tabela, `aria-label` nos ícones e respeito a `prefers-reduced-motion`. |

## Pendências para produção

- Ranking entre aparelhos e escolas: sincronizar com Firebase (ver seção 5.9.4 do projeto de pesquisa), mantendo o `localStorage` como cache local.
- Trocar o desenho do mapa e do Sérgio por arte exportada do Figma (`godot/` guarda o export do jogo; ver `NGN-Godot/LEIAME.md`).

https://cavmferwi.github.io/tcc/
