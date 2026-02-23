<script>
    import { onMount, getContext } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fade, fly, scale } from 'svelte/transition';
    import { Trophy, Flame, Crown, EyeOff, UserX } from 'lucide-svelte';
    import { getCached, setCached } from '$lib/cache';

    const { profile, user, loadingProfile } = getContext('appState');

    let loading = $state(true);
    let leaderboardData = $state([]);
    let isLeaderboardActive = $state(true);

    onMount(async () => {
        // 1. Cek Cache
        const cached = getCached('leaderboard');
        if (cached) {
            isLeaderboardActive = cached.active;
            leaderboardData = cached.data;
            loading = false;
            return;
        }

        loading = true;

        // 2. Parallel Fetching dengan Specific Columns & Limit
        const [settingsRes, leaderboardRes] = await Promise.all([
            supabase.from('app_settings').select('leaderboard_active').eq('id', 1).single(),
            supabase.from('profiles')
                .select('id, full_name, username, avatar_url, streak, class, level')
                .order('streak', { ascending: false })
                .limit(50)
        ]);

        if (settingsRes.data) {
            isLeaderboardActive = settingsRes.data.leaderboard_active;
        }

        if (leaderboardRes.data) {
            leaderboardData = leaderboardRes.data;
        }

        // 3. Simpan ke Cache
        setCached('leaderboard', { active: isLeaderboardActive, data: leaderboardData });
        
        loading = false;
    });
</script>

<div in:fade>
    <header class="mb-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4">
        <div in:fly={{ y: -20, duration: 500 }}>
            <h2 class="text-3xl font-bold text-blue-900 font-fredoka flex items-center justify-center md:justify-start gap-2">
              Papan Peringkat <Trophy size={32} class="text-yellow-500" />
            </h2>
            <p class="text-blue-400 font-medium text-sm mt-1">Siapa pahlawan literasi paling konsisten minggu ini?</p>
        </div>
    </header>

    {#if loading || loadingProfile}
      <div class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    
    {:else if !isLeaderboardActive}
      <div class="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-blue-50 max-w-2xl mx-auto mt-10" in:scale>
          <div class="mb-4 flex justify-center"><EyeOff size={64} class="text-gray-300" /></div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2 font-fredoka">Leaderboard Sedang Ditutup!</h3>
          <p class="text-gray-500 text-sm">Papan peringkat saat ini sedang dinonaktifkan oleh Admin. Terus tingkatkan Streak membacamu dan tunggu kejutannya saat papan peringkat dibuka kembali! 🔥</p>
      </div>

    {:else}
      <div class="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 md:gap-6 mb-10 md:mb-16 h-auto md:h-64 mt-6 md:mt-10" in:scale={{ duration: 600 }}>
          
          {#if leaderboardData[1]}
          <div class="flex flex-col items-center relative z-10 w-full max-w-[150px] md:w-32 group order-2 md:order-1">
              <div class="relative mb-2">
                  <img src={leaderboardData[1].avatar_url} alt="Rank 2" class="w-20 h-20 rounded-full border-4 border-gray-300 shadow-lg object-cover bg-white group-hover:scale-110 transition-transform" />
                  <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-black px-2 py-0.5 rounded-full border-2 border-white">#2</div>
              </div>
              <div class="bg-gradient-to-t from-gray-300 to-gray-200 w-full h-32 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-inner border border-gray-300">
                  <span class="text-xs font-bold text-gray-700 truncate w-full text-center px-2">{leaderboardData[1].full_name.split(' ')[0]}</span>
                  <span class="text-sm font-black text-orange-600 flex items-center gap-1 mt-1"><Flame size={16} /> {leaderboardData[1].streak || 0}</span>
              </div>
          </div>
          {/if}

          {#if leaderboardData[0]}
          <div class="flex flex-col items-center relative z-20 w-full max-w-[180px] md:w-40 order-1 md:order-2">
              <div class="absolute -top-10"><Crown size={40} class="text-yellow-500" /></div>
              <div class="relative mb-2">
                  <img src={leaderboardData[0].avatar_url} alt="Rank 1" class="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-xl object-cover bg-white" />
                  <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-black px-3 py-0.5 rounded-full border-2 border-white">#1</div>
              </div>
              <div class="bg-gradient-to-t from-yellow-400 to-yellow-300 w-full h-44 rounded-t-3xl flex flex-col items-center justify-start pt-4 shadow-inner border border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                  <span class="text-sm font-bold text-yellow-900 truncate w-full text-center px-2">{leaderboardData[0].full_name.split(' ')[0]}</span>
                  <span class="text-lg font-black text-orange-600 flex items-center gap-1 mt-1"><Flame size={20} /> {leaderboardData[0].streak || 0}</span>
              </div>
          </div>
          {/if}

          {#if leaderboardData[2]}
          <div class="flex flex-col items-center relative z-10 w-full max-w-[150px] md:w-32 group order-3">
              <div class="relative mb-2">
                  <img src={leaderboardData[2].avatar_url} alt="Rank 3" class="w-20 h-20 rounded-full border-4 border-orange-300 shadow-lg object-cover bg-white group-hover:scale-110 transition-transform" />
                  <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 text-orange-900 text-xs font-black px-2 py-0.5 rounded-full border-2 border-white">#3</div>
              </div>
              <div class="bg-gradient-to-t from-orange-300 to-orange-200 w-full h-24 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-inner border border-orange-300">
                  <span class="text-xs font-bold text-orange-900 truncate w-full text-center px-2">{leaderboardData[2].full_name.split(' ')[0]}</span>
                  <span class="text-sm font-black text-orange-600 flex items-center gap-1 mt-1"><Flame size={16} /> {leaderboardData[2].streak || 0}</span>
              </div>
          </div>
          {/if}
      </div>

      <div class="bg-white rounded-[2rem] shadow-sm border border-blue-50 overflow-hidden max-w-4xl mx-auto" in:fly={{ y: 30, duration: 600 }}>
          <div class="px-6 py-4 bg-blue-50/50 border-b border-blue-50 flex text-[10px] font-bold text-blue-400 uppercase tracking-widest overflow-hidden">
              <div class="w-12 text-center shrink-0">Rank</div>
              <div class="flex-1 px-4 min-w-0">Profil Siswa</div>
              <div class="w-24 text-right flex items-center justify-end gap-1 shrink-0"><Flame size={14} /> Streak</div>
          </div>
          
          <div class="divide-y divide-gray-50 overflow-x-auto">
              {#each leaderboardData.slice(3) as userEntry, index}
                  <div class="flex items-center px-3 md:px-6 py-3 md:py-4 hover:bg-blue-50/30 transition-colors {user?.id === userEntry.id ? 'bg-yellow-50/50 relative overflow-hidden' : ''}">
                      
                      {#if user?.id === userEntry.id}
                          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400"></div>
                      {/if}
                      
                      <div class="w-8 md:w-12 text-center font-black text-gray-300 text-lg md:text-xl shrink-0">
                          {index + 4}
                      </div>
                      
                      <div class="flex-1 px-2 md:px-4 flex items-center gap-2 md:gap-4 min-w-0">
                          <img src={userEntry.avatar_url} alt="avatar" class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-100 bg-white shadow-sm shrink-0" />
                          <div class="min-w-0">
                              <h4 class="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1 md:gap-2 truncate">
                                  {userEntry.full_name} 
                                  {#if user?.id === userEntry.id}
                                      <span class="text-[9px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">Kamu</span>
                                  {/if}
                              </h4>
                              <p class="text-[10px] md:text-[11px] text-gray-400 mt-0.5 truncate">@{userEntry.username || 'user'} • {userEntry.class ? `Kelas ${userEntry.class}` : 'Siswa'}</p>
                          </div>
                      </div>
                      
                      <div class="w-16 md:w-24 text-right font-black text-orange-500 text-base md:text-lg shrink-0">
                          {userEntry.streak || 0}
                      </div>
                  </div>
              {/each}

              {#if leaderboardData.length <= 3}
                  <div class="p-10 text-center flex flex-col items-center">
                      <div class="mb-3 grayscale opacity-30"><UserX size={48} /></div>
                      <p class="text-gray-400 font-medium text-sm">Belum ada penantang lain di peringkat ini.</p>
                  </div>
              {/if}
          </div>
      </div>
    {/if}
</div>