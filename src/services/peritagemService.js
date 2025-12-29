import { supabase } from './supabaseClient';

export const getPeritagens = async () => {
    const { data, error } = await supabase
        .from('peritagens')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar peritagens:', error);
        throw error;
    }
    return data || [];
};

const sendNotification = async (type, peritagem) => {
    try {
        console.log(`Triggering notification: ${type} for #${peritagem.id}`);
        // Fire and forget - don't block the UI
        supabase.functions.invoke('send-email', {
            body: {
                type,
                data: {
                    id: peritagem.id,
                    cliente: peritagem.cliente,
                    equipamento: peritagem.equipamento,
                    responsavel: peritagem.responsavel_tecnico || 'N/A'
                }
            }
        }).then(({ error }) => {
            if (error) console.warn("Email trigger warning:", error);
        });
    } catch (e) {
        console.error("Failed to trigger notification:", e);
    }
};

export const savePeritagem = async (peritagem) => {
    console.log("Iniciando salvamento de peritagem...", peritagem);

    // Get current user session for created_by
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let userId = session?.user?.id;

    // Support hidden admin if no supabase session
    if (!userId) {
        const hiddenAdmin = localStorage.getItem('hidden_admin_user');
        if (hiddenAdmin) {
            try {
                userId = JSON.parse(hiddenAdmin).id;
            } catch (e) {
                console.error("Erro ao ler admin oculto:", e);
            }
        }
    }

    if (!userId) {
        console.error("Erro de sessão ao salvar: Nenhuma sessão encontrada.");
        throw new Error("Sessão expirada ou usuário não autenticado. Faça login novamente.");
    }

    // Basic validation
    if (!peritagem.items || peritagem.items.length === 0) {
        // Allow saving without items? Maybe warn.
    }

    // Convert property names if they differ from DB snake_case (optional, but good practice)
    const peritagemData = {
        orcamento: peritagem.orcamento,
        cliente: peritagem.cliente,
        endereco: peritagem.endereco,
        bairro: peritagem.bairro,
        municipio: peritagem.municipio,
        uf: peritagem.uf,
        equipamento: peritagem.equipamento,
        cidade: peritagem.cidade,
        cx: peritagem.cx,
        tag: peritagem.tag,
        nf: peritagem.nf,
        responsavel_tecnico: peritagem.responsavel_tecnico,
        items: peritagem.items || [],
        status: peritagem.status || 'Peritagem Criada',
        stage_index: peritagem.stage_index || 0,
        created_by: userId
    };

    console.log("Payload preparado para envio:", peritagemData);

    const { data, error } = await supabase
        .from('peritagens')
        .insert([peritagemData])
        .select()
        .single();

    if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao salvar no banco de dados: ${error.message || error.details}`);
    }

    console.log("Peritagem salva com sucesso:", data);

    // NOTIFICATION: New Peritagem
    if (data) {
        sendNotification('new_peritagem', data);
    }

    return data;
};

export const updatePeritagemStatus = async (id, newStageIndex, newStatus) => {
    const { data, error } = await supabase
        .from('peritagens')
        .update({
            stage_index: newStageIndex,
            status: newStatus
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erro ao atualizar status da peritagem:', error);
        throw error;
    }
    return data;
};

export const getPeritagemById = async (id) => {
    const { data, error } = await supabase
        .from('peritagens')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Erro ao buscar peritagem por ID:', error);
        throw error;
    }
    return data;
};

export const updatePeritagem = async (updatedPeritagem) => {
    // Exclude metadata fields that shouldn't be patched directly if they are sensitive
    // or just pass the whole object if it matches the schema
    const { id, ...dataToUpdate } = updatedPeritagem;

    const { data, error } = await supabase
        .from('peritagens')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erro ao atualizar peritagem:', error);
        throw error;
    }

    // NOTIFICATION LOGIC
    if (dataToUpdate.status === 'Aguardando Orçamento') {
        sendNotification('buyer_finished', { ...dataToUpdate, id });
    } else if (dataToUpdate.status === 'Orçamento Finalizado') {
        sendNotification('process_concluded', { ...dataToUpdate, id });
    }

    return data;
};

export const deletePeritagem = async (id) => {
    const { error } = await supabase
        .from('peritagens')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir peritagem:', error);
        throw error;
    }
    return true;
};
