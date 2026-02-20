<script>
  import { onMount, getContext } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { fade, fly, scale } from 'svelte/transition';
  import { Library, Flame } from 'lucide-svelte';
  import { getCached, setCached } from '$lib/cache';

  const { profile, user, loadingProfile } = getContext('appState');

  let loading = $state(true);
  let comics = $state({ unread: [], completed: [] });
  let lastRead = $state({ 
      title: "Belum ada bacaan", 
      id: null, 
      page: 1, 
      totalPages: 1, 
      progressPercent: 0,
      cover_url: "" 
  });

  async function updateStreakInDB(userId, newStreak) {
    const today = new Date().toISOString();
    await supabase.from('profiles').update({ streak: newStreak, last_active: today }).eq('id', userId);
  }

  async function fetchData() {
    if (!user) return;
    
    // 1. Cek Cache
    const cachedData = getCached('dashboard');
    if (cachedData) {
        comics = cachedData.comics;
        lastRead = cachedData.lastRead;
        loading = false;
        return;
    }

    loading = true;

    // 2. Parallel Fetching (Comics, Progress, and Profile)
    const [comicsRes, progressRes, profileRes] = await Promise.all([
        supabase.from('comics')
            .select('id, title, cover_url, description, total_pages, status, created_at')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(20),
        supabase.from('student_progress')
            .select('comic_id, is_completed, last_read_page, updated_at')
            .eq('user_id', user.id),
        supabase.from('profiles')
            .select('id, avatar_url, full_name, streak') // Ditambahkan full_name & streak agar UI tidak pecah
            .eq('id', user.id)
            .single()
    ]);

    // Set loading false SEGERA setelah Promise.all selesai
    loading = false;

    const allComics = comicsRes.data;
    const userProgress = progressRes.data;
    const profileData = profileRes.data;

    if (allComics) {
      const newComics = { unread: [], completed: [] };
      allComics.forEach(comic => {
        const prog = userProgress?.find(p => p.comic_id === comic.id);
        if (prog && prog.is_completed) newComics.completed.push(comic);
        else newComics.unread.push(comic);
      });
      comics = newComics;

      if (userProgress && userProgress.length > 0) {
        const sortedProgress = [...userProgress].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        const latest = sortedProgress[0];
        const lastComic = allComics.find(c => c.id === latest.comic_id);

        if (lastComic) {
            let totalPages = lastComic.total_pages || 20; 
            const currentPage = latest.last_read_page || 1;
            if (currentPage > totalPages) totalPages = currentPage;
            const percent = Math.min(100, Math.round((currentPage / totalPages) * 100));

            lastRead = { 
                title: lastComic.title, 
                id: lastComic.id, 
                page: currentPage,
                totalPages: totalPages,
                progressPercent: percent,
                cover_url: lastComic.cover_url
            };
        }
      }

      // 3. Simpan ke Cache
      setCached('dashboard', { comics, lastRead });
    }
  }

  onMount(() => { 
    if (user) fetchData(); 
  });

  // Re-fetch if user becomes available (e.g. after login/mount in layout)
  $effect(() => {
    if (user && loading) fetchData();
  });
</script>

<div in:fade>
    {#if loading || loadingProfile}
        <div class="flex flex-col items-center justify-center py-20 text-blue-400 font-bold animate-pulse">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Memuat data dashboard...
        </div>
    {:else}
        <div class="mb-10">
            <h2 class="text-3xl font-bold text-blue-900 font-fredoka">Halo, {profile?.full_name || user?.email?.split('@')[0]}! </h2>
            <p class="text-blue-400 font-medium text-sm">Siap menaklukan tantangan hari ini?</p>
        </div>
        
        <section class="mb-12" in:fly={{ y: 20, duration: 600 }}>
            <h3 class="text-xl font-bold text-gray-800 mb-6">Pantau aktivitas membaca</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all group">
                    <div class="mb-3 p-3 bg-yellow-50 rounded-full group-hover:bg-yellow-100 transition-colors group-hover:scale-110 transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
                    </div>
                    <div class="text-4xl font-black text-gray-800 font-fredoka mb-1">{comics.unread.length + comics.completed.length}</div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Koleksi</div>
                </div>

                <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all group">
                    <div class="mb-3 p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors group-hover:scale-110 transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <div class="text-4xl font-black text-gray-800 font-fredoka mb-1">{lastRead.id ? 1 : 0}</div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sedang Dibaca</div>
                </div>

                <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all group">
                    <div class="mb-3 p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors group-hover:scale-110 transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div class="text-4xl font-black text-gray-800 font-fredoka mb-1">{comics.completed.length}</div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sudah Selesai</div>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div class="lg:col-span-2 bg-gradient-to-br from-blue-700 to-blue-500 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                {#if lastRead.id}
                    {#if lastRead.cover_url}
                        <img src={lastRead.cover_url} alt="cover" class="absolute top-0 right-0 w-1/2 h-full object-cover opacity-10 mask-image-gradient" />
                    {/if}
                    <div class="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div class="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black mb-2 border border-white/10 tracking-widest uppercase"> Lanjutkan Cerita</div>
                            <h3 class="text-3xl font-bold mb-1 line-clamp-1">{lastRead.title}</h3>
                            <div class="flex items-center gap-2 text-blue-100 text-sm opacity-90">
                                <span>Halaman {lastRead.page} dari {lastRead.totalPages}</span>
                                <span>•</span>
                                <span>{lastRead.progressPercent}% Selesai</span>
                            </div>
                        </div>
                        <div class="mt-8 flex items-end justify-between gap-6">
                            <div class="flex-1">
                                <div class="flex justify-between text-xs font-bold mb-2"><span class="text-blue-100">Progress</span><span class="text-yellow-300">{lastRead.progressPercent}%</span></div>
                                <div class="w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/10">
                                    <div class="bg-yellow-400 h-full rounded-full transition-all duration-1000" style="width: {lastRead.progressPercent}%"></div>
                                </div>
                            </div>
                              <button aria-label="Lanjutkan Membaca" onclick={() => window.location.href = `/read/${lastRead.id}`} class="bg-white text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="relative z-10 flex flex-col justify-center h-full items-center text-center py-10">
                        <div class="mb-4 text-blue-200"><Library size={64} /></div>
                        <h3 class="text-2xl font-bold">Yuk Mulai Membaca!</h3>
                        <p class="text-blue-100 text-sm">Pilih cerita menarik di bawah ini.</p>
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-50 flex flex-col justify-between items-center text-center relative overflow-hidden">
                <div class="flex flex-col items-center">
                    <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <span class="text-orange-500 scale-125"><Flame size={32} /></span>
                    </div>
                    <p class="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-1">{profile?.streak || 0} HARI STREAK!</p>
                    <h3 class="text-xs font-bold text-gray-400 uppercase">Konsistensi Belajar</h3>
                </div>
                
                <div class="w-full px-4 py-6 relative">
                    <div class="absolute top-1/2 left-4 right-4 h-2 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                    <div class="absolute top-1/2 left-4 h-2 bg-gradient-to-r from-orange-400 to-orange-600 -translate-y-1/2 rounded-full transition-all duration-700" style="width: {Math.max(0, (( (profile?.streak-1) % 5 ) / 4) * 100)}%"></div>
                    <div class="relative flex justify-between w-full">
                        {#each Array(5) as _, i}
                            <div class="flex flex-col items-center"><div class="w-5 h-5 rounded-full border-4 transition-all duration-500 z-10 { (profile?.streak % 5 || (profile?.streak > 0 ? 5 : 0)) > i ? 'bg-orange-500 border-orange-100 scale-125 shadow-md shadow-orange-200' : 'bg-white border-gray-100' }"></div></div>
                        {/each}
                    </div>
                </div>
                <p class="text-[10px] font-bold text-blue-400 bg-blue-50/80 px-4 py-2 rounded-xl italic">Ayo pertahankan apinya! </p>
            </div>
        </div>

        <div class="mb-14">
            <div class="flex items-center gap-3 mb-8 px-2">
                <div class="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h3 class="text-2xl font-bold text-blue-900" style="font-family: 'Fredoka', sans-serif;">Tantangan Baru <span class="text-yellow-500">.</span></h3>
            </div>
            {#if comics.unread.length > 0}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {#each comics.unread as comic}
                        <div class="bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border border-transparent hover:border-blue-100 relative">
                            <div class="relative h-56 rounded-[2rem] overflow-hidden mb-5 shadow-inner">
                                <img src={comic.cover_url} alt={comic.title} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-full">{comic.total_pages || 0} HAL</div>
                            </div>
                            <h4 class="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-600 line-clamp-1">{comic.title}</h4>
                            <p class="text-xs text-gray-400 line-clamp-2 mb-6 leading-relaxed">{comic.description}</p>
                            <button onclick={() => window.location.href = `/read/${comic.id}`} class="w-full bg-blue-50 text-blue-600 font-black py-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all active:scale-95 shadow-sm uppercase tracking-widest text-xs">Baca Sekarang </button>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="bg-blue-50/50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-blue-200"><p class="text-blue-400 font-bold italic">Hebat! Semua tantangan sudah kamu selesaikan. </p></div>
            {/if}
        </div>

        <div class="mb-10 pb-10">
            <div class="flex items-center gap-3 mb-8 px-2 opacity-50">
                <div class="w-2 h-8 bg-green-500 rounded-full"></div>
                <h3 class="text-2xl font-bold text-blue-900" style="font-family: 'Fredoka', sans-serif;">Sudah Selesai </h3>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {#each comics.completed as comic}
                    <div class="bg-white rounded-[2rem] p-5 shadow-sm border border-green-50 flex flex-col grayscale hover:grayscale-0 transition-all group relative opacity-80 hover:opacity-100">
                        <div class="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-10"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
                        <div class="h-36 rounded-2xl overflow-hidden mb-4 shadow-inner"><img src={comic.cover_url} alt={comic.title} class="w-full h-full object-cover" /></div>
                        <h4 class="font-bold text-sm text-gray-600 line-clamp-1 mb-3">{comic.title}</h4>
                        <button onclick={() => window.location.href = `/read/${comic.id}`} class="text-[10px] font-black text-blue-500 py-2.5 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">BACA LAGI</button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>