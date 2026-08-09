// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://vqlntcqsgsgbgwejwsen.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OKefDfosaW_yyjyLtLgMiA_3FyWl182';

// Inicialização segura do cliente
let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("SDK do Supabase não carregado corretamente no HTML.");
}

const roleColors = {
    "RUSH": "#ff4500",
    "RUSH N1": "#ff0000",
    "RUSH N2": "#ff6600",
    "RUSH N3": "#ffcc00",
    "SNIPER": "#00ffff",
    "CEO": "#ff0055",
    "GRANADEIRO": "#00ff00",
    "SUPORTE": "#9933ff"
};

let players = [];
let currentIndex = 0;
let isAnimating = false;

// PARSER SEGURO PARA ESTATÍSTICAS
function parsePlayerStats(rawStats) {
    let s = rawStats;
    if (typeof s === 'string') {
        try { s = JSON.parse(s); } catch (e) { s = {}; }
    }
    s = s || {};

    const kd = parseFloat(s.kd) || 0;
    const hs = parseFloat(s.hs) || 0;
    const dmg = parseFloat(s.dmg) || 0;
    const kp = parseFloat(s.kp) || 0;

    // Cálculo automático das porcentagens das barras se não vierem do banco
    const kdPct = s.kdPct || `${Math.min((kd / 4.0) * 100, 100)}%`;
    const hsPct = s.hsPct || `${Math.min(hs, 100)}%`;
    const dmgPct = s.dmgPct || `${Math.min((dmg / 2000) * 100, 100)}%`;
    const kpPct = s.kpPct || `${Math.min(kp, 100)}%`;

    return { kd, hs, dmg, kp, kdPct, hsPct, dmgPct, kpPct };
}

// CARREGAR JOGADORES DO SUPABASE
async function fetchPlayersFromSupabase() {
    if (!supabaseClient) {
        console.warn("Cliente Supabase não disponível. Usando array vazio.");
        updateShowcase();
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('players')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            players = data.map(p => ({
                ...p,
                stats: parsePlayerStats(p.stats)
            }));
        } else {
            console.warn("Nenhum jogador encontrado no Supabase.");
            players = [];
        }
    } catch (err) {
        console.error("Erro ao carregar do Supabase:", err.message);
        players = [];
    } finally {
        renderThumbnails();
        updateShowcase();
    }
}

function handleSocialClick(event, platform) {
    const player = players[currentIndex];
    if (!player) return;
    const url = player[platform];
    const invalidUrls = ["https://instagram.com", "https://instagram.com/", "https://tiktok.com", "https://tiktok.com/", "", "#"];

    if (!url || invalidUrls.includes(url.trim())) {
        event.preventDefault();
        alert("Rede social não informada para este jogador.");
    }
}

function getRoleColors(roleString) {
    if (!roleString) return { primary: "#ffffff", secondary: "#ffffff" };
    const cleanRoles = roleString.split('/').map(r => r.trim().toUpperCase());
    let primaryColor = roleColors[cleanRoles[0]] || "#ffffff";
    let secondaryColor = cleanRoles[1] ? (roleColors[cleanRoles[1]] || primaryColor) : primaryColor;
    return { primary: primaryColor, secondary: secondaryColor };
}

/* --- MINIATURAS (THUMBNAILS) --- */
function renderThumbnails() {
    const container = document.getElementById('thumbnails-scroll');
    if (!container) return;
    container.innerHTML = '';

    if (players.length === 0) {
        container.innerHTML = '<span style="color: #666; font-size: 14px;">Nenhum jogador cadastrado.</span>';
        return;
    }

    players.forEach((p, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${idx === currentIndex ? 'active' : ''}`;
        thumb.onclick = () => selectPlayerByIndex(idx);

        const imgSrc = p.img || 'https://via.placeholder.com/100?text=DP';
        const nickText = p.nick || 'JOGADOR';

        thumb.innerHTML = `
            <img src="${imgSrc}" alt="${nickText}" onerror="this.onerror=null; this.src='https://via.placeholder.com/100?text=DP';">
            <span class="thumb-nick">${nickText}</span>
        `;
        container.appendChild(thumb);
    });
}

function updateThumbnailsActive() {
    const thumbs = document.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
        if (i === currentIndex) {
            t.classList.add('active');
            t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            t.classList.remove('active');
        }
    });
}

function selectPlayerByIndex(index) {
    if (index === currentIndex || isAnimating) return;
    const direction = index > currentIndex ? 1 : -1;
    currentIndex = index;
    updateShowcase(direction);
}

function changePlayer(direction) {
    if (isAnimating || players.length === 0) return;
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = players.length - 1;
    if (currentIndex >= players.length) currentIndex = 0;
    updateShowcase(direction);
}

function updateShowcase(direction = 1) {
    const imgContainer = document.getElementById('player-img-container');
    const infoSide = document.querySelector('.player-info-side');
    const watermark = document.getElementById('bg-watermark');

    if (players.length === 0) {
        if (watermark) watermark.innerText = 'DEADPOINT';
        if (document.getElementById('player-nick')) document.getElementById('player-nick').innerText = 'SEM JOGADORES';
        if (document.getElementById('player-name')) document.getElementById('player-name').innerText = 'Cadastre a lineup no painel admin';
        if (document.getElementById('player-role')) document.getElementById('player-role').innerText = 'ROSTER VAZIO';
        if (document.getElementById('player-country')) document.getElementById('player-country').innerHTML = `—`;
        if (document.getElementById('player-bio')) document.getElementById('player-bio').innerText = 'Nenhum jogador cadastrado no Supabase no momento.';
        if (document.getElementById('player-img')) document.getElementById('player-img').src = 'https://via.placeholder.com/400x500/0b0e14/ffffff?text=DEADPOINT';
        if (document.getElementById('link-ig')) document.getElementById('link-ig').href = '#';
        if (document.getElementById('link-tk')) document.getElementById('link-tk').href = '#';
        renderThumbnails();
        return;
    }

    isAnimating = true;

    if (imgContainer) imgContainer.classList.add('slide-out-left');
    if (infoSide) infoSide.classList.add('slide-out-right');
    if (watermark) watermark.style.opacity = "0";

    updateThumbnailsActive();

    setTimeout(() => {
        const p = players[currentIndex];
        const colors = getRoleColors(p.role);

        if (imgContainer) {
            imgContainer.style.setProperty('--role-color-primary', colors.primary);
            imgContainer.style.setProperty('--role-color-secondary', colors.secondary);
        }

        const nick = p.nick || '—';
        const name = p.name || '—';
        const role = p.role || '—';
        const country = p.country || '—';
        const flagClass = p.flag_class || p.flagclass || p.flagClass || '';
        const bio = p.bio || 'Sem biografia informada.';
        const img = p.img || 'https://via.placeholder.com/400x500/0b0e14/ffffff?text=DEADPOINT';

        if (document.getElementById('player-nick')) document.getElementById('player-nick').innerText = nick;
        if (watermark) watermark.innerText = nick;
        if (document.getElementById('player-name')) document.getElementById('player-name').innerText = name;
        if (document.getElementById('player-role')) document.getElementById('player-role').innerText = role;
        if (document.getElementById('player-country')) {
            document.getElementById('player-country').innerHTML = flagClass ? `<span class="${flagClass}"></span> ${country}` : country;
        }
        
        if (document.getElementById('player-bio')) document.getElementById('player-bio').innerText = bio;
        if (document.getElementById('player-img')) document.getElementById('player-img').src = img;
        if (document.getElementById('link-ig')) document.getElementById('link-ig').href = p.ig || '#';
        if (document.getElementById('link-tk')) document.getElementById('link-tk').href = p.tk || '#';

        updateModalData();

        if (imgContainer) imgContainer.classList.remove('slide-out-left');
        if (infoSide) infoSide.classList.remove('slide-out-right');
        if (watermark) watermark.style.opacity = "0.03";

        isAnimating = false;
    }, 350);
}

/* --- MODAL ESTATÍSTICAS --- */
function updateModalData() {
    if (players.length === 0) return;
    const p = players[currentIndex];
    const colors = getRoleColors(p.role);
    const modal = document.getElementById('stats-modal');

    if (modal) {
        modal.style.setProperty('--modal-primary', colors.primary);
        modal.style.setProperty('--modal-secondary', colors.secondary);
    }

    const stats = p.stats || {};

    if (document.getElementById('modal-title')) document.getElementById('modal-title').innerText = `DESEMPENHO: ${p.nick || ''}`;
    if (document.getElementById('stat-kd-val')) document.getElementById('stat-kd-val').innerText = stats.kd;
    if (document.getElementById('stat-hs-val')) document.getElementById('stat-hs-val').innerText = stats.hs + '%';
    if (document.getElementById('stat-dmg-val')) document.getElementById('stat-dmg-val').innerText = stats.dmg;
    if (document.getElementById('stat-kp-val')) document.getElementById('stat-kp-val').innerText = stats.kp + '%';

    if (document.getElementById('bar-kd')) document.getElementById('bar-kd').style.width = '0%';
    if (document.getElementById('bar-hs')) document.getElementById('bar-hs').style.width = '0%';
    if (document.getElementById('bar-dmg')) document.getElementById('bar-dmg').style.width = '0%';
    if (document.getElementById('bar-kp')) document.getElementById('bar-kp').style.width = '0%';
}

function toggleStatsModal(show) {
    const modal = document.getElementById('stats-modal');
    if (players.length === 0 || !modal) return;
    const p = players[currentIndex];
    const stats = p.stats || {};

    if (show) {
        updateModalData();
        modal.classList.add('active');
        
        setTimeout(() => {
            if (document.getElementById('bar-kd')) document.getElementById('bar-kd').style.width = stats.kdPct;
            if (document.getElementById('bar-hs')) document.getElementById('bar-hs').style.width = stats.hsPct;
            if (document.getElementById('bar-dmg')) document.getElementById('bar-dmg').style.width = stats.dmgPct;
            if (document.getElementById('bar-kp')) document.getElementById('bar-kp').style.width = stats.kpPct;
        }, 150);
    } else {
        modal.classList.remove('active');
    }
}

/* --- MODO COMPARATIVO (VERSUS) --- */
function populateCompareSelects() {
    const s1 = document.getElementById('select-p1');
    const s2 = document.getElementById('select-p2');
    if (!s1 || !s2) return;

    s1.innerHTML = '';
    s2.innerHTML = '';

    players.forEach((p, idx) => {
        s1.innerHTML += `<option value="${idx}">${p.nick || 'Jogador ' + (idx + 1)}</option>`;
        s2.innerHTML += `<option value="${idx}">${p.nick || 'Jogador ' + (idx + 1)}</option>`;
    });

    s1.value = currentIndex;
    s2.value = (currentIndex + 1) % players.length;
}

function openCompareModal() {
    if (players.length < 2) {
        alert("É necessário pelo menos 2 jogadores salvos no Supabase para usar a comparação.");
        return;
    }
    populateCompareSelects();
    renderComparison();
    toggleCompareModal(true);
}

function toggleCompareModal(show) {
    const modal = document.getElementById('compare-modal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function renderComparison() {
    const s1 = document.getElementById('select-p1');
    const s2 = document.getElementById('select-p2');
    if (!s1 || !s2) return;

    const idx1 = parseInt(s1.value);
    const idx2 = parseInt(s2.value);

    const p1 = players[idx1];
    const p2 = players[idx2];

    if (!p1 || !p2) return;

    const st1 = p1.stats || {};
    const st2 = p2.stats || {};

    if (document.getElementById('p1-img')) document.getElementById('p1-img').src = p1.img || 'https://via.placeholder.com/100?text=DP';
    if (document.getElementById('p1-nick')) document.getElementById('p1-nick').innerText = p1.nick || '—';
    if (document.getElementById('p1-role')) document.getElementById('p1-role').innerText = p1.role || '—';

    if (document.getElementById('p2-img')) document.getElementById('p2-img').src = p2.img || 'https://via.placeholder.com/100?text=DP';
    if (document.getElementById('p2-nick')) document.getElementById('p2-nick').innerText = p2.nick || '—';
    if (document.getElementById('p2-role')) document.getElementById('p2-role').innerText = p2.role || '—';

    setStatComparison('cmp-p1-kd', 'cmp-p2-kd', st1.kd || 0, st2.kd || 0, '');
    setStatComparison('cmp-p1-hs', 'cmp-p2-hs', st1.hs || 0, st2.hs || 0, '%');
    setStatComparison('cmp-p1-dmg', 'cmp-p2-dmg', st1.dmg || 0, st2.dmg || 0, '');
    setStatComparison('cmp-p1-kp', 'cmp-p2-kp', st1.kp || 0, st2.kp || 0, '%');
}

function setStatComparison(id1, id2, val1, val2, suffix) {
    const el1 = document.getElementById(id1);
    const el2 = document.getElementById(id2);
    if (!el1 || !el2) return;

    el1.innerText = val1 + suffix;
    el2.innerText = val2 + suffix;

    el1.classList.remove('winner', 'loser');
    el2.classList.remove('winner', 'loser');

    if (val1 > val2) {
        el1.classList.add('winner');
        el2.classList.add('loser');
    } else if (val2 > val1) {
        el2.classList.add('winner');
        el1.classList.add('loser');
    }
}

function handleOutsideModalClick(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'stats-modal') toggleStatsModal(false);
        if (modalId === 'compare-modal') toggleCompareModal(false);
    }
}

// Eventos de Teclado
document.addEventListener('keydown', (e) => {
    const statsModal = document.getElementById('stats-modal');
    const compareModal = document.getElementById('compare-modal');

    const statsModalActive = statsModal && statsModal.classList.contains('active');
    const compareModalActive = compareModal && compareModal.classList.contains('active');

    if (e.key === 'Escape') {
        if (statsModalActive) toggleStatsModal(false);
        if (compareModalActive) toggleCompareModal(false);
    } else if (!statsModalActive && !compareModalActive) {
        if (e.key === 'ArrowRight') changePlayer(1);
        if (e.key === 'ArrowLeft') changePlayer(-1);
    }
});

// Touch / Swipe
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('DOMContentLoaded', () => {
    const sliderZone = document.getElementById('slider-zone');
    if (sliderZone) {
        sliderZone.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sliderZone.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    fetchPlayersFromSupabase();
});

function handleSwipe() {
    const statsModal = document.getElementById('stats-modal');
    const compareModal = document.getElementById('compare-modal');

    if ((statsModal && statsModal.classList.contains('active')) || 
        (compareModal && compareModal.classList.contains('active'))) return;

    const threshold = 50;
    if (touchEndX < touchStartX - threshold) changePlayer(1);
    if (touchEndX > touchStartX + threshold) changePlayer(-1);
}