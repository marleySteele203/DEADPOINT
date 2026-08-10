// ==========================================
// CONFIGURAÇÕES GERAIS
// ==========================================
// CONTROLE DE STATUS DO RECRUTAMENTO (true = aberto, false = fechado)
const recrutamentoAberto = true;

// URL do Webhook do Discord
const WEBHOOK_URL = "https://discord.com/api/webhooks/1524955282424336425/4oi-s53iIMkFYuh7IB0f78vSvthzM3tdVq4E2NIX1HpNiVgGQl-RiOqDnELVrMyKznwm";

// ==========================================
// INICIALIZAÇÃO DA PÁGINA & EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    configurarPaginaRecrutamento();

    // Event Listener para envio do formulário
    const formInscricao = document.getElementById("form-inscricao");
    if (formInscricao) {
        formInscricao.addEventListener("submit", enviarParaDiscord);
    }

    // Event Listener para alteração da Role (Função)
    const selectRole = document.getElementById("player-role");
    if (selectRole) {
        selectRole.addEventListener("change", (e) => verificarRole(e.target.value));
    }

    // Event Listeners para salvar rascunho em tempo real
    const inputNick = document.getElementById("player-nick");
    const inputContact = document.getElementById("player-contact");
    const inputMotive = document.getElementById("player-motive");

    if (inputNick) inputNick.addEventListener("input", salvarRascunho);
    if (inputContact) inputContact.addEventListener("input", salvarRascunho);
    if (inputMotive) inputMotive.addEventListener("input", salvarRascunho);
});

// ==========================================
// CONTROLE DE INTERFACE (STATUS DO RECRUTAMENTO)
// ==========================================
function configurarPaginaRecrutamento() {
    const tag = document.getElementById('status-tag');
    const title = document.getElementById('status-title');
    const desc = document.getElementById('status-desc');
    const formContainer = document.getElementById('form-container');
    const closedContainer = document.getElementById('closed-container');
    const watermark = document.getElementById('bg-watermark');

    if (!tag || !title || !desc || !formContainer || !closedContainer || !watermark) return;

    if (recrutamentoAberto) {
        tag.className = "inline-flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4";
        tag.innerHTML = `<i class="fa-solid fa-circle text-[8px] animate-pulse"></i> Vagas Disponíveis`;
        title.innerHTML = "Inscrições <span class='text-deadpoint-orange'>Abertas</span>";
        desc.innerText = "Nosso roster está em processo de expansão. Preencha o formulário tático ao lado para a staff analisar as suas estatísticas.";
        
        formContainer.classList.remove('hidden');
        closedContainer.classList.add('hidden');
        closedContainer.classList.remove('flex');
        watermark.innerText = "OPEN";
        
        carregarRascunho();
    } else {
        tag.className = "inline-flex items-center gap-2 bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4";
        tag.innerHTML = `<i class="fa-solid fa-circle text-[8px]"></i> Roster Fechado`;
        title.innerHTML = "Recrutamento <span class='text-rose-500'>Pausado</span>";
        desc.innerText = "Atualmente todas as vagas oficiais foram preenchidas. A equipe encontra-se focada e em período de preparação para campeonatos.";
        
        formContainer.classList.add('hidden');
        closedContainer.classList.remove('hidden');
        closedContainer.classList.add('flex');
        watermark.innerText = "CLOSED";
    }
}

// ==========================================
// SISTEMA DE NOTIFICAÇÃO (TOAST)
// ==========================================
function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isSucesso = tipo === 'sucesso';
    const bgClass = isSucesso ? 'bg-deadpoint-blue border-emerald-500/50 text-emerald-400' : 'bg-deadpoint-blue border-rose-500/50 text-rose-400';
    const icone = isSucesso ? 'fa-circle-check' : 'fa-triangle-exclamation';
    
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-bold uppercase tracking-wider animate-pop-in ${bgClass}`;
    toast.innerHTML = `<i class="fa-solid ${icone} text-base"></i><span>${mensagem}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// SISTEMA DE RASCUNHO (LOCALSTORAGE)
// ==========================================
function salvarRascunho() {
    const nick = document.getElementById('player-nick')?.value || '';
    const contact = document.getElementById('player-contact')?.value || '';
    const motive = document.getElementById('player-motive')?.value || '';

    const rascunho = { nick, contact, motive };
    localStorage.setItem('dp_recrutamento_rascunho', JSON.stringify(rascunho));
}

function carregarRascunho() {
    const salvo = localStorage.getItem('dp_recrutamento_rascunho');
    if (salvo) {
        const dados = JSON.parse(salvo);
        const nickInput = document.getElementById('player-nick');
        const contactInput = document.getElementById('player-contact');
        const motiveInput = document.getElementById('player-motive');

        if (nickInput) nickInput.value = dados.nick || '';
        if (contactInput) contactInput.value = dados.contact || '';
        if (motiveInput) motiveInput.value = dados.motive || '';
    }
}

function limparRascunho() {
    localStorage.removeItem('dp_recrutamento_rascunho');
}

// ==========================================
// DINAMISMO DO CAMPO CPT
// ==========================================
function verificarRole(valor) {
    const grupoEspecializacao = document.getElementById('grupo-especializacao');
    const selectEspecializacao = document.getElementById('player-specialization');

    if (!grupoEspecializacao || !selectEspecializacao) return;

    if (valor === "CPT") {
        grupoEspecializacao.classList.remove('hidden');
        selectEspecializacao.required = true;
    } else {
        grupoEspecializacao.classList.add('hidden');
        selectEspecializacao.required = false;
        selectEspecializacao.value = ""; 
    }
}

// ==========================================
// ENVIO PARA O DISCORD VIA WEBHOOK
// ==========================================
function enviarParaDiscord(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btn-submit');
    const nick = document.getElementById('player-nick').value;
    const role = document.getElementById('player-role').value;
    const spec = document.getElementById('player-specialization').value;
    const contact = document.getElementById('player-contact').value;
    const motive = document.getElementById('player-motive').value;

    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando dados...`;
    btnSubmit.disabled = true;

    const roleFormatada = role === "CPT" ? `👑 CPT (Spec: ${spec})` : role;

    const embedData = {
        username: "DEADPOINT RECRUITMENT",
        embeds: [{
            title: "📝 NOVA CANDIDATURA TÁTICA",
            color: 16723456, // Cor Laranja
            fields: [
                { name: "🎮 Nickname", value: `**${nick}**`, inline: true },
                { name: "🎯 Função / Role", value: roleFormatada, inline: true },
                { name: "📞 Contato / Instagram", value: contact, inline: false },
                { name: "💬 Motivação / Por que quer a vaga?", value: motive, inline: false }
            ],
            footer: { text: "DEADPOINT Official Recruitment System" },
            timestamp: new Date().toISOString()
        }]
    };

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedData)
    })
    .then(response => {
        if (response.ok) {
            mostrarToast('Candidatura enviada com sucesso para o QG! Boa sorte.', 'sucesso');
            document.getElementById('form-inscricao').reset();
            document.getElementById('grupo-especializacao').classList.add('hidden');
            limparRascunho();
        } else {
            mostrarToast('Erro ao processar o envio. Verifique o Webhook.', 'erro');
        }
    })
    .catch(error => {
        console.error('Erro de rede:', error);
        mostrarToast('Erro de conexão com os servidores do Discord.', 'erro');
    })
    .finally(() => {
        btnSubmit.innerHTML = `<span>Enviar Candidatura</span> <i class="fa-solid fa-paper-plane"></i>`;
        btnSubmit.disabled = false;
    });
}