<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { createRateLimiter, isValidEmail, validatePassword, sanitizeText } from '$lib/sanitize';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let message = $state('');
  let isLocked = $state(false);
  let lockCountdown = $state(0);

  // Rate limiter: 3 attempts per 120 seconds
  const limiter = createRateLimiter(3, 120000);
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

  const handleSignUp = async () => {
    // Input validation
    const cleanEmail = sanitizeText(email, 100).toLowerCase();
    if (!cleanEmail || !password) {
      message = '❌ Email dan Password wajib diisi!';
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      message = '❌ Format email tidak valid.';
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      message = '❌ ' + pwCheck.message;
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

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
    });

    if (error) {
      const remaining = limiter.getRemaining();
      message = `❌ ${error.message} (${remaining} percobaan tersisa)`;
      if (remaining <= 0) startLockout();
    } else {
      if (data.session) {
        goto('/setup');
      } else {
        message = '✅ Akun berhasil dibuat! Cek email untuk verifikasi.';
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
        placeholder="Buat password" 
        class="w-full py-2 px-4 md:py-3 md:px-6 rounded-full border-none shadow-sm focus:ring-2 focus:ring-blue-300 outline-none text-gray-700 bg-white text-sm md:text-base"
      />
    </div>

    <button 
        onclick={handleSignUp} 
        disabled={loading || isLocked} 
        class="w-full py-2 md:py-3 rounded-full font-bold text-base md:text-lg shadow-md transition-all transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100
        {isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-white'}"
    >
      {#if isLocked}
        🔒 Tunggu {lockCountdown} detik...
      {:else if loading}
        Proses...
      {:else}
        Buat Akun
      {/if}
    </button>

    <div class="text-center mt-4">
        <p class="text-gray-600 text-sm">Sudah punya akun?</p>
        <a href="/login" class="text-blue-600 font-bold hover:underline">Login di sini</a>
    </div>

    {#if message}
      <div class="mt-6 p-3 bg-white bg-opacity-80 rounded-lg text-center text-sm shadow-sm {message.includes('✅') ? 'text-green-600' : 'text-red-600'}">
        {message}
      </div>
    {/if}
  </div>
</div>