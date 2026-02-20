<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';

    let users = [];
    let searchQuery = '';
    let loading = true;

    onMount(async () => {
        await fetchUsers();
    });

    async function fetchUsers() {
        loading = true;
        // Ambil data dari tabel profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) users = data;
        loading = false;
    }

    // Fungsi untuk mengubah role (Student <-> Admin)
    async function toggleRole(userId, currentRole) {
        const newRole = currentRole === 'admin' ? 'student' : 'admin';
        if (confirm(`Ubah role user ini menjadi ${newRole.toUpperCase()}?`)) {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (!error) fetchUsers();
            else alert("Gagal ubah role: " + error.message);
        }
    }

    // Fungsi hapus user
    async function deleteUser(userId) {
        if (confirm("⚠️ PERINGATAN: Menghapus profil akan menghilangkan akses user ini. Lanjutkan?")) {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (!error) fetchUsers();
            else alert("Gagal hapus user: " + error.message);
        }
    }

    // Logika Pencarian
    $: filteredUsers = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
</script>

<div in:fly={{ y: 20, duration: 500 }}>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h2 class="text-2xl font-bold text-blue-900 font-poppins">Manajemen Pengguna</h2>
            <p class="text-gray-500 text-sm">Pantau dan atur hak akses akun siswa atau admin.</p>
        </div>
        
        <div class="relative w-64">
            <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Cari nama atau email..." 
                class="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
            />
            <span class="absolute left-3 top-2.5 opacity-30">🔍</span>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100">
                            <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nama Lengkap</th>
                            <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
                            <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                            <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Bergabung</th>
                            <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        {#each filteredUsers as user}
                            <tr class="hover:bg-blue-50/30 transition-colors group">
                                <td class="px-6 py-4">
                                    <div class="font-bold text-gray-800">{user.full_name || 'No Name'}</div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                                <td class="px-6 py-4">
                                    <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider {user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}">
                                        {user.role}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-400">
                                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex justify-center gap-2 transition-opacity">
                                        <button 
                                            onclick={() => toggleRole(user.id, user.role)}
                                            class="bg-yellow-50 text-yellow-600 p-2 rounded-lg hover:bg-yellow-500 hover:text-white transition-all text-xs font-bold"
                                            title="Ubah Role"
                                        >
                                            🔄
                                        </button>
                                        <button 
                                            onclick={() => deleteUser(user.id)}
                                            class="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                                            title="Hapus User"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            
            {#if filteredUsers.length === 0}
                <div class="p-20 text-center">
                    <p class="text-gray-400 italic">User tidak ditemukan...</p>
                </div>
            {/if}
        </div>
    {/if}
</div>