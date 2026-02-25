<script>
  import { onMount, getContext } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { fade, fly, scale } from 'svelte/transition';
  import { Library, Flame } from 'lucide-svelte';
  import { t } from '$lib/i18n';
  // Cache import disabled for emergency debug

  const { profile, user, loadingProfile } = getContext('appState');

  // Local fallback user — populated from direct Supabase auth if context is slow
  let resolvedUser = $state(null);
  let fetchedOnce = $state(false);

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

  // Explicit stats variables for UI mapping
  let totalKoleksi = $state(0);
  let sedangDibaca = $state(0);
  let sudahSelesai = $state(0);

  // Helper: get the best available user object
  function getActiveUser() {
    return user ?? resolvedUser;
  }

  async function updateStreakInDB(userId, newStreak) {
    try {
        const today = new Date().toISOString();
        await supabase.from('profiles').update({ streak: newStreak, last_active: today }).eq('id', userId);
    } catch (e) {
        console.error("Gagal update streak:", e);
    }
  }

  async function fetchData() {
    console.log('fetchData started...');
    const activeUser = getActiveUser();
    if (!activeUser) {
        console.log('Menunggu status login... (user masih null)');
        loading = false;
        return;
    }
    console.log('User detected:', activeUser.id);

    // EMERGENCY DIRECT TEST: Strip all complexity
    console.log('Mencoba ambil komik...');
    const comicsRes = await supabase.from('comics').select('*');
    console.log('TEST KOMIK:', comicsRes);

    console.log('Mencoba ambil progres membaca...');
    const progressRes = await supabase.from('student_progress').select('*').eq('user_id', activeUser.id);
    console.log('TEST PROGRES:', progressRes);

    // Map data to state
    const allComics = comicsRes.data || [];
    const userProgress = progressRes.data || [];

    const newComics = { unread: [], completed: [] };
    allComics.forEach(comic => {
        const prog = userProgress.find(p => p.comic_id === comic.id);
        if (prog && prog.is_completed) {
            newComics.completed.push(comic);
        } else {
            newComics.unread.push(comic);
        }
    });

    let foundLastRead = null;
    if (userProgress.length > 0) {
        const sorted = [...userProgress].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const latest = sorted[0];
        const lastComic = allComics.find(c => c.id === latest.comic_id);
        if (lastComic) {
            const currentPage = Number(latest.last_read_page || 1);
            const totalPages = Math.max(currentPage, Number(lastComic.total_pages || 20));
            foundLastRead = {
                title: lastComic.title,
                id: lastComic.id,
                page: currentPage,
                totalPages,
                progressPercent: Math.min(100, Math.round((currentPage / totalPages) * 100)),
                cover_url: lastComic.cover_url
            };
        }
    }

    // Assign state
    comics = { unread: [...newComics.unread], completed: [...newComics.completed] };
    lastRead = foundLastRead ?? { title: 'Belum ada bacaan', id: null, page: 1, totalPages: 1, progressPercent: 0, cover_url: '' };
    totalKoleksi = Number(allComics.length);
    sedangDibaca = foundLastRead ? 1 : 0;
    sudahSelesai = Number(newComics.completed.length);

    console.log('Update UI dengan data:', { totalKoleksi, sedangDibaca, sudahSelesai });
    console.log('AKHIR FETCH - Koleksi:', totalKoleksi);
    loading = false;
  }

  onMount(async () => {
    console.log('onMount jalan...');

    // If context user is already available, fetch immediately
    if (user) {
        console.log('Context user ready:', user.id);
        resolvedUser = user;
        await fetchData();
    } else {
        // Context hasn't resolved yet — fallback to direct Supabase auth
        console.log('Context user null, trying supabase.auth.getUser()...');
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
            console.log('Fallback auth success:', data.user.id);
            resolvedUser = data.user;
            await fetchData();
        } else {
            console.warn('No authenticated user found. Cannot load dashboard.');
            loading = false;
        }
    }
    // Safety valve
    loading = false;
  });

  // Auth Watcher: re-fetch when context user becomes available after mount
  $effect(() => {
    const ctxUser = user;
    if (ctxUser && !fetchedOnce) {
        console.log('Auth Watcher: user available:', ctxUser.id);
        resolvedUser = ctxUser;
        fetchedOnce = true;
        fetchData();
    }
  });
</script>

<div in:fade>
    {#if loading}
        <!-- DASHBOARD SKELETON SCREEN -->
        <div class="flex flex-col gap-10" in:fade>
            <!-- Header Skeleton: Logo pulsing -->
            <div class="flex flex-col items-start gap-3">
                <img src="/logo_statis.svg" alt="LIT-NUMIC" class="h-14 w-auto opacity-30 animate-pulse" />
                <div class="h-3 w-48 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>

            <!-- Stats Skeleton -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {#each Array(3) as _}
                    <div class="bg-white p-8 rounded-[2rem] border border-gray-100 flex flex-col items-center gap-4 animate-pulse">
                        <div class="w-12 h-12 bg-gray-100 rounded-full"></div>
                        <div class="h-8 w-16 bg-gray-200 rounded-xl"></div>
                        <div class="h-3 w-24 bg-gray-100 rounded-lg"></div>
                    </div>
                {/each}
            </div>

            <!-- Hero Skeleton -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Large Card Skeleton -->
                <div class="lg:col-span-2 h-64 bg-gray-200 rounded-[2.5rem] animate-pulse relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    <div class="p-8 space-y-4">
                        <div class="h-6 w-32 bg-gray-300 rounded-lg"></div>
                        <div class="h-10 w-3/4 bg-gray-300 rounded-xl"></div>
                        <div class="h-4 w-1/2 bg-gray-300 rounded-lg"></div>
                    </div>
                </div>
                <!-- Small Card Skeleton -->
                <div class="h-64 bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-between animate-pulse">
                    <div class="w-16 h-16 bg-gray-100 rounded-full"></div>
                    <div class="h-4 w-32 bg-gray-200 rounded-lg"></div>
                    <div class="w-full h-8 bg-gray-100 rounded-full"></div>
                    <div class="h-8 w-3/4 bg-gray-100 rounded-2xl"></div>
                </div>
            </div>

            <!-- Grid Skeleton -->
            <div class="space-y-8">
                <div class="h-8 w-48 bg-gray-200 rounded-xl animate-pulse"></div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {#each Array(3) as _}
                        <div class="bg-white rounded-[2.5rem] p-6 border border-gray-100 space-y-4 animate-pulse">
                            <div class="h-56 bg-gray-100 rounded-[2rem]"></div>
                            <div class="h-6 w-3/4 bg-gray-200 rounded-lg"></div>
                            <div class="h-4 w-full bg-gray-100 rounded-lg"></div>
                            <div class="h-12 w-full bg-gray-200 rounded-2xl"></div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {:else}
        <div class="mb-6 md:mb-10">
            <h2 class="text-2xl md:text-3xl font-bold text-blue-900 font-fredoka">{$t('dashGreeting')} {profile?.full_name || user?.email?.split('@')[0] || "Teman"}! </h2>
            <p class="text-blue-400 font-medium text-xs md:text-sm">{$t('dashSubtitle')}</p>
        </div>
        
        <section class="mb-8 md:mb-12" in:fly={{ y: 20, duration: 600 }}>
            <h3 class="text-base md:text-xl font-bold text-gray-800 mb-3 md:mb-6">{$t('dashActivity')}</h3>
            <div class="grid grid-cols-3 gap-3 md:gap-6">
                
                <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all group">
                    <div class="mb-2 md:mb-3 p-2 md:p-3 bg-yellow-50 rounded-full group-hover:bg-yellow-100 transition-colors group-hover:scale-110 transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
                    </div>
                    <div class="text-2xl md:text-4xl font-black text-gray-800 font-fredoka mb-1">{totalKoleksi}</div>
                    <div class="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{$t('dashStatTotal')}</div>
                </div>

                <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all group">
                    <div class="mb-2 md:mb-3 p-2 md:p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors group-hover:scale-110 transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <div class="text-2xl md:text-4xl font-black text-gray-800 font-fredoka mb-1">{sedangDibaca}</div>
                    <div class="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{$t('dashStatReading')}</div>
                </div>

                <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all group">
                    <div class="mb-2 md:mb-3 p-2 md:p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors group-hover:scale-110 transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div class="text-2xl md:text-4xl font-black text-gray-800 font-fredoka mb-1">{sudahSelesai}</div>
                    <div class="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{$t('dashStatDone')}</div>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div class="lg:col-span-2 bg-gradient-to-br from-blue-700 to-blue-500 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 text-white shadow-xl relative overflow-hidden group" style="min-height: 160px;">
                {#if lastRead?.id}
                    {#if lastRead.cover_url}
                        <img src={lastRead.cover_url} alt="cover" class="absolute top-0 right-0 w-1/2 h-full object-cover opacity-10 mask-image-gradient" />
                    {/if}
                    <div class="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div class="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black mb-2 border border-white/10 tracking-widest uppercase"> {$t('dashContinueStory')}</div>
                            <h3 class="text-xl md:text-3xl font-bold mb-1 line-clamp-1">{lastRead.title}</h3>
                            <div class="flex items-center gap-2 text-blue-100 text-xs md:text-sm opacity-90">
                                <span>{$t('dashPage')} {lastRead.page} {$t('dashOf')} {lastRead.totalPages}</span>
                                <span>•</span>
                                <span>{lastRead.progressPercent}% {$t('dashStatDone')}</span>
                            </div>
                        </div>
                        <div class="mt-4 md:mt-8 flex items-end justify-between gap-4 md:gap-6">
                            <div class="flex-1">
                                <div class="flex justify-between text-xs font-bold mb-2"><span class="text-blue-100">{$t('dashProgress')}</span><span class="text-yellow-300">{lastRead.progressPercent}%</span></div>
                                <div class="w-full bg-black/20 rounded-full h-2 md:h-3 overflow-hidden border border-white/10">
                                    <div class="bg-yellow-400 h-full rounded-full transition-all duration-1000" style="width: {lastRead.progressPercent}%"></div>
                                </div>
                            </div>
                              <button aria-label="Lanjutkan Membaca" onclick={() => window.location.href = `/read/${lastRead.id}`} class="bg-white text-blue-600 w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="relative z-10 flex flex-col justify-center h-full items-center text-center py-8 md:py-10">
                        <div class="mb-4 text-blue-200"><Library size={48} /></div>
                        <h3 class="text-xl md:text-2xl font-bold">Yuk Mulai Membaca!</h3>
                        <p class="text-blue-100 text-sm">Pilih cerita menarik di bawah ini.</p>
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-sm border border-blue-50 flex flex-col justify-between items-center text-center relative overflow-hidden">
                <div class="flex flex-col items-center">
                    <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <span class="text-orange-500 scale-125"><Flame size={32} /></span>
                    </div>
                    <p class="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-1">{(profile?.streak || 0)} HARI STREAK!</p>
                    <h3 class="text-xs font-bold text-gray-400 uppercase">Konsistensi Belajar</h3>
                </div>
                
                <div class="w-full px-4 py-6 relative">
                    <div class="absolute top-1/2 left-4 right-4 h-2 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                    <div class="absolute top-1/2 left-4 h-2 bg-gradient-to-r from-orange-400 to-orange-600 -translate-y-1/2 rounded-full transition-all duration-700" style="width: {Math.max(0, (( ((profile?.streak || 0) - 1) % 5 ) / 4) * 100)}%"></div>
                    <div class="relative flex justify-between w-full">
                        {#each Array(5) as _, i}
                            <div class="flex flex-col items-center"><div class="w-5 h-5 rounded-full border-4 transition-all duration-500 z-10 { ((profile?.streak || 0) % 5 || ((profile?.streak || 0) > 0 ? 5 : 0)) > i ? 'bg-orange-500 border-orange-100 scale-125 shadow-md shadow-orange-200' : 'bg-white border-gray-100' }"></div></div>
                        {/each}
                    </div>
                </div>
                <p class="text-[10px] font-bold text-blue-400 bg-blue-50/80 px-4 py-2 rounded-xl italic">Ayo pertahankan apinya! </p>
            </div>
        </div>

        <div class="mb-8 md:mb-12">
            <div class="flex items-center gap-3 mb-4 md:mb-8 px-2">
                <div class="w-2 h-8 bg-yellow-500 rounded-full"></div>
                <h3 class="text-lg md:text-2xl font-bold text-blue-900" style="font-family: 'Fredoka', sans-serif;">Tantangan Baru <span class="text-yellow-500">.</span></h3>
            </div>
            {#if comics?.unread?.length > 0}
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {#each comics.unread as comic}
                        <div class="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 group border border-transparent hover:border-blue-100 relative">
                            <div class="relative h-36 md:h-56 rounded-2xl md:rounded-[2rem] overflow-hidden mb-3 md:mb-5 shadow-inner">
                                <img src={comic.cover_url} alt={comic.title} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-md text-blue-600 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-full">{comic.total_pages || 0} HAL</div>
                            </div>
                            <h4 class="font-bold text-sm md:text-xl text-gray-800 mb-1 md:mb-2 group-hover:text-blue-600 line-clamp-1">{comic.title}</h4>
                            <p class="text-xs text-gray-400 line-clamp-2 mb-3 md:mb-6 leading-relaxed hidden md:block">{comic.description}</p>
                            <button onclick={() => window.location.href = `/read/${comic.id}`} class="w-full bg-blue-50 text-blue-600 font-black py-2.5 md:py-4 rounded-xl md:rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all active:scale-95 shadow-sm uppercase tracking-widest text-[10px] md:text-xs">Baca </button>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="bg-blue-50/50 rounded-[2rem] p-8 md:p-12 text-center border-2 border-dashed border-blue-200"><p class="text-blue-400 font-bold italic">Hebat! Semua tantangan sudah kamu selesaikan. </p></div>
            {/if}
        </div>

        <div class="mb-10 pb-10">
            <div class="flex items-center gap-3 mb-4 md:mb-8 px-2 opacity-50">
                <div class="w-2 h-8 bg-green-500 rounded-full"></div>
                <h3 class="text-lg md:text-2xl font-bold text-blue-900" style="font-family: 'Fredoka', sans-serif;">{$t('dashCompleted')} </h3>
            </div>
            {#if comics?.completed?.length > 0}
                <div class="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                    {#each comics.completed as comic}
                        <div class="bg-white rounded-2xl md:rounded-[2rem] p-3 md:p-5 shadow-sm border border-green-50 flex flex-col grayscale hover:grayscale-0 transition-all group relative opacity-80 hover:opacity-100">
                            <div class="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-10"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
                            <div class="h-24 md:h-36 rounded-xl md:rounded-2xl overflow-hidden mb-2 md:mb-4 shadow-inner"><img src={comic.cover_url} alt={comic.title} class="w-full h-full object-cover" /></div>
                            <h4 class="font-bold text-xs md:text-sm text-gray-600 line-clamp-1 mb-2 md:mb-3">{comic.title}</h4>
                            <button onclick={() => window.location.href = `/read/${comic.id}`} class="text-[9px] md:text-[10px] font-black text-blue-500 py-2 md:py-2.5 bg-blue-50 rounded-lg md:rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">BACA</button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  .font-fredoka { font-family: 'Fredoka', sans-serif; }

  
  /* Prevent scroll jumping when layout is fixed */
  :global(html) {
      scrollbar-gutter: stable;
  }

  /* Shimmer Animation for Skeleton */
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
</style>