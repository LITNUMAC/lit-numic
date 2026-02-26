<script>
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  const handleLogin = async () => {
    loading = true;
    message = '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      message = '❌ Email atau Password salah.';
    } else {
        window.location.href = '/dashboard'; 
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
        disabled={loading} 
        class="w-full py-2 md:py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-base md:text-lg shadow-md transition-all transform hover:scale-105"
    >
      {loading ? 'Memuat...' : 'Login Masuk'}
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