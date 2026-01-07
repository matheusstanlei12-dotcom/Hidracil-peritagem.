import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPeritagemById, updatePeritagem } from '../services/peritagemService';
import { generatePeritagemPDF } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

const COMPONENT_OPTIONS = [
    "Olhal superior", "Rótula", "Anel retentor", "Pino graxeiro",
    "Haste", "Êmbolo", "Anel guia", "Olhal inferior",
    "Camisa", "Cabeçote da guia", "Vedações", "Outros"
];

export default function PeritagemDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [peritagem, setPeritagem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeritagem = async () => {
            try {
                setLoading(true);
                const data = await getPeritagemById(id);
                if (data) {
                    setPeritagem(data);
                } else {
                    alert('Peritagem não encontrada');
                    navigate('/peritagens');
                }
            } catch (error) {
                console.error('Erro ao buscar peritagem:', error);
                alert('Erro ao carregar detalhes da peritagem.');
                navigate('/peritagens');
            } finally {
                setLoading(false);
            }
        };
        fetchPeritagem();
    }, [id, navigate]);

    const handleUpdateItem = (itemId, field, value) => {
        setPeritagem(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
        }));
    };

    const handleUpdateDeepItem = (itemId, section, field, value) => {
        setPeritagem(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const sectionData = item[section] || {};
                    return { ...item, [section]: { ...sectionData, [field]: value } };
                }
                return item;
            })
        }));
    };

    const handleSave = async () => {
        try {
            await updatePeritagem(peritagem);
            alert('Salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar peritagem.');
        }
    };

    const handleFinalizePurchases = async () => {
        try {
            const updated = {
                ...peritagem,
                status: 'Aguardando Orçamento',
                stage_index: 4
            };
            await updatePeritagem(updated);
            setPeritagem(updated);
            alert('Cotação finalizada. Enviado para Orçamentista.');
            navigate('/peritagens');
        } catch (error) {
            console.error('Erro ao finalizar cotação:', error);
            alert('Erro ao finalizar cotação.');
        }
    };

    const handleFinalizeBudget = async () => {
        try {
            const updated = {
                ...peritagem,
                status: 'Orçamento Finalizado',
                stage_index: 5
            };
            await updatePeritagem(updated);
            setPeritagem(updated);
            alert('Orçamento finalizado!');
        } catch (error) {
            console.error('Erro ao finalizar orçamento:', error);
            alert('Erro ao finalizar orçamento.');
        }
    };


    if (loading || !peritagem) return <div>Carregando...</div>;

    const isComprador = user?.role === 'Comprador' || user?.role === 'Gestor' || user?.role === 'PCP';
    const isOrcamentista = user?.role === 'Orçamentista' || user?.role === 'Gestor' || user?.role === 'PCP';

    // Logic for editability
    const canEditPurchases = (user?.role === 'Comprador' || user?.role === 'Gestor') && peritagem.status === 'Aguardando Compras';
    const canEditBudget = (user?.role === 'Orçamentista' || user?.role === 'Gestor') && (peritagem.status === 'Aguardando Orçamento' || peritagem.status === 'Custos Inseridos' || peritagem.status === 'Aguardando Compras'); // Fallback allowing edits if flow slightly off

    // Strict flow check
    const showPurchaseInputs = peritagem.status === 'Aguardando Compras' || (peritagem.stage_index >= 2 && (user?.role === 'Gestor' || user?.role === 'PCP'));
    const showBudgetInputs = peritagem.status === 'Aguardando Orçamento' || peritagem.status === 'Orçamento Finalizado' || (peritagem.stage_index >= 4);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                marginBottom: '2rem'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: '30px' }} />
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>Peritagem #{peritagem.id}</h2>
                            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>STATUS: {peritagem.status?.toUpperCase()}</span>
                        </div>
                    </div>
                    <button onClick={() => navigate('/peritagens')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="details-content" style={{ padding: '2rem' }}>
                    {/* Identificação (ReadOnly) */}
                    <div style={{ marginBottom: '2rem', opacity: 0.8 }}>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Identificação</h3>
                        <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="field-group">
                                <label>Cliente</label>
                                <div className="read-only-field">{peritagem.cliente}</div>
                            </div>
                            <div className="field-group">
                                <label>Equipamento</label>
                                <div className="read-only-field">{peritagem.equipamento}</div>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2rem 0' }} />

                    {/* Análise Técnica Items */}
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Análise Técnica & Custos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {peritagem.items.map((item, index) => (
                                <div key={item.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#FAFAFA' }}>

                                    {/* Perito Data (Always Visible) */}
                                    <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Componente</label>
                                            <div className="read-only-field">{item.component}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Anomalias</label>
                                            <div className="read-only-field">{item.anomalies}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Solução</label>
                                            <div className="read-only-field">{item.solution}</div>
                                        </div>
                                    </div>

                                    {/* Comprador Data Section */}
                                    {(showPurchaseInputs || peritagem.stage_index >= 3) && (
                                        <div style={{
                                            backgroundColor: '#E8F5E9',
                                            padding: '1rem',
                                            borderRadius: '6px',
                                            marginTop: '1rem',
                                            borderLeft: '4px solid #4CAF50'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2E7D32', marginBottom: '0.5rem' }}>DADOS DE COMPRAS</div>
                                            <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Custo (R$)</label>
                                                    <input
                                                        type="number"
                                                        value={item.costs?.cost || ''}
                                                        onChange={(e) => handleUpdateDeepItem(item.id, 'costs', 'cost', e.target.value)}
                                                        disabled={!canEditPurchases}
                                                        className="form-input-small"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Fornecedor</label>
                                                    <input
                                                        type="text"
                                                        value={item.costs?.supplier || ''}
                                                        onChange={(e) => handleUpdateDeepItem(item.id, 'costs', 'supplier', e.target.value)}
                                                        disabled={!canEditPurchases}
                                                        className="form-input-small"
                                                        placeholder="Nome do fornecedor"
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Observações</label>
                                                    <input
                                                        type="text"
                                                        value={item.costs?.notes || ''}
                                                        onChange={(e) => handleUpdateDeepItem(item.id, 'costs', 'notes', e.target.value)}
                                                        disabled={!canEditPurchases}
                                                        className="form-input-small"
                                                        placeholder="Obs..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Orçamentista Data Section */}
                                    {(showBudgetInputs || peritagem.stage_index >= 5) && (
                                        <div style={{
                                            backgroundColor: '#FFF8E1',
                                            padding: '1rem',
                                            borderRadius: '6px',
                                            marginTop: '1rem',
                                            borderLeft: '4px solid #FFC107'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#F57F17', marginBottom: '0.5rem' }}>ORÇAMENTO</div>
                                            <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Preço de Venda (R$)</label>
                                                    <input
                                                        type="number"
                                                        value={item.budget?.sellPrice || ''}
                                                        onChange={(e) => handleUpdateDeepItem(item.id, 'budget', 'sellPrice', e.target.value)}
                                                        disabled={!canEditBudget && peritagem.status !== 'Aguardando Orçamento'}
                                                        className="form-input-small"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Margem Calculada</label>
                                                    <div className="read-only-field" style={{ backgroundColor: '#fff' }}>
                                                        {item.costs?.cost && item.budget?.sellPrice ?
                                                            `${(((item.budget.sellPrice - item.costs.cost) / item.budget.sellPrice) * 100).toFixed(1)}%`
                                                            : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTIONS footer */}
                    <div className="actions-footer" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>

                        {/* Comprador Actions */}
                        {canEditPurchases && (
                            <button
                                onClick={handleFinalizePurchases}
                                style={{ backgroundColor: '#4CAF50', color: 'white', padding: '1rem 2rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                FINALIZAR COTAÇÃO
                            </button>
                        )}

                        {/* Orçamentista Actions */}
                        {canEditBudget && peritagem.status !== 'Orçamento Finalizado' && (
                            <button
                                onClick={handleFinalizeBudget}
                                style={{ backgroundColor: '#FFC107', color: 'black', padding: '1rem 2rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                FINALIZAR ORÇAMENTO
                            </button>
                        )}

                        {/* PDFs Actions - Only if Finalized */}
                        {peritagem.status === 'Orçamento Finalizado' && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button onClick={() => generatePeritagemPDF(peritagem, 'sem_custo')} className="btn-pdf">PDF S/ Custo</button>
                                <button onClick={() => generatePeritagemPDF(peritagem, 'comprador')} className="btn-pdf">PDF Comprador</button>
                                <button onClick={() => generatePeritagemPDF(peritagem, 'orcamentista')} className="btn-pdf">PDF Orçamentista</button>
                                <button onClick={() => generatePeritagemPDF(peritagem, 'cliente')} className="btn-pdf-primary">PDF CLIENTE</button>
                            </div>
                        )}

                    </div>

                </div>
            </div>

            <style>{`
                .field-group label {
                    display: block;
                    font-size: 0.8rem;
                    color: #777;
                    margin-bottom: 0.25rem;
                }
                .read-only-field {
                    background-color: #f5f5f5;
                    padding: 0.5rem;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    font-size: 0.9rem;
                    color: #333;
                }
                .form-input-small {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }
                .btn-pdf {
                    background-color: #607D8B;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.8rem;
                }
                .btn-pdf-primary {
                    background-color: #2196F3;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.8rem;
                    box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3);
                }

                @media (max-width: 768px) {
                    .details-content {
                        padding: 1rem !important;
                    }
                    .grid-responsive-2, .grid-responsive-3 {
                        grid-template-columns: 1fr !important;
                        gap: 1.5rem !important;
                    }
                    .actions-footer {
                        flex-direction: column !important;
                        align-items: stretch !important;
                    }
                    .actions-footer > div {
                        flex-direction: column !important;
                        width: 100% !important;
                    }
                    .btn-pdf, .btn-pdf-primary {
                        width: 100% !important;
                        padding: 1rem !important;
                        font-size: 0.9rem !important;
                    }
                    .read-only-field {
                        min-height: 40px;
                        display: flex;
                        align-items: center;
                    }
                }
            `}</style>
        </div>
    );
}
