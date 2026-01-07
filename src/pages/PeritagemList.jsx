import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPeritagens } from '../services/peritagemService';
import { PlusCircle, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';


export default function PeritagemList() {
    const { user } = useAuth();
    const [peritagens, setPeritagens] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const isAndroid = Capacitor.getPlatform() === 'android';


    useEffect(() => {
        const fetchPeritagens = async () => {
            try {
                setLoading(true);
                const data = await getPeritagens();
                setPeritagens(data);
            } catch (error) {
                console.error('Erro ao carregar peritagens:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPeritagens();
    }, []);

    const filtered = peritagens.filter(p => {
        // Se for Android, só mostra as dele
        if (isAndroid && p.created_by !== user?.id) return false;

        const matchesFilter = p.cliente?.toLowerCase().includes(filter.toLowerCase()) ||
            p.id?.toLowerCase().includes(filter.toLowerCase());
        return matchesFilter;
    });


    return (
        <div className="list-container">
            <div className="list-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                gap: '1rem'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{isAndroid ? 'Minhas Peritagens' : 'Todas as Peritagens'}</h1>
                <Link to="/nova-peritagem" className="btn-nova-peritagem" style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--border-radius-sm)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                }}>
                    <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
                    <span className="btn-text">Nova Peritagem</span>
                </Link>
            </div>


            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <Search color="var(--color-text-secondary)" />
                <input
                    type="text"
                    placeholder="Buscar por cliente ou ID..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%' }}
                />
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.85rem' }}>ID</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Cliente</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Data</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Status</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td>
                            </tr>
                        ) : filtered.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{item.id.slice(0, 8)}</td>
                                <td style={{ padding: '1rem' }}>{item.cliente}</td>
                                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{new Date(item.date || item.created_at).toLocaleDateString('pt-BR')}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        backgroundColor: item.status === 'Orçamento Finalizado' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(244, 208, 63, 0.2)',
                                        color: item.status === 'Orçamento Finalizado' ? 'var(--color-success)' : '#d4ac0d',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link to={`/peritagem/${item.id}`} style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.85rem' }}>ABRIR</Link>
                                </td>
                            </tr>
                        ))}
                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Nenhuma peritagem encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                @media (max-width: 600px) {
                    .list-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 0.75rem !important;
                    }
                    .btn-nova-peritagem {
                        width: 100%;
                        justify-content: center;
                    }
                    .list-container h1 {
                        font-size: 1.25rem !important;
                    }
                }
            `}</style>
        </div>

    );
}
