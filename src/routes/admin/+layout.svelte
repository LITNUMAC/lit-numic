<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { page } from '$app/stores';
    import { fade, fly } from 'svelte/transition';
    import { LayoutDashboard, BookOpen, FileQuestion, Users, Settings, LogOut, Globe } from 'lucide-svelte';

    let user = null;
    let profile = null;
    let loading = true;

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = '/login';
            return;
        }
        user = session.user;

        // Proteksi Role: Hanya Admin yang boleh masuk
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            if (data.role !== 'admin') {
                alert("Akses Ditolak! Anda bukan Admin.");
                window.location.href = '/dashboard'; 
                return;
            }
            profile = data;
        }
        loading = false;
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    // Fungsi pembantu untuk cek menu aktif
    $: isActive = (path) => $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</svelte:head>

{#if loading}
    <div class="flex h-screen items-center justify-center bg-gray-50">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
    </div>
{:else}
    <div class="flex h-screen bg-gray-50 font-poppins overflow-hidden">
        
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
            <div class="h-20 flex items-center px-8 border-b border-gray-100">
                <h1 class="text-2xl font-bold text-blue-800 tracking-tighter font-fredoka">
                    LIT-NUMIC<span class="text-yellow-400">.</span>
                </h1>
            </div>

            <div class="py-6 px-4 flex-1 overflow-y-auto">
                <p class="text-[10px] font-black text-gray-400 mb-4 px-4 uppercase tracking-[0.2em]">Menu Utama</p>
                <nav class="space-y-1">
                    <a href="/admin" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all {isActive('/admin') && $page.url.pathname === '/admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                        <LayoutDashboard size={20} /> Dashboard
                    </a>

                    <a href="/admin/komik" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all {isActive('/admin/komik') ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                        <BookOpen size={20} /> Kelola Komik
                    </a>

                    <a href="/admin/soal" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all {isActive('/admin/soal') ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                        <FileQuestion size={20} /> Bank Soal
                    </a>

                    <a href="/admin/user" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all {isActive('/admin/user') ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                        <Users size={20} /> Manajemen User
                    </a>
                    
                    <div class="pt-6 border-t border-gray-50 mt-4">
                        <p class="text-[10px] font-black text-gray-400 mb-4 px-4 uppercase tracking-[0.2em]">Sistem</p>
                        <a href="/admin/pengaturan" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all {isActive('/admin/pengaturan') ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                            <Settings size={20} /> Pengaturan
                        </a>
                    </div>
                </nav>
            </div>

            <div class="p-4 border-t border-gray-100">
                <button on:click={handleLogout} class="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
                    <LogOut size={20} /> Logout Panel
                </button>
            </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
                <div class="flex items-center gap-6">
                    <h2 class="font-bold text-gray-800 uppercase tracking-widest text-xs">Admin Mode</h2>
                    <div class="h-4 w-px bg-gray-200"></div>
                    <a href="/dashboard" class="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2">
                        Pratinjau Web Siswa <Globe size={16} />
                    </a>
                </div>
                
                <div class="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <div class="text-right">
                        <p class="text-xs font-bold text-gray-900 leading-none">{profile?.full_name || 'Admin'}</p>
                        <p class="text-[10px] text-gray-400 mt-1 uppercase font-black">Super Admin</p>
                    </div>
                    <div class="w-10 h-10 bg-blue-100 rounded-xl border-2 border-white shadow-sm overflow-hidden">
                        <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=admin`} alt="Admin" />
                    </div>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
                <slot />
            </main>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
    .font-fredoka { font-family: 'Fredoka', sans-serif; }
</style>