import { supabase } from '../services/supabaseClient';

const STAGES = [
    { index: 0, status: 'Peritagem Criada', role: 'PERITO' },
    { index: 1, status: 'Peritagem Finalizada', role: 'PERITO' },
    { index: 2, status: 'Aguardando Compras', role: 'COMPRADOR' },
    { index: 3, status: 'Custos Inseridos', role: 'COMPRADOR' },
    { index: 4, status: 'Aguardando Orçamento', role: 'ORÇAMENTISTA' },
    { index: 5, status: 'Orçamento Finalizado', role: 'ORÇAMENTISTA' }
];

const CLIENTES = [
    "Usiminas", "Vale", "Petrobras", "Gerdau", "CSN",
    "ArcelorMittal", "Votorantim", "Embraer", "Suzano", "Klabin",
    "JBS", "Ambev", "Braskem", "Weg", "Marcopolo"
];

const EQUIPAMENTOS = [
    "Cilindro Hidráulico", "Bomba de Pistão", "Motor Orbital", "Válvula Direcional",
    "Cilindro Telescópico", "Unidade Hidráulica", "Acumulador de Pressão",
    "Servo Válvula", "Bloco Manifold", "Atuador Rotativo"
];

const COMPONENTES = [
    "Haste", "Camisa", "Êmbolo", "Vedações", "Olhal", "Deslizantes", "Guia"
];

const generateRandomData = (stage, i) => {
    const randomClient = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const randomEquip = EQUIPAMENTOS[Math.floor(Math.random() * EQUIPAMENTOS.length)];

    // Generate 1-3 items
    const items = [];
    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let k = 0; k < numItems; k++) {
        items.push({
            id: Date.now() + k,
            component: COMPONENTES[Math.floor(Math.random() * COMPONENTES.length)],
            anomalies: "Desgaste natural identificado na superfície de contato.",
            solution: "Substituição do componente e verificação de medidas.",
            photos: [] // Empty for simulation
        });
    }

    return {
        orcamento: `${202600 + (stage.index * 100) + i}`,
        cliente: `${randomClient} - Simu ${stage.index}.${i}`,
        endereco: "Rua das Indústrias, 1000",
        bairro: "Distrito Industrial",
        municipio: "São Paulo",
        uf: "SP",
        equipamento: randomEquip,
        cidade: "São Paulo",
        cx: `CX-${Math.floor(Math.random() * 50)}`,
        tag: `TAG-${Math.floor(Math.random() * 9000) + 1000}`,
        nf: `${Math.floor(Math.random() * 50000)}`,
        responsavel_tecnico: "Perito Simulador",
        items: items,
        status: stage.status,
        stage_index: stage.index,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString() // Random past date
        // created_by will be handled by the backend trigger or allowed to be null if RLS allows, 
        // OR we need to fetch a valid user ID. The current code tries to fetch session.
    };
};

export const seedDatabase = async () => {
    console.log("Starting database seed...");

    // 1. Get a user ID to associate (try to get the current user, or any user)
    const { data: { session } } = await supabase.auth.getSession();
    let userId = session?.user?.id;

    if (!userId) {
        console.warn("No active session found. Trying to find a user from profiles to use as author...");
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) {
            userId = profiles[0].id;
        } else {
            console.error("Cannot seed: No user found to assign records to.");
            return;
        }
    }

    console.log("Using User ID for creation:", userId);

    let totalCreated = 0;

    for (const stage of STAGES) {
        console.log(`Generating 20 records for Stage ${stage.index}: ${stage.status}`);

        const batch = [];
        for (let i = 0; i < 20; i++) {
            const record = {
                ...generateRandomData(stage, i),
                created_by: userId
            };
            batch.push(record);
        }

        // Insert in batches
        const { error } = await supabase.from('peritagens').insert(batch);

        if (error) {
            console.error(`Error inserting batch for stage ${stage.index}:`, error);
        } else {
            totalCreated += 20;
            console.log(`Successfully created 20 records for ${stage.status}`);
        }
    }

    console.log(`Seeding complete! Total records created: ${totalCreated}`);
    console.log("DONE_SEEDING");
    return true;
};
