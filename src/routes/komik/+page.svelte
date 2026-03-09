<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';
    import { Search, BookOpen } from 'lucide-svelte';
    import { getCached, setCached } from '$lib/cache';

    let comics = $state([]);
    let loading = $state(true);
    let searchQuery = $state('');
    let filterLevel = $state('Semua');

    const levels = ['Semua', 'Mudah', 'Sedang', 'Sulit'];

    onMount(async () => {
        const cached = getCached('userComics');
        if (cached) {
            comics = cached;
            loading = false;
            return;
        }

        const { data, error } = await supabase
            .from('comics')
            .select('id, title, cover_url, description, level')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (!error) {
            comics = data;
            setCached('userComics', data);
        }
        loading = false;
    });

    let filteredComics = $derived(() => {
        let result = comics;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
        }
        if (filterLevel !== 'Semua') {
            result = result.filter(c => c.level === filterLevel);
        }
        return result;
    });
</script>

<div class="p-4 md:p-8 font-poppins max-w-6xl mx-auto">
    <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-blue-900 font-fredoka">📚 Komik</h2>
        <p class="text-sm text-gray-400 mt-1">Pilih komik dan mulai belajar!</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
            <Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Cari komik..."
                class="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
            />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1">
            {#each levels as level}
                <button
                    onclick={() => filterLevel = level}
                    class="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all
                    {filterLevel === level ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-blue-50'}"
                >
                    {level}
                </button>
            {/each}
        </div>
    </div>

    {#if loading}
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each Array(8) as _}
                <div class="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse"></div>
            {/each}
        </div>
    {:else if filteredComics().length === 0}
        <div class="text-center py-20">
            <p class="text-6xl mb-4">📭</p>
            <p class="text-gray-400 font-medium">Belum ada komik yang tersedia.</p>
        </div>
    {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" in:fade>
            {#each filteredComics() as comic, i}
                <a
                    href="/read/{comic.id}"
                    class="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 transform hover:-translate-y-1"
                    in:fly={{ y: 20, delay: i * 50, duration: 400 }}
                >
                    <div class="aspect-[3/4] overflow-hidden bg-gray-50">
                        {#if comic.cover_url}
                            <img
                                src={comic.cover_url}
                                alt={comic.title}
                                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                            />
                        {:else}
                            <div class="w-full h-full flex items-center justify-center bg-blue-50">
                                <BookOpen size={40} class="text-blue-200" />
                            </div>
                        {/if}
                    </div>
                    <div class="p-3">
                        <h3 class="font-bold text-sm text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{comic.title}</h3>
                        {#if comic.level}
                            <span class="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full
                                {comic.level === 'Mudah' ? 'bg-green-100 text-green-700' :
                                 comic.level === 'Sedang' ? 'bg-yellow-100 text-yellow-700' :
                                 'bg-red-100 text-red-700'}">
                                {comic.level}
                            </span>
                        {/if}
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
