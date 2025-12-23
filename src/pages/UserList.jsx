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

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Gestão de Usuários</h1>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>E-mail</th>
                            <th style={{ padding: '1rem' }}>Função</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>{u.email}</td>
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
                                        color: u.status === 'Ativo' ? 'var(--color-success)' :
                                            u.status === 'Pendente' ? '#f1c40f' : 'var(--color-text-secondary)',
                                        fontWeight: '600'
                                    }}>
                                        {u.status || 'Pendente'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {/* Approval / Toggle Status */}
                                    {u.status === 'Pendente' ? (
                                        <button
                                            onClick={() => approveUser(u.id)}
                                            style={{
                                                backgroundColor: 'var(--color-success)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                                            }}
                                        >
                                            <CheckCircle size={14} /> Aprovar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleStatus(u.id, u.status)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: u.status === 'Ativo' ? '#e67e22' : 'var(--color-success)',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            {u.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                                        </button>
                                    )}

                                    {/* Delete User */}
                                    <button
                                        onClick={() => deleteUser(u.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-danger)',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center'
                                        }}
                                        title="Desativar Usuário"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
