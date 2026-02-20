<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly } from 'svelte/transition';

    let comics = [];
    let loading = true;

    onMount(async () => {
        // 1. Ambil semua komik
        const { data: comicsData, error } = await supabase
            .from('comics')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && comicsData) {
            // 2. Ambil data soal untuk menghitung jumlah soal per komik
            const { data: questionsData } = await supabase.from('questions').select('comic_id');
            
            // 3. Gabungkan datanya
            comics = comicsData.map(comic => {
                // Hitung ada berapa soal yang punya comic_id sama dengan komik ini
                const questionCount = questionsData ? questionsData.filter(q => q.comic_id === comic.id).length : 0;
                return { ...comic, questionCount };
            });
        }
        loading = false;
    });
</script>

<div in:fly={{ y: 20, duration: 500 }}>
    {#if loading}
        <div class="flex flex-col items-center justify-center py-20 text-blue-400 font-bold animate-pulse">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Memuat bank soal...
        </div>
    {:else}
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-blue-900 font-poppins">Kelola Bank Soal</h2>
            <p class="text-gray-500 text-sm">Pilih komik di bawah ini untuk menambahkan Kuis, Pilihan Ganda, dan Tag.</p>
        </div>

        {#if comics.length === 0}
            <div class="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-200">
                <h3 class="text-xl font-bold text-gray-700">Belum ada komik</h3>
                <p class="text-gray-500">Upload komik terlebih dahulu di menu Komik.</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {#each comics as comic}
                    <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-lg transition-all group">
                        <div class="w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                            {#if comic.cover_url}
                                <img src={comic.cover_url} alt={comic.title} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {:else}
                                <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Cover</div>
                            {/if}
                        </div>
                        
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{comic.title}</h3>
                            
                            {#if comic.questionCount > 0}
                                <span class="inline-block bg-green-50 text-green-600 px-2 py-1 rounded-md text-[10px] font-black tracking-widest mb-3">
                                    {comic.questionCount} SOAL TERSIMPAN
                                </span>
                            {:else}
                                <span class="inline-block bg-red-50 text-red-500 px-2 py-1 rounded-md text-[10px] font-black tracking-widest mb-3">
                                    BELUM ADA SOAL
                                </span>
                            {/if}

                            <a href="/admin/soal/{comic.id}" class="block w-full text-center bg-blue-50 text-blue-600 text-xs font-bold py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                                Kelola Soal 📝
                            </a>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>
</div>