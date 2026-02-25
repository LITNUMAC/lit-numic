<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';
    import { Search } from 'lucide-svelte';
    import { getCached, setCached } from '$lib/cache';

    let comics = [];
    let loading = true;
    let searchQuery = '';
    let filterStatus = 'All';

    onMount(async () => {
        await fetchComics();
    });

    async function fetchComics() {
        // 1. Cek Cache
        const cached = getCached('comics');
        if (cached && searchQuery === '' && filterStatus === 'All') {
            comics = cached;
            loading = false;
            return;
        }

        loading = true;
        
        // 2. Fetch dengan Specific Columns & Limit
        const { data, error } = await supabase
            .from('comics')
            .select('id, title, cover_url, description, status, level, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error) {
            comics = data;
            // 3. Simpan ke Cache jika ini query default
            if (searchQuery === '' && filterStatus === 'All') {
                setCached('comics', data);
            }
        }
        loading = false;
    }

    // FUNGSI BARU: Klik status langsung berubah (Active <-> Draft)
    async function togglePublish(id, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        const { error } = await supabase
            .from('comics')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            await fetchComics(); // Refresh data biar tabel berubah warnanya
        } else {
            alert("Gagal mengubah status: " + error.message);
        }
    }

    async function deleteComic(id) {
        if (confirm("⚠️ Hapus komik ini secara permanen? Seluruh soal terkait juga akan terhapus.")) {
            // Hapus record terkait terlebih dahulu (cascade manual)
            const { error: e1 } = await supabase.from('student_progress').delete().eq('comic_id', id);
            if (e1) console.warn('Hapus student_progress gagal (mungkin RLS):', e1.message);

            const { error: e2 } = await supabase.from('questions').delete().eq('comic_id', id);
            if (e2) console.warn('Hapus questions gagal (mungkin RLS):', e2.message);

            const { error: e3 } = await supabase.from('quiz_scores').delete().eq('comic_id', id);
            if (e3) console.warn('Hapus quiz_scores gagal (mungkin RLS):', e3.message);

            const { error } = await supabase.from('comics').delete().eq('id', id);
            if (!error) {
                // Hapus comic dari list lokal langsung tanpa tunggu refetch
                comics = comics.filter(c => c.id !== id);
                // Hapus cache
                setCached('comics', null);
            } else {
                console.error('Hapus komik gagal:', error);
                alert("Gagal menghapus komik: " + error.message + "\n\nSolusi: Hapus dulu data terkait di Supabase atau tambahkan RLS policy DELETE untuk admin.");
            }
        }
    }

    // Logika Filter & Search
    $: filteredComics = comics.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'All' || c.status === filterStatus.toLowerCase();
        return matchesSearch && matchesFilter;
    });
</script>

<div in:fly={{ y: 20, duration: 500 }} class="pb-10">
    {#if loading}
        <div class="flex flex-col items-center justify-center py-20 text-blue-400 font-bold animate-pulse">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Memuat data komik...
        </div>
    {:else}
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-bold text-blue-900 font-poppins">Kelola Komik</h2>
                <p class="text-gray-500 text-sm">Klik pada status untuk menerbitkan atau menarik komik.</p>
            </div>
            <a href="/admin/komik/tambah" class="bg-yellow-400 text-blue-900 px-6 py-3 rounded-xl font-black hover:bg-yellow-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-100 flex items-center gap-2">
                <span>+</span> Tambah Komik
            </a>
        </div>

        <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div class="relative flex-1 w-full">
                <span class="absolute left-4 top-3 text-gray-400"><Search size={20} /></span>
                <input 
                    type="text" 
                    bind:value={searchQuery}
                    placeholder="Cari judul komik..." 
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter:</span>
                <select bind:value={filterStatus} class="flex-none bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All</option>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Draft</option>
                </select>
            </div>
        </div>

        <div class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-50 bg-gray-50/50">
                <h3 class="font-bold text-blue-900 uppercase text-xs tracking-widest text-left">Tabel Data Komik</h3>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                            <th class="px-8 py-4">Cover</th>
                            <th class="px-8 py-4">Judul Komik</th>
                            <th class="px-8 py-4 text-center">Level</th>
                            <th class="px-8 py-4 text-center">Status</th>
                            <th class="px-8 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        {#if filteredComics.length === 0}
                            <tr><td colspan="5" class="py-20 text-center text-gray-400 italic">Tidak ada komik yang ditemukan.</td></tr>
                        {:else}
                            {#each filteredComics as comic (comic.id)}
                                <tr class="hover:bg-blue-50/30 transition-colors group" in:fade>
                                    <td class="px-8 py-4">
                                        <div class="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                            <img src={comic.cover_url} alt="Cover" class="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td class="px-8 py-4">
                                        <div class="font-bold text-gray-800">{comic.title}</div>
                                        <div class="text-[10px] text-gray-400 line-clamp-1">{comic.description}</div>
                                    </td>
                                    <td class="px-8 py-4 text-center">
                                        <span class="font-bold text-gray-500">{comic.level || '1'}</span>
                                    </td>
                                    <td class="px-8 py-4 text-center">
                                        <button 
                                            onclick={() => togglePublish(comic.id, comic.status)}
                                            title="Klik untuk mengubah status"
                                            class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-110 active:scale-95
                                            {comic.status === 'active' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}">
                                            {comic.status || 'draft'}
                                        </button>
                                    </td>
                                    <td class="px-8 py-4">
                                        <div class="flex justify-center items-center gap-2">
                                            <a href="/admin/soal/{comic.id}" class="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">SOAL</a>
                                            <button onclick={() => alert('Fitur Edit segera hadir!')} class="bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm">EDIT</button>
                                            <button onclick={() => deleteComic(comic.id)} class="bg-red-50 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-500 hover:text-white transition-all shadow-sm">HAPUS</button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="mt-6 px-4 text-center">
            <p class="text-[10px] text-gray-400 font-medium tracking-widest uppercase">LIT-NUMIC Admin Panel • Total {filteredComics.length} Komik Terfilter</p>
        </div>
    {/if}
</div>
