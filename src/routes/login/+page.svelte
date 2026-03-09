<script>
  import { supabase } from '$lib/supabaseClient';
  import { createRateLimiter, isValidEmail, sanitizeText } from '$lib/sanitize';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let message = $state('');
  let isLocked = $state(false);
  let lockCountdown = $state(0);

  // Rate limiter: 5 attempts per 60 seconds
  const limiter = createRateLimiter(5, 60000);
  let countdownInterval;

  function startLockout() {
    isLocked = true;
    lockCountdown = limiter.getResetTime();
    countdownInterval = setInterval(() => {
      lockCountdown = limiter.getResetTime();
      if (lockCountdown <= 0) {
        isLocked = false;
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  const handleLogin = async () => {
    // Input validation
    const cleanEmail = sanitizeText(email, 100).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      message = '❌ Format email tidak valid.';
      return;
    }
    if (!password || password.length < 1) {
      message = '❌ Password wajib diisi.';
      return;
    }

    // Rate limit check
    if (!limiter.canAttempt()) {
      startLockout();
      message = `⏳ Terlalu banyak percobaan. Coba lagi dalam ${lockCountdown} detik.`;
      return;
    }

    loading = true;
    message = '';
    limiter.recordAttempt();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) {
      const remaining = limiter.getRemaining();
      message = `❌ Email atau Password salah. (${remaining} percobaan tersisa)`;
      if (remaining <= 0) startLockout();
    } else {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, class')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile || !profile.full_name || !profile.class) {
        window.location.href = '/setup';
      } else {
        window.location.href = '/dashboard';
      }
    }
    loading = false;
  };
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4" style="font-family: 'Poppins', sans-serif;">
  
  <div class="text-center mb-8">
    <div class="flex items-center justify-center gap-1">
      <img src="/logo-icon.svg" alt="LIT-NUMIC" class="h-20 w-auto drop-shadow-md" />
      <span class="text-4xl font-black tracking-tight font-fredoka leading-none">
        <span class="text-blue-800">LIT-</span><span class="text-yellow-400" style="-webkit-text-stroke: 1px #2952CC;">NUMIC</span>
      </span>
    </div>
    <p class="text-sm text-blue-500/80 mt-2 italic" style="font-family: 'Dancing Script', cursive;">Literacy &amp; Numeracy Interactive Comic</p>
  </div>

  <div class="w-full max-w-xs sm:max-w-sm md:max-w-md">
    <div class="mb-4">
      <input 
        type="email" 
        bind:value={email} 
        placeholder="email address" 
        class="w-full py-2 px-4 md:py-3 md:px-6 rounded-full border-none shadow-sm focus:ring-2 focus:ring-blue-300 outline-none text-gray-700 bg-white text-sm md:text-base"
      />
    </div>
    <div class="mb-6">
      <input 
        type="password" 
        bind:value={password} 
        placeholder="password" 
        class="w-full py-2 px-4 md:py-3 md:px-6 rounded-full border-none shadow-sm focus:ring-2 focus:ring-blue-300 outline-none text-gray-700 bg-white text-sm md:text-base"
      />
    </div>

    <button 
        onclick={handleLogin} 
        disabled={loading || isLocked} 
        class="w-full py-2 md:py-3 rounded-full font-bold text-base md:text-lg shadow-md transition-all transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100
        {isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-white'}"
    >
      {#if isLocked}
        🔒 Tunggu {lockCountdown} detik...
      {:else if loading}
        Memuat...
      {:else}
        Login Masuk
      {/if}
    </button>

    <div class="text-center mt-4">
        <p class="text-gray-600 text-sm">Belum punya akun?</p>
        <a href="/register" class="text-blue-600 font-bold hover:underline">Daftar di sini</a>
    </div>

    {#if message}
      <div class="mt-6 p-3 bg-red-100 text-red-800 rounded-lg text-center text-sm shadow-sm border border-red-200">
        {message}
      </div>
    {/if}
  </div>
</div>