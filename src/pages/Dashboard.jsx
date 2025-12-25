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
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Total de Análises Mensal</h3>
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

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Bar Chart: Clients */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)' }}>
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
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
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

function Bar({ label, height }) {
    return (
        <div style={{ flex: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer' }}>
            <div style={{ height: height, backgroundColor: 'var(--color-primary)', borderRadius: '4px 4px 0 0', width: '100%', opacity: 0.8, transition: 'opacity 0.2s' }}
                onMouseOver={(e) => e.target.style.opacity = 1}
                onMouseOut={(e) => e.target.style.opacity = 0.8}
            ></div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        </div>
    )
}

function DonutChart({ stats }) {
    // Simple pure CSS/SVG Donut
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
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
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.total || 0}</span>
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>Total</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></div>
                    <span>Finalizados ({stats?.finalizados || 0}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></div>
                    <span>Em Andamento ({stats?.emAndamento || 0}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></div>
                    <span>Pendentes ({stats?.pendentes || 0}%)</span>
                </div>
            </div>
        </div>
    );
}

function LineChart({ data }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!data || !data.values || data.values.length === 0) {
        return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>Carregando dados...</div>;
    }

    const { values, labels, max } = data;

    // Calculate coordinates for the line (0-100 scale for SVG)
    const points = values.map((val, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 95 - ((val / (max || 1)) * 90); // Use 95-5 range to keep points within view
        return { x, y, value: val, label: labels[i] };
    });

    // Function to generate a smooth Cubic Bezier path
    // Based on: https://medium.com/@francoisromain/smooth-a-svg-path-with-bezier-curves-e37053933190
    const smoothing = 0.15;
    const line = (point, i, a) => {
        if (i === 0) return `M ${point.x} ${point.y}`;

        // Control point logic
        const p0 = a[i - 2] || a[i - 1];
        const p1 = a[i - 1];
        const p2 = point;
        const p3 = a[i + 1] || point;

        const cp1x = p1.x + (p2.x - p0.x) * smoothing;
        const cp1y = p1.y + (p2.y - p0.y) * smoothing;
        const cp2x = p2.x - (p3.x - p1.x) * smoothing;
        const cp2y = p2.y - (p3.y - p1.y) * smoothing;

        return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    };

    const linePath = points.map((p, i, a) => line(p, i, a)).join(' ');
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    const handleMouseMove = (e, index) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setHoveredIndex(index);
    };

    return (
        <div
            style={{ width: '100%', height: '100%', position: 'relative', padding: '10px 10px 40px 50px', userSelect: 'none' }}
            translate="no"
        >
            {/* Tooltip */}
            {hoveredIndex !== null && (
                <div style={{
                    position: 'absolute',
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y - 60}px`,
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    pointerEvents: 'none',
                    zIndex: 100,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    transform: 'translateX(-50%)',
                    transition: 'all 0.1s ease-out',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{points[hoveredIndex].label}</div>
                    <div style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: '800' }}>{points[hoveredIndex].value} <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Peritagens</span></div>
                </div>
            )}

            {/* Y Axis Labels */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '10px',
                bottom: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#9CA3AF',
                fontWeight: '600',
                textAlign: 'right',
                width: '40px'
            }}>
                <span>{max}</span>
                <span>{Math.round(max * 0.75)}</span>
                <span>{Math.round(max * 0.5)}</span>
                <span>{Math.round(max * 0.25)}</span>
                <span>0</span>
            </div>

            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                        {/* Area Gradient */}
                        <linearGradient id="premiumAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                            <stop offset="60%" stopColor="#22c55e" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                        </linearGradient>

                        {/* Line Glow Filter */}
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map(level => (
                        <line
                            key={level}
                            x1="0" y1={level} x2="100" y2={level}
                            stroke="#F3F4F6"
                            strokeWidth="0.5"
                            strokeDasharray={level === 100 ? "0" : "4 4"}
                        />
                    ))}

                    {/* Vertical Markers */}
                    {points.map((p, i) => (
                        <line key={i} x1={p.x} y1="0" x2={p.x} y2="100" stroke="#F3F4F6" strokeWidth="0.3" strokeOpacity={hoveredIndex === i ? 1 : 0} />
                    ))}

                    {/* Area under the curve */}
                    <path
                        d={areaPath}
                        fill="url(#premiumAreaGradient)"
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transition: 'opacity 1s ease-in-out'
                        }}
                    />

                    {/* Premium Smooth Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        filter="url(#glow)"
                        style={{
                            strokeDasharray: '400',
                            strokeDashoffset: isLoaded ? '0' : '400',
                            transition: 'stroke-dashoffset 2s ease-out'
                        }}
                    />

                    {/* Data Points (Invisible trigger area for better hover) */}
                    {points.map((p, i) => (
                        <g key={i} onMouseEnter={(e) => handleMouseMove(e, i)} onMouseLeave={() => setHoveredIndex(null)}>
                            {/* Larger invisible trigger */}
                            <rect x={p.x - 4} y="0" width="8" height="100" fill="transparent" style={{ cursor: 'pointer' }} />

                            {/* Visible point */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === i ? 6 : 4}
                                fill="white"
                                stroke="#22c55e"
                                strokeWidth={hoveredIndex === i ? 3 : 2}
                                vectorEffect="non-scaling-stroke"
                                style={{
                                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    opacity: isLoaded ? 1 : 0,
                                    transformOrigin: `${p.x}px ${p.y}px`,
                                    transform: hoveredIndex === i ? 'scale(1.2)' : 'scale(1)'
                                }}
                            />
                        </g>
                    ))}
                </svg>
            </div>

            {/* X Axis Labels */}
            <div style={{
                position: 'absolute',
                left: '50px',
                right: '10px',
                bottom: 0,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#6B7280',
                fontWeight: '700'
            }}>
                {labels.map((l, i) => (
                    <span key={i} style={{
                        flex: 1,
                        textAlign: 'center',
                        color: hoveredIndex === i ? '#22c55e' : '#6B7280',
                        transition: 'color 0.2s'
                    }}>{l}</span>
                ))}
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
