<script>
  import "../app.css";
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabaseClient';
  import { fade, fly, scale } from 'svelte/transition';
  import { 
    Home, BookOpen, Trophy, Settings, LogOut, 
    Menu, X, LayoutDashboard, FileQuestion, Users, Globe, Rocket 
  } from 'lucide-svelte';
  import { setContext } from 'svelte';
  import favicon from '$lib/assets/favicon.svg';
  import { locale, t, toggleLocale } from '$lib/i18n';

  let { children } = $props();
  
  // State Global
  let isSidebarOpen = $state(false);
  let loadingProfile = $state(true);
  let profile = $state(null);
  let user = $state(null);
  let showLogoutModal = $state(false);

  // Provide state to children
  setContext('appState', {
    get profile() { return profile },
    get user() { return user },
    get loadingProfile() { return loadingProfile }
  });

  // Route Detection: Special handling for certain views
  const isReaderOrQuiz = $derived($page.url.pathname.startsWith('/read/') || $page.url.pathname.startsWith('/quiz/'));
  // Determine if we should show the full app shell (Sidebar/Header)
  // Dashboard, Admin, Settings, and Leaderboard always get the shell.
  // Landing, Login, Register, Setup get a "Partial Shell" (just the min-width container + global nav)
  const isAppRoute = $derived(
    $page.url.pathname.startsWith('/admin') || 
    $page.url.pathname.startsWith('/dashboard') || 
    $page.url.pathname.startsWith('/leaderboard') || 
    $page.url.pathname.startsWith('/settings')
  );

  // Auth & Profile Fetching
  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      user = session.user;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        // Cache bust avatar
        let freshAvatarUrl = data.avatar_url;
        if (freshAvatarUrl) {
          const separator = freshAvatarUrl.includes('?') ? '&' : '?';
          freshAvatarUrl = `${freshAvatarUrl}${separator}t=${new Date().getTime()}`;
        }
        profile = { ...data, avatar_url: freshAvatarUrl };
      }
    }
    loadingProfile = false;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        user = session?.user || null;
        if (!session) profile = null;
    });

    return () => subscription.unsubscribe();
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isActive = (path) => $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</svelte:head>

<!-- Global App Container (Responsive) -->
<div class="w-full min-h-screen bg-[#F8FAFC] overflow-x-hidden">
  <div class="w-full min-h-screen flex text-slate-800 relative font-poppins">
    
    <!-- Mobile/Global Sidebar Overlay -->
    {#if isSidebarOpen}
      <div 
          class="fixed inset-0 bg-black/40 z-[60] lg:hidden backdrop-blur-sm" 
          transition:fade 
          onclick={() => isSidebarOpen = false}
          onkeydown={(e) => e.key === 'Escape' && (isSidebarOpen = false)}
          role="button"
          tabindex="0"
          aria-label="Close Sidebar"
      ></div>
    {/if}

    <!-- Sidebar (Shared Global) -->
    {#if isAppRoute && !isReaderOrQuiz}
      <aside class="fixed inset-y-0 left-0 bg-white z-[70] w-72 border-r border-gray-100 p-6 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 
        {isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:m-4 lg:rounded-[2.5rem] lg:h-[calc(100vh-2rem)] lg:shadow-xl lg:shadow-blue-900/5">
        
        <div class="mb-10 px-4 flex justify-between items-center">
            <h1 class="text-3xl font-bold text-blue-800 font-fredoka tracking-tighter">
                LIT-NUMIC<span class="text-yellow-400">.</span>
            </h1>
            <button class="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" onclick={() => isSidebarOpen = false}>
                <X size={24} />
            </button>
        </div>

        <nav class="flex-1 space-y-2 px-2">
            {#if profile?.role === 'admin'}
              <p class="text-[10px] font-black text-gray-400 mb-4 px-4 uppercase tracking-[0.2em] mt-6">{$t('menuAdmin')}</p>
              <a href="/admin" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/admin') && $page.url.pathname === '/admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <LayoutDashboard size={20} /> {$t('navDashboard')}
              </a>
              <a href="/admin/komik" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/admin/komik') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <BookOpen size={20} /> {$t('navAdminKomik')}
              </a>
              <a href="/admin/soal" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/admin/soal') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <FileQuestion size={20} /> {$t('navAdminSoal')}
              </a>
              <a href="/admin/user" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/admin/user') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <Users size={20} /> {$t('navAdminUser')}
              </a>
            {:else if profile}
              <p class="text-[10px] font-black text-gray-400 mb-4 px-4 uppercase tracking-[0.2em]">{$t('menuSiswa')}</p>
              <a href="/dashboard" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/dashboard') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <Home size={20} /> {$t('navDashboard')}
              </a>
              <a href="/leaderboard" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/leaderboard') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <Trophy size={20} /> {$t('navLeaderboard')}
              </a>
            {:else}
              <p class="text-[10px] font-black text-gray-400 mb-4 px-4 uppercase tracking-[0.2em]">{$t('menuNav')}</p>
              <a href="/" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {$page.url.pathname === '/' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <Home size={20} /> {$t('navHome')}
              </a>
              <a href="/login" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/login') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <Globe size={20} /> {$t('navLogin')}
              </a>
              <a href="/register" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all {isActive('/register') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}">
                <Rocket size={20} /> {$t('navRegister')}
              </a>
            {/if}
        </nav>

        <div class="mt-auto pt-6 border-t border-gray-50 px-2 space-y-1">
            {#if profile}
              <a href="/settings/profile" class="flex items-center gap-3 px-5 py-3.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">
                  <Settings size={20} /> {$t('navSettings')}
              </a>
              <button onclick={() => showLogoutModal = true} class="w-full flex items-center gap-3 px-5 py-3.5 text-red-400 hover:bg-red-50 rounded-2xl transition-all font-medium">
                  <LogOut size={20} /> {$t('navLogout')}
              </button>
            {/if}
        </div>
      </aside>
    {/if}

    <!-- Content Area (Always min-w-1024) -->
    <div class="flex-1 flex flex-col min-w-0 h-full relative">
      
      <!-- Global Header -->
      {#if isAppRoute && !isReaderOrQuiz}
        <header class="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center shrink-0 z-[50] sticky top-0 px-4 md:px-8">
            <div class="max-w-7xl mx-auto w-full flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <!-- Global Hamburger Button -->
                    <button 
                        class="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all"
                        onclick={() => isSidebarOpen = true}
                        aria-label="Open Menu"
                    >
                        <Menu size={24} />
                    </button>
                    <div class="hidden lg:block">
                      <h2 class="font-bold text-gray-800 uppercase tracking-widest text-xs px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                          {profile ? (profile.role === 'admin' ? 'Admin Panel' : 'Student Dashboard') : 'LIT-NUMIC Platform'}
                      </h2>
                    </div>
                    <div class="lg:hidden">
                      <h1 class="text-xl font-bold text-blue-800 font-fredoka">LIT-NUMIC.</h1>
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    {#if profile?.role === 'admin'}
                      <a href="/dashboard" class="hidden md:flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                          {$t('navAdminPreview')} <Globe size={14} />
                      </a>
                    {/if}

                    <!-- Language Toggle Button -->
                    <button
                        onclick={toggleLocale}
                        class="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all border border-gray-100"
                        title="Switch Language"
                    >
                        {$t('langToggle')}
                    </button>

                    {#if user}
                      <div class="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-2 md:px-4 py-1.5 rounded-2xl border border-gray-100 transition-all cursor-pointer">
                          <div class="text-right hidden sm:block">
                              <p class="text-xs font-bold text-gray-900 leading-none">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                              <p class="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-wider">
                                {profile?.role === 'admin' ? 'Super Admin' : (profile?.class ? `Kelas ${profile.class}` : 'Siswa')}
                              </p>
                          </div>
                          <div class="w-10 h-10 bg-white rounded-xl border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                              <img 
                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'user'}`} 
                                alt="avatar" 
                                class="w-full h-full object-cover"
                              />
                          </div>
                      </div>
                    {:else}
                      <a href="/login" class="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-xs">
                        LOGIN
                      </a>
                    {/if}
                </div>
            </div>
        </header>
      {/if}

      <!-- Main Scrollable Content -->
      <main class="flex-1 overflow-y-auto w-full relative px-4 md:px-10 py-6 md:py-8">
          <div class="w-full h-full">
              {@render children()}
          </div>
      </main>
    </div>
  </div>
</div>

<!-- Unified Logout Modal -->
{#if showLogoutModal}
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" transition:fade>
        <div class="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center relative" transition:scale={{start: 0.9, duration: 300}}>
            <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <LogOut size={40} />
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2 font-fredoka">{$t('logoutTitle')}</h2>
            <p class="text-gray-500 text-sm mb-10">{$t('logoutDesc')}</p>
            <div class="flex justify-center gap-4">
                <button onclick={() => showLogoutModal = false} class="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all">{$t('logoutCancel')}</button>
                <button onclick={handleLogout} class="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-200 transition-all">{$t('logoutConfirm')}</button>
            </div>
        </div>
    </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  .font-fredoka { font-family: 'Fredoka', sans-serif; }
  .font-poppins { font-family: 'Poppins', sans-serif; }
  
  /* Prevent scroll jumping when layout is fixed */
  :global(html) {
      scrollbar-gutter: stable;
  }
</style>
