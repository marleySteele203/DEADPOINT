// Configuração do Supabase Client
const SUPABASE_URL = 'https://vqlntcqsgsgbgwejwsen.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OKefDfosaW_yyjyLtLgMiA_3FyWl182';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let conquistasGlobais = [];

// Busca dados da tabela 'achievements'
async function carregarConquistas() {
    const trophyGrid = document.getElementById('trophy-grid');

    try {
        const { data: conquistas, error } = await supabaseClient
            .from('achievements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        conquistasGlobais = conquistas || [];
        renderizarTrofeus(conquistasGlobais);
        atualizarEstatisticas(conquistasGlobais);

    } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err.message);
        if (trophyGrid) {
            trophyGrid.innerHTML = `<p style="color: #ff4d4d; grid-column: 1/-1; text-align: center;">Erro ao carregar conquistas. Verifique o console.</p>`;
        }
    }
}

// Verifica se é TOP 1 (Ouro) de forma rigorosa baseada no placement
function checarSeEhOuro(placement) {
    const pos = (placement || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Retorna verdadeiro se for estritamente TOP 1, 1º lugar ou campeão
    return pos.includes('TOP 1') || 
           pos.includes('1º') || 
           pos.includes('1 LUGAR') ||
           pos.includes('CAMPEAO') || 
           pos.includes('PRIMEIRO');
}

// Monta os cards de troféu no HTML
function renderizarTrofeus(lista) {
    const trophyGrid = document.getElementById('trophy-grid');
    if (!trophyGrid) return;
    trophyGrid.innerHTML = '';

    if (lista.length === 0) {
        trophyGrid.innerHTML = `<p style="color: #aaa; grid-column: 1/-1; text-align: center;">Nenhum título cadastrado até o momento.</p>`;
        return;
    }

    lista.forEach((item) => {
        const isGold = checarSeEhOuro(item.placement);
        
        const tierClass = isGold ? 'gold-tier' : 'silver-tier';
        const categoryAttr = isGold ? 'gold' : 'silver';
        const iconName = item.icon || 'fa-trophy';

        const card = document.createElement('div');
        card.className = `trophy-card ${tierClass}`;
        card.setAttribute('data-category', categoryAttr);
        // Usa o ID do banco em vez do index do array para segurança
        card.onclick = () => abrirModalPorId(item.id);

        card.innerHTML = `
            <div class="trophy-badge">${item.placement || 'PÓDIO'}</div>
            <div class="trophy-icon-box"><i class="fa-solid ${iconName}"></i></div>
            <div class="trophy-info">
                <h2>${item.title || 'Torneio'}</h2>
                <span class="tournament-tag">${item.game || 'FREE FIRE'} • ${item.date || ''}</span>
                <p class="trophy-desc">${item.description || 'Sem descrição informada.'}</p>
                <div class="trophy-footer">
                    <span class="date" style="color: #00ffff;"><i class="fa-solid fa-trophy"></i> Prémio: ${item.prize || 'Glória'}</span>
                </div>
            </div>
        `;
        trophyGrid.appendChild(card);
    });
}

// Atualiza estatísticas separando perfeitamente Top 1 (Ouros) e Top 2 (Pratas)
function atualizarEstatisticas(lista) {
    let ouros = 0;
    let pratas = 0;

    lista.forEach(item => {
        if (checarSeEhOuro(item.placement)) {
            ouros++;
        } else {
            pratas++;
        }
    });

    const elTotal = document.getElementById('total-trofeus');
    const elOuros = document.getElementById('total-ouros');
    const elPratas = document.getElementById('total-pratas');

    if (elTotal) elTotal.innerText = lista.length;
    if (elOuros) elOuros.innerText = ouros;
    if (elPratas) elPratas.innerText = pratas;
}

// Filtro por categoria (Todos, Ouro, Prata)
function filtrarTrofeus(categoria, event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    const cards = document.querySelectorAll('.trophy-card');

    cards.forEach(card => {
        const catCard = card.getAttribute('data-category');
        if (categoria === 'all' || catCard === categoria) {
            card.style.display = "flex";
            setTimeout(() => card.style.opacity = "1", 50);
        } else {
            card.style.opacity = "0";
            setTimeout(() => card.style.display = "none", 300);
        }
    });
}

// Exibe a modal buscando pelo ID exato do registro
function abrirModalPorId(id) {
    const item = conquistasGlobais.find(conq => conq.id === id);
    if (!item) return;

    document.getElementById('modal-titulo').innerText = item.title || 'Título';
    document.getElementById('modal-tag').innerText = `${item.game || 'FREE FIRE'} — ${item.date || ''} (Prêmio: ${item.prize || 'N/A'})`;
    document.getElementById('modal-badge').innerText = item.placement || 'PÓDIO';
    document.getElementById('modal-desc').innerText = item.description || 'Nenhum detalhe adicional fornecido.';

    const grid = document.getElementById('modal-players-grid');
    if (grid) {
        grid.innerHTML = '';
        let players = [];
        try {
            players = typeof item.lineup === 'string' ? JSON.parse(item.lineup) : (item.lineup || []);
        } catch (e) {
            players = [];
        }

        if (players.length > 0) {
            players.forEach(p => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-hover-card';
                playerCard.innerHTML = `
                    <div class="player-photo-container">
                        <img src="${p.foto || 'default.png'}" alt="${p.nick}">
                    </div>
                    <div class="player-details-reveal">
                        <span class="player-nick">${p.nick}</span>
                        <span class="player-role">${p.role}</span>
                    </div>
                `;
                grid.appendChild(playerCard);
            });
        } else {
            grid.innerHTML = `<p style="color: #777; font-size: 0.9rem; grid-column: 1/-1;">Elenco padrão DEADPOINT.</p>`;
        }
    }

    const modal = document.getElementById('modal-conquista');
    if (modal) modal.classList.add('active');
}

function fecharModal() {
    const modal = document.getElementById('modal-conquista');
    if (modal) modal.classList.remove('active');
}

window.onclick = function(event) {
    const modal = document.getElementById('modal-conquista');
    if (event.target === modal) {
        fecharModal();
    }
};

// Escuta atualizações em tempo real direto da tabela 'achievements'
function escutarAlteracoesRealtime() {
    supabaseClient
        .channel('achievements-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'achievements' },
            () => {
                carregarConquistas();
            }
        )
        .subscribe();
}

window.onload = () => {
    carregarConquistas();
    escutarAlteracoesRealtime();
};