<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fade, fly, scale } from 'svelte/transition';
    import { Home, BookOpen, Trophy, LogOut, Flame, Crown, EyeOff, UserX } from 'lucide-svelte';

    let loading = $state(true);
    let leaderboardData = $state([]);
    let currentUserId = $state(null);
    let showLogoutModal = $state(false);
    
    // State baru untuk mengecek status saklar dari database
    let isLeaderboardActive = $state(true);

    onMount(async () => {
        // --- 1. CEK STATUS SAKLAR ADMIN ---
        const { data: settings } = await supabase
            .from('app_settings')
            .select('leaderboard_active')
            .eq('id', 1)
            .single();
            
        if (settings) {
            isLeaderboardActive = settings.leaderboard_active;
        }

        // Jika saklar dimatikan, berhenti di sini agar hemat pemuatan database
        if (!isLeaderboardActive) {
            loading = false;
            return;
        }

        // --- 2. JIKA AKTIF: Ambil sesi user ---
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUserId = session.user.id;
        }

        // --- 3. JIKA AKTIF: Ambil data Leaderboard ---
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, streak, class, level')
            .order('streak', { ascending: false })
            .limit(50);

        if (data) {
            leaderboardData = data;
        }
        loading = false;
    });

    const handleLogout = async () => { 
        await supabase.auth.signOut(); 
        window.location.href = '/'; 
    };
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
    <style>
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
    </style>
</svelte:head>

{#if showLogoutModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" transition:fade>
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center" transition:scale={{start: 0.9, duration: 300}}>
            <h2 class="text-xl font-bold text-gray-800 mb-2">Keluar Akun?</h2>
            <p class="text-gray-500 text-sm mb-8">Anda perlu masuk kembali untuk melanjutkan petualangan literasi.</p>
            <div class="flex justify-center gap-4">
                <button on:click={() => showLogoutModal = false} class="px-8 py-3 rounded-xl bg-gray-100 font-bold">Batal</button>
                <button on:click={handleLogout} class="px-8 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50">Keluar</button>
            </div>
        </div>
    </div>
{/if}

<div class="flex h-screen bg-blue-50 font-poppins overflow-hidden text-slate-800">
  
  <aside class="hidden md:flex flex-col w-64 bg-white border-r border-blue-100 p-6 m-4 rounded-[2rem] shadow-xl h-[95vh]">
    <div class="mb-10 px-2">
        <h1 class="text-3xl font-bold text-blue-800 font-fredoka">
            LIT-NUMIC<span class="text-yellow-400">.</span>
        </h1>
    </div>

    <nav class="flex-1 space-y-3">
        <a href="/dashboard" class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-blue-50 rounded-2xl font-medium transition-all"><Home size={20} /> Dashboard</a>
        <a href="/pustaka" class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-blue-50 rounded-2xl font-medium transition-all"><BookOpen size={20} /> Pustaka</a>
        <a href="/leaderboard" class="flex items-center gap-3 px-4 py-3 bg-blue-100 text-blue-700 rounded-2xl font-bold shadow-sm transition-all"><Trophy size={20} /> Leaderboard</a>
    </nav>

    <div class="mt-auto pt-4 border-t border-gray-50">
        <button on:click={() => showLogoutModal = true} class="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-medium hover:bg-red-50 rounded-2xl transition-all">
            <LogOut size={20} /> Keluar Akun
        </button>
    </div>
  </aside>

  <main class="flex-1 overflow-y-auto p-4 md:p-8">
    <header class="mb-10 flex flex-col items-center md:items-start text-center md:text-left">
        <div in:fly={{ y: -20, duration: 500 }}>
            <h2 class="text-3xl font-bold text-blue-900 font-fredoka flex items-center gap-2">Papan Peringkat <Trophy size={32} class="text-yellow-500" /></h2>
            <p class="text-blue-400 font-medium text-sm mt-1">Siapa pahlawan literasi paling konsisten minggu ini?</p>
        </div>
    </header>

    {#if loading}
      <div class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    
    {:else if !isLeaderboardActive}
      <div class="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-blue-50 max-w-2xl mx-auto mt-10" in:scale>
          <div class="mb-4 flex justify-center"><EyeOff size={64} class="text-gray-300" /></div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2 font-fredoka">Leaderboard Sedang Ditutup!</h3>
          <p class="text-gray-500">Papan peringkat saat ini sedang dinonaktifkan oleh Admin. Terus tingkatkan Streak membacamu dan tunggu kejutannya saat papan peringkat dibuka kembali! 🔥</p>
      </div>

    {:else}
      <div class="flex justify-center items-end gap-2 md:gap-6 mb-16 h-64 mt-10" in:scale={{ duration: 600, delay: 100 }}>
          
          {#if leaderboardData[1]}
          <div class="flex flex-col items-center relative z-10 w-24 md:w-32 group">
              <div class="relative mb-2">
                  <img src={leaderboardData[1].avatar_url} alt="Rank 2" class="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-300 shadow-lg object-cover bg-white group-hover:scale-110 transition-transform" />
                  <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-black px-2 py-0.5 rounded-full border-2 border-white">#2</div>
              </div>
              <div class="bg-gradient-to-t from-gray-300 to-gray-200 w-full h-24 md:h-32 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-inner border border-gray-300">
                  <span class="text-xs font-bold text-gray-700 truncate w-full text-center px-2">{leaderboardData[1].full_name.split(' ')[0]}</span>
                  <span class="text-sm font-black text-orange-600 flex items-center gap-1 mt-1"><Flame size={16} /> {leaderboardData[1].streak || 0}</span>
              </div>
          </div>
          {/if}

          {#if leaderboardData[0]}
          <div class="flex flex-col items-center relative z-20 w-28 md:w-40 animate-bounce-slow">
              <div class="absolute -top-10"><Crown size={40} class="text-yellow-500" /></div>
              <div class="relative mb-2">
                  <img src={leaderboardData[0].avatar_url} alt="Rank 1" class="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-yellow-400 shadow-xl object-cover bg-white" />
                  <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-black px-3 py-0.5 rounded-full border-2 border-white">#1</div>
              </div>
              <div class="bg-gradient-to-t from-yellow-400 to-yellow-300 w-full h-32 md:h-44 rounded-t-3xl flex flex-col items-center justify-start pt-4 shadow-inner border border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                  <span class="text-sm font-bold text-yellow-900 truncate w-full text-center px-2">{leaderboardData[0].full_name.split(' ')[0]}</span>
                  <span class="text-lg font-black text-orange-600 flex items-center gap-1 mt-1"><Flame size={20} /> {leaderboardData[0].streak || 0}</span>
              </div>
          </div>
          {/if}

          {#if leaderboardData[2]}
          <div class="flex flex-col items-center relative z-10 w-24 md:w-32 group">
              <div class="relative mb-2">
                  <img src={leaderboardData[2].avatar_url} alt="Rank 3" class="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-300 shadow-lg object-cover bg-white group-hover:scale-110 transition-transform" />
                  <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 text-orange-900 text-xs font-black px-2 py-0.5 rounded-full border-2 border-white">#3</div>
              </div>
              <div class="bg-gradient-to-t from-orange-300 to-orange-200 w-full h-20 md:h-24 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-inner border border-orange-300">
                  <span class="text-xs font-bold text-orange-900 truncate w-full text-center px-2">{leaderboardData[2].full_name.split(' ')[0]}</span>
                  <span class="text-sm font-black text-orange-600 flex items-center gap-1 mt-1"><Flame size={16} /> {leaderboardData[2].streak || 0}</span>
              </div>
          </div>
          {/if}
      </div>

      <div class="bg-white rounded-[2rem] shadow-sm border border-blue-50 overflow-hidden max-w-4xl mx-auto" in:fly={{ y: 30, duration: 600, delay: 300 }}>
          <div class="px-6 py-4 bg-blue-50/50 border-b border-blue-50 flex text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              <div class="w-12 text-center">Rank</div>
              <div class="flex-1 px-4">Profil Siswa</div>
              <div class="w-24 text-right flex items-center justify-end gap-1"><Flame size={14} /> Streak</div>
          </div>
          
          <div class="divide-y divide-gray-50">
              {#each leaderboardData.slice(3) as user, index}
                  <div class="flex items-center px-6 py-4 hover:bg-blue-50/30 transition-colors {currentUserId === user.id ? 'bg-yellow-50/50 relative overflow-hidden' : ''}">
                      
                      {#if currentUserId === user.id}
                          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400"></div>
                      {/if}
                      
                      <div class="w-12 text-center font-black text-gray-300 text-xl">
                          {index + 4}
                      </div>
                      
                      <div class="flex-1 px-4 flex items-center gap-4">
                          <img src={user.avatar_url} alt="avatar" class="w-10 h-10 rounded-full border-2 border-gray-100 bg-white shadow-sm" />
                          <div>
                              <h4 class="font-bold text-gray-800 text-sm flex items-center gap-2">
                                  {user.full_name} 
                                  {#if currentUserId === user.id}
                                      <span class="text-[9px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Kamu</span>
                                  {/if}
                              </h4>
                              <p class="text-[11px] text-gray-400 mt-0.5">@{user.username || 'user'} • {user.class ? `Kelas ${user.class}` : 'Siswa'}</p>
                          </div>
                      </div>
                      
                      <div class="w-24 text-right font-black text-orange-500 text-lg">
                          {user.streak || 0}
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
  </main>
</div>