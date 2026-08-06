// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://vqlntcqsgsgbgwejwsen.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OKefDfosaW_yyjyLtLgMiA_3FyWl182';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let filtroAtual = 'ALL';

// RELÓGIO HUD
function atualizarRelogio() {
    const agora = new Date();
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.textContent = `${agora.toLocaleTimeString('pt-BR')} CAT`;
    }
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// CARREGAR EVENTOS DO SUPABASE
async function carregarEventosServidor() {
    try {
        const { data, error } = await supabaseClient
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Falha ao buscar eventos do Supabase:', error.message);
        return [];
    }
}

const ICONES_TIPO = {
    CAMPEONATO: { icon: "fa-solid fa-trophy", tag: "tag-championship" },
    TREINO: { icon: "fa-solid fa-crosshairs", tag: "tag-scrim" },
    LIVE: { icon: "fa-solid fa-tv", tag: "tag-live" }
};

// RENDERIZAR NA TELA
async function renderizarAgenda() {
    const containerPrincipal = document.getElementById('agenda-entries');
    const containerLixeira = document.getElementById('agenda-trash');

    if (!containerPrincipal) return;

    let htmlPrincipal = '';
    let htmlLixeira = '';

    const eventosDaOrganização = await carregarEventosServidor();

    const eventosFiltrados = eventosDaOrganização.filter(e => {
        const cat = e.category || 'CAMPEONATO';
        return (filtroAtual === 'ALL' || cat.toUpperCase() === filtroAtual.toUpperCase());
    });

    eventosFiltrados.forEach(evento => {
        const categoria = evento.category || 'CAMPEONATO';
        const configTipo = ICONES_TIPO[categoria] || { icon: "fa-solid fa-crosshairs", tag: "tag-default" };
        
        const isConcluido = (evento.status === 'CONCLUIDO');

        // MONTAGEM DA LISTA DE DIAS ESPECÍFICOS DE JOGO (MATCH DAYS)
        let matchDaysHTML = '';
        if (evento.match_days && Array.isArray(evento.match_days) && evento.match_days.length > 0) {
            matchDaysHTML = `
                <div class="match-days-list" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1);">
                    <small style="color: #00ffff; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                        <i class="fa-solid fa-calendar-check"></i> DIAS DE JOGO:
                    </small>
                    <ul style="list-style: none; padding: 0; margin: 0;">
            `;
            
            evento.match_days.forEach(m => {
                const dataFormatada = m.date ? m.date.split('-').reverse().join('/') : 'A definir';
                const horaText = m.time ? `às ${m.time}` : '';
                const notaText = m.note ? `— <em>${m.note}</em>` : '';
                
                matchDaysHTML += `
                    <li style="font-size: 0.85rem; color: #d1d5db; margin-bottom: 3px;">
                        <span style="color: #fff; font-weight: 600;">• ${dataFormatada}</span> 
                        <span style="color: #ffc800;">${horaText}</span> 
                        <span style="color: #8a99ad;">${notaText}</span>
                    </li>
                `;
            });
            
            matchDaysHTML += `</ul></div>`;
        }

        const cardHTML = `
            <div class="agenda-row ${isConcluido ? 'archived-card' : ''}" data-id="${evento.id}">
                <div class="row-left">
                    <div class="icon-box-hud">
                        <i class="${configTipo.icon}"></i>
                    </div>
                    <div class="event-details">
                        <div class="tag-row-wrapper">
                            <span class="event-type-tag ${configTipo.tag}">${categoria}</span>
                            <span class="event-geo-tag"><i class="fa-solid fa-earth-africa"></i> ${evento.region || 'GLOBAL'}</span>
                            <span class="countdown-badge"><i class="fa-solid fa-stopwatch"></i> ${evento.status || 'AGUARDANDO'}</span>
                        </div>
                        <h2>${evento.title || 'Sem título'}</h2>
                        <p>${evento.description || ''}</p>
                        
                        <!-- DIAS ESPECÍFICOS EXIBIDOS AQUI -->
                        ${matchDaysHTML}

                        <div class="hud-extra-info" style="margin-top: 8px;">
                            <span><i class="fa-solid fa-award"></i> PREMIAÇÃO: <strong>${evento.prize || 'N/A'}</strong></span>
                        </div>
                    </div>
                </div>
                <div class="row-right">
                    <div class="time-block">
                        <div class="time-item"><i class="fa-regular fa-calendar-days"></i> ${evento.date_range || 'A definir'}</div>
                        <div class="time-item"><i class="fa-regular fa-clock"></i> ${evento.time || ''}</div>
                    </div>
                    <div class="action-block-hud">
                        ${evento.stream_url ? `
                            <a href="${evento.stream_url}" target="_blank" class="btn-action btn-tiktok" title="Transmitir / Stream">
                                <i class="fa-solid fa-play"></i>
                            </a>
                        ` : ''}
                        <div class="status-block ${isConcluido ? 'status-ended' : 'status-waiting'}">
                            <span class="status-text">${evento.status || 'AGUARDANDO'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!isConcluido) {
            htmlPrincipal += cardHTML;
        } else {
            htmlLixeira += cardHTML;
        }
    });

    containerPrincipal.innerHTML = htmlPrincipal || `<div class="no-events-alert">// NENHUMA OPERAÇÃO ENCONTRADA NESTA CATEGORIA</div>`;
    if (containerLixeira) {
        containerLixeira.innerHTML = htmlLixeira || `<div class="no-events-alert" style="opacity: 0.5;">// NENHUMA OPERAÇÃO ARQUIVADA.</div>`;
    }
}

// FILTROS
function setFiltroTipo(tipo, event) {
    document.querySelectorAll('.hud-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    filtroAtual = tipo;
    renderizarAgenda();
}

document.addEventListener("DOMContentLoaded", renderizarAgenda);