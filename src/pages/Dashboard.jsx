import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPeritagens } from '../services/peritagemService';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        emAndamento: 0,
        aguardandoCompras: 0,
        aguardandoOrcamento: 0,
        finalizados: 0,
        clientesAtivos: 0,
        porStatus: { finalizados: 0, emAndamento: 0, pendentes: 0 },
        porCliente: [],
        evolucaoMensal: { labels: [], values: [], max: 10 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getPeritagens();

                const total = data.length;
                const statusCounts = {
                    finalizados: data.filter(p => p.status === 'Orçamento Finalizado').length,
                    emAndamento: data.filter(p => p.stage_index > 0 && p.stage_index < 5).length,
                    pendentes: data.filter(p => p.stage_index === 0).length
                };

                // Group by client and get top 5
                const clientMap = data.reduce((acc, p) => {
                    acc[p.cliente] = (acc[p.cliente] || 0) + 1;
                    return acc;
                }, {});
                const sortedClients = Object.entries(clientMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                // Monthly Evolution (Last 12 months)
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                // Initialize default array for graph
                const monthlyStats = Array(12).fill(0);

                data.forEach(p => {
                    if (p.created_at) {
                        const date = new Date(p.created_at);
                        const month = date.getMonth(); // 0-11
                        const year = date.getFullYear();
                        // For demonstration and current use, we track 2025
                        if (year === 2025) {
                            monthlyStats[month]++;
                        }
                    }
                });

                // Prepare data for the graph
                const maxVal = Math.max(...monthlyStats, 5);

                const evolucaoData = {
                    labels: monthNames,
                    values: monthlyStats,
                    max: maxVal
                };

                const statsUpdate = {
                    emAndamento: statusCounts.emAndamento,
                    aguardandoCompras: data.filter(p => p.status === 'Aguardando Compras').length,
                    aguardandoOrcamento: data.filter(p => p.status === 'Aguardando Orçamento' || p.status === 'Custos Inseridos').length,
                    finalizados: statusCounts.finalizados,
                    clientesAtivos: new Set(data.map(p => p.cliente)).size,
                    porStatus: {
                        finalizados: Math.round((statusCounts.finalizados / total) * 100) || 0,
                        emAndamento: Math.round((statusCounts.emAndamento / total) * 100) || 0,
                        pendentes: Math.round((statusCounts.pendentes / total) * 100) || 0,
                        total: total
                    },
                    porCliente: sortedClients,
                    evolucaoMensal: evolucaoData
                };
                setStats(statsUpdate);
            } catch (error) {
                console.error('Erro ao buscar estatísticas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // PERITO VIEW: Only show Monthly Analysis Chart
    if (user?.role === 'Perito') {
        return (
            <div>
                <h1 style={{ marginBottom: '1.5rem' }}>Painel do Perito</h1>

                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Total de Análises Mensais</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <PeritoAnalysisChart />
                    </div>
                </div>
            </div>
        );
    }

    // STANDARD VIEW (Gestor, Comprador, etc.)
    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Visão Geral do Sistema</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <KpiCard
                    title="Em Andamento"
                    value={loading ? '...' : stats.emAndamento}
                    icon="⏳"
                    color="var(--color-warning)"
                    onClick={() => navigate('/peritagens')}
                />
                <KpiCard
                    title="Aguardando Compras"
                    value={loading ? '...' : stats.aguardandoCompras}
                    icon="🛒"
                    color="#e67e22" // Orange
                    onClick={() => navigate('/pendentes-compras')}
                />
                <KpiCard
                    title="Aguardando Orçamento"
                    value={loading ? '...' : stats.aguardandoOrcamento}
                    icon="💰"
                    color="#27ae60" // Green
                    onClick={() => navigate('/pendentes-orcamento')}
                />
                <KpiCard
                    title="Finalizados"
                    value={loading ? '...' : stats.finalizados}
                    icon="✅"
                    color="var(--color-success)"
                    onClick={() => navigate('/peritagens')}
                />
                <KpiCard
                    title="Clientes Ativos"
                    value={loading ? '...' : stats.clientesAtivos}
                    icon="🏢"
                    color="var(--color-info)"
                    onClick={() => navigate('/peritagens')}
                />
            </div>

            {/* Charts Grid - Stacked Vertically */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Bar Chart: Clients */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Peritagens por Cliente (Top 5)</h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        {stats.porCliente.length > 0 ? (
                            stats.porCliente.map((c, i) => (
                                <Bar key={i} label={c.name} height={`${(c.count / Math.max(...stats.porCliente.map(x => x.count))) * 100}%`} />
                            ))
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sem dados</div>
                        )}
                    </div>
                </div>

                {/* Donut Chart: Status */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Distribuição por Status</h3>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DonutChart stats={stats.porStatus} />
                    </div>
                </div>
            </div>

            {/* Line Chart: Monthly Evolution */}
            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#1F2937' }}>Evolução Mensal (2025)</h3>
                <div style={{ height: '240px', width: '100%' }}>
                    <LineChart data={stats.evolucaoMensal} />
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, color, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: 'var(--color-surface)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }
            }}
        >
            <div style={{ fontSize: '2.5rem', marginRight: '1rem', color: color || 'var(--color-primary)' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{value}</div>
            </div>
        </div>
    );
}

function Bar({ label, height, color }) {
    return (
        <div style={{ flex: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{
                height: height,
                backgroundColor: color || '#22c55e', // Green default
                borderRadius: '6px 6px 0 0',
                width: '70%',
                maxWidth: '40px',
                minHeight: '4px',
                opacity: 0.85,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
            }}
                onMouseOver={(e) => {
                    e.currentTarget.style.opacity = 1;
                    e.currentTarget.style.transform = 'scaleY(1.05)';
                    e.currentTarget.style.transformOrigin = 'bottom';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.opacity = 0.85;
                    e.currentTarget.style.transform = 'scaleY(1)';
                }}
            ></div>
            <div style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#4B5563',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                padding: '0 2px'
            }} title={label}>
                {label}
            </div>
        </div>
    )
}

function DonutChart({ stats }) {
    // Simple pure CSS/SVG Donut
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem', width: '100%', padding: '1rem' }}>
            <div style={{ position: 'relative', width: '260px', height: '260px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="4" />

                    {/* Segment 1: Finished (Green) */}
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="var(--color-success)" strokeWidth="4"
                        strokeDasharray={`${stats?.finalizados}, 100`} />

                    {/* Segment 2: In Progress (Yellow) */}
                    <circle cx="18" cy="18" r="15.9155" fill="none"
                        stroke="var(--color-warning)" strokeWidth="4"
                        strokeDasharray={`${stats?.emAndamento}, 100`}
                        strokeDashoffset={`-${stats?.finalizados}`} />

                    {/* Segment 3: Pending (Red) */}
                    <circle cx="18" cy="18" r="15.9155" fill="none"
                        stroke="var(--color-danger)" strokeWidth="4"
                        strokeDasharray={`${stats?.pendentes}, 100`}
                        strokeDashoffset={`-${(stats?.finalizados || 0) + (stats?.emAndamento || 0)}`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#374151' }}>{stats?.total || 0}</span>
                    <span style={{ fontSize: '1rem', color: '#9CA3AF', fontWeight: '500' }}>Total</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></div>
                    <span style={{ color: '#4B5563' }}>Finalizados ({stats?.finalizados || 0}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></div>
                    <span style={{ color: '#4B5563' }}>Em Andamento ({stats?.emAndamento || 0}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></div>
                    <span style={{ color: '#4B5563' }}>Pendentes ({stats?.pendentes || 0}%)</span>
                </div>
            </div>
        </div>
    );
}

function LineChart({ data }) {
    // Replaced with a clean Bar Chart style as requested
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!data || !data.values || data.values.length === 0) {
        return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>Carregando dados...</div>;
    }

    const { values, labels, max } = data;
    // Ensure max is at least 5 for scale
    const chartMax = Math.max(max, 5);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', padding: '10px 10px 30px 40px' }}>

            {/* Y Axis Grid & Labels */}
            <div style={{ position: 'absolute', inset: '10px 10px 30px 40px' }}>
                {[0, 1, 2, 3, 4, 5].map((tick, i) => {
                    // Create 5 grid lines based on relative position
                    const yPos = 100 - (i * 20); // 0%, 20%, 40%, 60%, 80%, 100% bottom-up? 
                    // Let's do distinct values based on chartMax
                    const val = Math.round((chartMax / 5) * i);
                    const percentage = (val / chartMax) * 100;

                    return (
                        <div key={i} style={{ position: 'absolute', left: '-30px', right: '0', bottom: `${percentage}%`, height: '1px', pointerEvents: 'none' }}>
                            {/* Label */}
                            <span style={{ position: 'absolute', left: 0, top: '-6px', fontSize: '0.75rem', color: '#9CA3AF', width: '20px', textAlign: 'right' }}>
                                {val}
                            </span>
                            {/* Grid Line */}
                            <div style={{ marginLeft: '30px', width: '100%', height: '1px', borderTop: '1px dashed #F3F4F6' }}></div>
                        </div>
                    );
                })}
            </div>

            {/* Bars Container */}
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: '10px', paddingRight: '10px', position: 'relative', zIndex: 10 }}>
                {values.map((value, i) => {
                    const heightPercentage = (value / chartMax) * 100;
                    const isHovered = hoveredIndex === i;

                    return (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Bar / Pill */}
                            <div style={{
                                width: '60%', // Width of the bar relative to the slot
                                maxWidth: '30px',
                                height: isLoaded ? `${Math.max(heightPercentage, 2)}%` : '0%', // Min height 2% for visibility of 0 values as small pills
                                backgroundColor: isLoaded ? 'white' : 'transparent', // Inner fill
                                border: '2px solid #22c55e', // Green border
                                borderRadius: '50px', // Pill shape
                                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                boxShadow: isHovered ? '0 0 10px rgba(34, 197, 94, 0.3)' : 'none',
                                transform: isHovered ? 'scaleY(1.05)' : 'none',
                                transformOrigin: 'bottom'
                            }}>
                                {/* Tooltip on Hover */}
                                {isHovered && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        marginBottom: '8px',
                                        backgroundColor: '#1F2937',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        zIndex: 20,
                                        pointerEvents: 'none'
                                    }}>
                                        {value}
                                    </div>
                                )}
                            </div>

                            {/* X Axis Label */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-25px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.75rem',
                                color: isHovered ? '#22c55e' : '#6B7280',
                                fontWeight: isHovered ? '700' : '500',
                                transition: 'color 0.2s',
                                whiteSpace: 'nowrap'
                            }}>
                                {labels[i]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PeritoAnalysisChart() {
    // Bar chart for individual Perito analysis count (12 months)
    return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'end', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
            <Bar label="Jan" height="20%" />
            <Bar label="Fev" height="35%" />
            <Bar label="Mar" height="25%" />
            <Bar label="Abr" height="40%" />
            <Bar label="Mai" height="45%" />
            <Bar label="Jun" height="50%" />
            <Bar label="Jul" height="30%" />
            <Bar label="Ago" height="45%" />
            <Bar label="Set" height="60%" />
            <Bar label="Out" height="50%" />
            <Bar label="Nov" height="70%" />
            <Bar label="Dez" height="85%" />
        </div>
    );
}
