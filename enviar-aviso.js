const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://vqlntcqsgsgbgwejwsen.supabase.co';
const supabaseKey = 'sb_publishable_OKefDfosaW_yyjyLtLgMiA_3FyWl182'; // Ou a tua service_role key se preferires
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração das Chaves VAPID corretas que geraste
webpush.setVapidDetails(
    'mailto:admin@deadpoint.com',
    'BEvBQvXn_4rdJ6bGJzBGeNz7q2KFR26aB357DvBRTR85mSqTH78waH7eyW--1pa-cuZDAGQbAlX17aur_7wv5jc', // Chave pública nova
    'St1Y2RSVpU-prJPvHr_vsBNQHRooBT_B81rCPmYsl_k' // Chave privada nova
);

async function dispararNotificacoes() {
    console.log('A procurar subscrições no Supabase...');

    // 1. Busca todas as subscrições guardadas na base de dados
    const { data: assinantes, error } = await supabase
        .from('push_subscriptions')
        .select('id, subscription, preferences');

    if (error) {
        console.error('Erro ao buscar subscrições:', error);
        return;
    }

    if (!assinantes || assinantes.length === 0) {
        console.log('Nenhum utilizador inscrito encontrado.');
        return;
    }

    console.log(`Encontrados ${assinantes.length} dispositivos inscritos. A enviar...`);

    // 2. Define o conteúdo da notificação
    const payload = JSON.stringify({
        title: "DEADPOINT | Atualização",
        body: "A administração atualizou informações importantes no site!",
        url: "/"
    });

    // 3. Envia o alerta para cada subscrição ativa
    for (let item of assinantes) {
        try {
            await webpush.sendNotification(item.subscription, payload);
            console.log(`Notificação enviada com sucesso para o ID: ${item.id}`);
        } catch (err) {
            console.error(`Falha ao enviar para o ID ${item.id}:`, err.body || err.message);

            // Se o erro indicar que a subscrição expirou ou é inválida, apaga do Supabase
            if (err.statusCode === 404 || err.statusCode === 410) {
                await supabase.from('push_subscriptions').delete().eq('id', item.id);
                console.log(`Subscrição inválida removida da base de dados: ${item.id}`);
            }
        }
    }

    console.log('Processo de disparo concluído!');
}

dispararNotificacoes();