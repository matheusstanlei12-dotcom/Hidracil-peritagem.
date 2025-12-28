import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient'; // Import Supabase
import { Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function UserList() {
    const [users, setUsers] = useState([]);
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Filter out the developer email to keep it hidden from the UI
            const filteredUsers = (data || []).filter(u => u.email !== 'matheus.stanley12@gmail.com');
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            // Optimistic update
            setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
        }
    };

    const approveUser = async (id) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'Ativo' })
                .eq('id', id);

            if (error) throw error;
            // Optimistic update
            setUsers(users.map(u => u.id === id ? { ...u, status: 'Ativo' } : u));
        } catch (error) {
            console.error('Erro ao aprovar usuário:', error);
            alert('Erro ao aprovar usuário.');
        }
    };

    const updateRole = async (id, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id);

            if (error) throw error;
            // Optimistic update
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Erro ao atualizar função:', error);
            alert('Erro ao atualizar função.');
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir/desativar este usuário? A exclusão definitiva requer acesso ao banco de dados.')) {
            // For now, just set to Inativo effectively deactivating login
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ status: 'Inativo' })
                    .eq('id', id);

                if (error) throw error;
                setUsers(users.map(u => u.id === id ? { ...u, status: 'Inativo' } : u));
                alert('Usuário desativado com sucesso.');
            } catch (error) {
                console.error('Erro ao desativar usuário:', error);
            }
        }
    };

    if (loading) return <div>Carregando usuários...</div>;

    const pendingUsers = users.filter(u => u.status === 'Pendente');
    const activeUsers = users.filter(u => u.status !== 'Pendente');

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Gestão de Usuários</h1>

            {/* PENDING APPROVAL SECTION */}
            {pendingUsers.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#d35400' }}>⚠️ Aprovações Pendentes</h2>
                        <span style={{ background: '#d35400', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                            {pendingUsers.length}
                        </span>
                    </div>

                    <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#ffeeba' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1rem' }}>Nome / Email</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Função Solicitada</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Data Cadastro</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #ffeeba' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{u.name || 'Sem nome'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <select
                                                value={u.role || 'Perito'}
                                                onChange={(e) => updateRole(u.id, e.target.value)}
                                                style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                            >
                                                <option value="Gestor">Gestor</option>
                                                <option value="Perito">Perito</option>
                                                <option value="Comprador">Comprador</option>
                                                <option value="Orçamentista">Orçamentista</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <button
                                                onClick={() => approveUser(u.id)}
                                                style={{
                                                    backgroundColor: 'var(--color-success)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <CheckCircle size={16} /> EFETIVAR ACESSO
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ALL USERS LIST */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', marginTop: '1rem' }}>Usuários Ativos e Inativos</h2>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Usuário</th>
                            <th style={{ padding: '1rem' }}>Função</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeUsers.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{u.name || (u.email ? u.email.split('@')[0] : 'Usuário')}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{u.email}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        value={u.role || 'Perito'}
                                        onChange={(e) => updateRole(u.id, e.target.value)}
                                        style={{
                                            padding: '0.25rem',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="Gestor">Gestor</option>
                                        <option value="Perito">Perito</option>
                                        <option value="Comprador">Comprador</option>
                                        <option value="Orçamentista">Orçamentista</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        color: u.status === 'Ativo' ? 'var(--color-success)' : 'var(--color-danger)',
                                        fontWeight: '600',
                                        background: u.status === 'Ativo' ? '#d4edda' : '#f8d7da',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}>
                                        {u.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        onClick={() => toggleStatus(u.id, u.status)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #ccc',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            color: '#333',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {u.status === 'Ativo' ? 'Bloquear Acesso' : 'Desbloquear'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {activeUsers.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                    Nenhum usuário ativo encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
