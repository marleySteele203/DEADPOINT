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

// CONFIGURAÇÃO DE ÍCONES E CORES POR CATEGORIA
const ICONES_TIPO = {
    CAMPEONATO: { 
        icon: "fa-solid fa-trophy", 
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        iconBoxClass: "bg-amber-500/10 text-amber-400 border-amber-500/30" 
    },
    TREINO: { 
        icon: "fa-solid fa-crosshairs", 
        badgeClass: "bg-deadpoint-orange/10 text-deadpoint-orange border-deadpoint-orange/30",
        iconBoxClass: "bg-deadpoint-orange/10 text-deadpoint-orange border-deadpoint-orange/30" 
    },
    LIVE: { 
        icon: "fa-solid fa-tv", 
        badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        iconBoxClass: "bg-purple-500/10 text-purple-400 border-purple-500/30" 
    }
};

// RENDERIZAR AGENDA NA TELA
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
        const categoria = (evento.category || 'CAMPEONATO').toUpperCase();
        const configTipo = ICONES_TIPO[categoria] || { 
            icon: "fa-solid fa-crosshairs", 
            badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
            iconBoxClass: "bg-slate-800 text-slate-300 border-slate-700" 
        };
        
        const isConcluido = (evento.status === 'CONCLUIDO');

        // MONTAGEM DA LISTA DE DIAS ESPECÍFICOS DE JOGO (MATCH DAYS)
        let matchDaysHTML = '';
        if (evento.match_days && Array.isArray(evento.match_days) && evento.match_days.length > 0) {
            matchDaysHTML = `
                <div class="mt-3 pt-3 border-t border-dashed border-slate-700/80 space-y-1.5">
                    <small class="text-emerald-400 font-bold uppercase text-[0.7rem] tracking-wider block flex items-center gap-1.5">
                        <i class="fa-solid fa-calendar-check"></i> Dias de Jogo:
                    </small>
                    <ul class="space-y-1 text-xs">
            `;
            
            evento.match_days.forEach(m => {
                const dataFormatada = m.date ? m.date.split('-').reverse().join('/') : 'A definir';
                const horaText = m.time ? `às ${m.time}` : '';
                const notaText = m.note ? `— <em class="text-slate-400 font-normal">${m.note}</em>` : '';
                
                matchDaysHTML += `
                    <li class="flex flex-wrap items-center gap-1 text-slate-300">
                        <span class="font-bold text-white">• ${dataFormatada}</span> 
                        <span class="text-deadpoint-orange font-semibold">${horaText}</span> 
                        <span>${notaText}</span>
                    </li>
                `;
            });
            
            matchDaysHTML += `</ul></div>`;
        }

        // MONTAGEM DO CARD TAILWIND
        const cardHTML = `
            <div class="bg-deadpoint-blue/80 border border-slate-800 rounded-2xl p-5 transition duration-200 hover:border-slate-700 flex flex-col justify-between space-y-4 ${isConcluido ? 'opacity-60 bg-slate-900/40' : ''}" data-id="${evento.id}">
                
                <!-- CABEÇALHO DO CARD -->
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${configTipo.iconBoxClass}">
                            <i class="${configTipo.icon}"></i>
                        </div>
                        <div>
                            <span class="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider border inline-block ${configTipo.badgeClass}">
                                ${categoria}
                            </span>
                            <h2 class="text-base sm:text-lg font-black uppercase text-white leading-tight mt-1">
                                ${evento.title || 'Sem título'}
                            </h2>
                        </div>
                    </div>

                    <!-- STATUS BADGE -->
                    <span class="text-[0.65rem] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider border ${
                        isConcluido 
                            ? 'bg-slate-800/80 text-slate-400 border-slate-700' 
                            : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    }">
                        ${evento.status || 'AGUARDANDO'}
                    </span>
                </div>

                <!-- DESCRIÇÃO -->
                ${evento.description ? `<p class="text-xs text-slate-300 leading-relaxed">${evento.description}</p>` : ''}

                <!-- LISTA DE DIAS DE JOGO -->
                ${matchDaysHTML}

                <!-- INFORMAÇÕES DE RODAPÉ DO CARD -->
                <div class="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    
                    <div class="space-y-1">
                        <div class="text-slate-400 font-medium flex items-center gap-1.5">
                            <i class="fa-regular fa-calendar-days text-deadpoint-orange"></i>
                            <span>${evento.date_range || 'A definir'} ${evento.time ? `| ${evento.time}` : ''}</span>
                        </div>
                        
                        <div class="text-slate-300 font-bold flex items-center gap-1.5">
                            <i class="fa-solid fa-award text-amber-400"></i>
                            <span>Premiação: <strong class="text-white">${evento.prize || 'N/A'}</strong></span>
                        </div>
                    </div>

                    <!-- BOTÃO STREAM / TRANSMISSÃO COM ANIMAÇÕES -->
                    ${evento.stream_url ? `
                        <a href="${evento.stream_url}" target="_blank" class="group relative px-4 py-2 rounded-xl bg-deadpoint-orange hover:bg-deadpoint-orange-hover text-black font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/50 flex items-center gap-2 overflow-hidden">
                            <!-- Ícone Play com animação de balanço/pulso -->
                            <i class="fa-solid fa-play text-xs group-hover:scale-125 transition-transform duration-300 animate-pulse"></i>
                            <span>Assistir</span>
                            <!-- Efeito de brilho passado ao fazer hover -->
                            <span class="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
                        </a>
                    ` : ''}
                </div>
            </div>
        `;

        if (!isConcluido) {
            htmlPrincipal += cardHTML;
        } else {
            htmlLixeira += cardHTML;
        }
    });

    const noEventsHTML = `
        <div class="col-span-full py-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest bg-deadpoint-blue/30 rounded-2xl border border-slate-800/50">
            // NENHUMA OPERAÇÃO ENCONTRADA NESTA CATEGORIA
        </div>
    `;

    containerPrincipal.innerHTML = htmlPrincipal || noEventsHTML;
    
    if (containerLixeira) {
        containerLixeira.innerHTML = htmlLixeira || `
            <div class="col-span-full py-8 text-center text-slate-600 font-mono text-xs uppercase tracking-widest">
                // NENHUMA OPERAÇÃO ARQUIVADA.
            </div>
        `;
    }
}

// FILTROS DE CATEGORIA
function setFiltroTipo(tipo, event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    filtroAtual = tipo;
    renderizarAgenda();
}

document.addEventListener("DOMContentLoaded", renderizarAgenda);