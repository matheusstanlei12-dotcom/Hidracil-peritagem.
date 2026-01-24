import { useState, useEffect } from 'react';
import { getPeritagens } from '../services/peritagemService';
import {
    ChevronRight,
    X,
    FileText,
    CheckSquare,
    ShoppingCart,
    DollarSign,
    Zap,
    User,
    Calendar,
    Clock,
    Search,
    ArrowLeft
} from 'lucide-react';

export default function Timeline() {
    const [peritagens, setPeritagens] = useState([]);
    const [selectedPeritagem, setSelectedPeritagem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalStage, setModalStage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getPeritagens();
                setPeritagens(data);
            } catch (error) {
                console.error("Erro ao carregar peritagens:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const stages = [
        { id: 0, label: 'PERITAGEM CRIADA', role: 'PERITO', icon: FileText },
        { id: 1, label: 'PERITAGEM FINALIZADA', role: 'PERITO', icon: CheckSquare },
        { id: 2, label: 'AGUARDANDO COMPRAS', role: 'COMPRADOR', icon: ShoppingCart },
        { id: 3, label: 'CUSTOS INSERIDOS', role: 'COMPRADOR', icon: DollarSign },
        { id: 4, label: 'AGUARDANDO ORÇAMENTO', role: 'ORÇAMENTISTA', icon: Zap },
        { id: 5, label: 'ORÇAMENTO FINALIZADO', role: 'ORÇAMENTISTA', icon: CheckSquare },
    ];

    const filteredPeritagens = peritagens.filter(p =>
        p.orcamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="animate-spin">Carregando...</div>
            </div>
        );
    }

    // LIST VIEW (If no peritagem selected)
    if (!selectedPeritagem) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Monitoramento de Processos</h2>
                    <p style={{ color: '#666' }}>Selecione uma peritagem para visualizar a linha do tempo e o status atual.</p>
                </div>

                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por orçamento ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.8rem',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredPeritagens.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#F9FAFB', borderRadius: '16px', color: '#999' }}>
                            Nenhuma peritagem encontrada.
                        </div>
                    ) : (
                        filteredPeritagens.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPeritagem(p)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s shadow'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderHeader = '1px solid #2563EB';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderHeader = '1px solid #E5E7EB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700', marginBottom: '0.25rem' }}>#{p.orcamento}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{p.cliente}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{p.equipamento}</div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ backgroundColor: '#F3F4F6', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                                        {p.status || 'Pendente'}
                                    </div>
                                    <ChevronRight size={20} color="#999" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // TIMELINE VIEW (If peritagem selected)
    const currentStageIndex = selectedPeritagem.stage_index || 0;
    const currentStageData = stages[currentStageIndex] || stages[0];

    return (
        <div style={{ fontFamily: 'Inter, sans-serif' }}>

            <button
                onClick={() => setSelectedPeritagem(null)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '2rem'
                }}
            >
                <ArrowLeft size={18} />
                Voltar para a lista
            </button>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px' }}>
                        <Clock size={16} />
                        MONITORAMENTO: {selectedPeritagem.orcamento} - {selectedPeritagem.cliente}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>Etapa Atual:</span>
                        <span style={{ color: '#2563EB' }}>{currentStageData.label}</span>
                    </div>
                </div>

                <div style={{
                    border: '1px solid #eee',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                }}>
                    <div style={{
                        width: '40px', height: '40px',
                        borderRadius: '50%', border: '2px solid #2563EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#2563EB'
                    }}>
                        <User size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: '700', textTransform: 'uppercase' }}>SETOR RESPONSÁVEL</div>
                        <div style={{ fontSize: '1rem', fontWeight: '800' }}>{currentStageData.role}</div>
                    </div>
                </div>
            </div>

            {/* Timeline Cards */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {stages.map((stage, index) => {
                    const isActive = index === currentStageIndex;
                    const isPassed = index < currentStageIndex;

                    const cardBg = isActive ? '#FFD700' : isPassed ? '#EFF6FF' : '#F3F4F6';
                    const iconColor = isActive ? '#000' : isPassed ? '#2563EB' : '#9CA3AF';
                    const textColor = isActive ? '#000' : isPassed ? '#2563EB' : '#6B7280';

                    return (
                        <div key={stage.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <div
                                style={{
                                    width: '160px',
                                    height: '160px',
                                    backgroundColor: cardBg,
                                    borderRadius: '24px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    boxShadow: isActive ? '0 10px 25px rgba(255, 215, 0, 0.3)' : 'none',
                                    opacity: 1
                                }}
                            >
                                <div style={{ position: 'absolute', top: '12px', left: '15px', fontSize: '0.8rem', fontWeight: '700', opacity: 0.5 }}>
                                    {String(index + 1).padStart(2, '0')}
                                </div>

                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.75rem'
                                }}>
                                    <stage.icon size={22} color={iconColor} strokeWidth={2.5} />
                                </div>

                                <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '0.75rem', lineHeight: '1.2', color: textColor, marginBottom: '0.25rem' }}>
                                    {stage.label}
                                </div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: textColor, opacity: 0.6, textTransform: 'uppercase' }}>
                                    {stage.role}
                                </div>

                                {isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-10px',
                                        backgroundColor: 'black',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        fontWeight: '800',
                                        padding: '0.2rem 0.8rem',
                                        borderRadius: '20px',
                                        animation: 'pulse 1.5s infinite'
                                    }}>
                                        ATIVO
                                    </div>
                                )}
                            </div>
                            {index < stages.length - 1 && (
                                <ChevronRight size={24} style={{ margin: '0 0.25rem', color: '#E5E7EB' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Legend */}
            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#F9FAFB', borderRadius: '16px', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563EB' }}></div>
                        EXECUTADO
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFD700' }}></div>
                        ETAPA ATUAL
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E5E7EB' }}></div>
                        PENDENTE
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: '600' }}>
                    RESPONSÁVEL TÉCNICO: {selectedPeritagem.responsavel_tecnico}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(0, 0, 0, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
                }
            `}</style>
        </div>
    );
}
