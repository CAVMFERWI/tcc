// NGN Technologies — ranking online (Firebase Firestore)
// O cadastro, a sessão e o progresso continuam no localStorage (critério 3).
// Aqui só vai o RANKING: nome, escola e melhor pontuação de cada jogador,
// para que todos vejam a mesma lista em qualquer aparelho.
// Segurança: login anônimo do Firebase + regras do Firestore (cada navegador
// só cria e melhora a própria pontuação, 0 a 700, sem apagar a dos outros).
// Qualquer falha (sem internet, bloqueio) é engolida: o site volta ao ranking local
// e o Console continua sem erros (critério 4).

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const CONFIG = {
  apiKey: "AIzaSyAyDXu-3bF3PpcftJzn6wOSH3d14E9mkxE",
  authDomain: "ngn-technologies.firebaseapp.com",
  projectId: "ngn-technologies",
  storageBucket: "ngn-technologies.firebasestorage.app",
  messagingSenderId: "877622666563",
  appId: "1:877622666563:web:694a7f518db2966f7afbf6",
};

let fb = null; // { db, uid, fs }

async function conectar() {
  if (fb) return fb;
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(SDK + "firebase-app.js"),
    import(SDK + "firebase-auth.js"),
    import(SDK + "firebase-firestore.js"),
  ]);
  fs.setLogLevel("silent");
  const app = initializeApp(CONFIG);
  const a = auth.getAuth(app);
  const cred = await auth.signInAnonymously(a);
  fb = { db: fs.getFirestore(app), uid: cred.user.uid, fs };
  return fb;
}

// Envia a melhor pontuação do jogador. Devolve o id usado (pode mudar se o
// login anônimo deste navegador for outro, ex.: depois de limpar os dados).
async function enviar(jogador) {
  try {
    const { db, uid, fs } = await conectar();
    const dados = (id) =>
      fs.setDoc(fs.doc(db, "ranking", id), {
        nome: String(jogador.nome || "Jogador").slice(0, 40),
        escola: String(jogador.escola || "").slice(0, 60),
        pontos: jogador.pontos,
        dono: uid,
        atualizado: fs.serverTimestamp(),
      });
    if (jogador.idOnline) {
      try {
        await dados(jogador.idOnline);
        return jogador.idOnline;
      } catch (e) {
        // só cria um registro novo se o antigo pertence a outro login anônimo
        if (!e || e.code !== "permission-denied") return null;
      }
    }
    const novo = crypto.randomUUID();
    await dados(novo);
    return novo;
  } catch {
    return null;
  }
}

// Os 50 melhores do ranking online, ou null se não der para buscar.
async function listar() {
  try {
    const { db, fs } = await conectar();
    const q = fs.query(fs.collection(db, "ranking"), fs.orderBy("pontos", "desc"), fs.limit(50));
    const snap = await fs.getDocs(q);
    return snap.docs.map((d) => {
      const v = d.data();
      return { idOnline: d.id, nome: String(v.nome), escola: String(v.escola || ""), pontos: Number(v.pontos) || 0 };
    });
  } catch {
    return null;
  }
}

window.NGNOnline = { enviar, listar };
document.dispatchEvent(new Event("ngn-online-pronto"));
