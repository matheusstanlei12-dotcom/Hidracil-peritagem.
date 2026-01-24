export const initializeMock = () => {
    const MOCK_DATA_KEY = 'mock_peritagens_v2';

    // Helper to get data
    const getMockData = () => JSON.parse(localStorage.getItem(MOCK_DATA_KEY) || '[]');
    const saveMockData = (data) => localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(data));

    console.log("Initializing Supabase Mock for Offline Simulation...");

    const originalFetch = window.fetch;
    window.originalFetch = originalFetch; // Backup if needed

    window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;

        if (url && url.includes('supabase.co')) {
            console.log('[Mock] Intercepted:', url, init?.method);

            // 1. Mock Auth (Session)
            if (url.includes('/auth/v1/session') || url.includes('/auth/v1/token')) {
                return new Response(JSON.stringify({
                    access_token: "mock-token",
                    token_type: "bearer",
                    expires_in: 3600,
                    refresh_token: "mock-refresh",
                    user: { id: 'mock-user-id', email: 'simulacao@trust.com', role: 'authenticated' },
                    session: { user: { id: 'mock-user-id' } }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 2. Mock Profiles
            if (url.includes('/rest/v1/profiles')) {
                return new Response(JSON.stringify([{ id: 'mock-user-id', full_name: 'Simulador Offline', role: 'Gestor' }]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 3. Mock Peritagens (CRUD)
            if (url.includes('/rest/v1/peritagens')) {
                // INSERT
                if (init?.method === 'POST') {
                    const body = JSON.parse(init.body);
                    const current = getMockData();
                    const added = Array.isArray(body) ? body : [body];
                    const withIds = added.map(item => ({
                        ...item,
                        id: Math.random().toString(36).substr(2, 9),
                        created_at: item.created_at || new Date().toISOString()
                    }));
                    saveMockData([...current, ...withIds]);
                    return new Response(JSON.stringify(withIds), {
                        status: 201,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // SELECT
                if (!init?.method || init.method === 'GET') {
                    let data = getMockData();

                    // Simple URL param filtering
                    try {
                        const urlObj = new URL(url);

                        // Status filter
                        const statusMatch = urlObj.searchParams.get('status');
                        if (statusMatch) {
                            if (statusMatch.startsWith('eq.')) {
                                const val = decodeURIComponent(statusMatch.replace('eq.', '').replace(/\+/g, ' '));
                                data = data.filter(item => item.status === val);
                            } else if (statusMatch.startsWith('in.')) {
                                const vals = decodeURIComponent(statusMatch.replace('in.(', '').replace(')', '').replace(/\+/g, ' ')).split(',');
                                data = data.filter(item => vals.includes(item.status));
                            }
                        }

                        // Order (Basic approximation, just reverse for created_at usually)
                        if (url.includes('order=created_at.desc')) {
                            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        }

                    } catch (e) { console.warn("Mock filter error", e); }

                    return new Response(JSON.stringify(data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', 'Content-Range': `0-${data.length}/${data.length}` }
                    });
                }

                // UPDATE (PATCH)
                if (init?.method === 'PATCH') {
                    const urlObj = new URL(url);
                    const idMatch = urlObj.searchParams.get('id');
                    if (idMatch && idMatch.startsWith('eq.')) {
                        const id = idMatch.replace('eq.', '');
                        const updates = JSON.parse(init.body);

                        let data = getMockData();
                        let updatedItem = null;
                        data = data.map(item => {
                            if (String(item.id) === String(id)) {
                                updatedItem = { ...item, ...updates };
                                return updatedItem;
                            }
                            return item;
                        });
                        saveMockData(data);

                        return new Response(JSON.stringify(updatedItem ? [updatedItem] : []), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }
        }

        // Pass through other requests
        return originalFetch(input, init);
    };

    return true;
};
