<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation'; // PENTING: Untuk pindah halaman

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  // Fungsi DAFTAR BARU
  const handleSignUp = async () => {
    // 1. Validasi input
    if (!email || !password) {
        message = '❌ Email dan Password wajib diisi!';
        return;
    }

    loading = true;
    message = '';
    
    // 2. Daftar ke Supabase (Cuma Email & Pass)
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      // Metadata nama dikosongkan dulu, nanti diisi di halaman /setup
    });

    if (error) {
      message = '❌ ' + error.message;
    } else {
      // 3. LOGIKA REDIRECT (PENTING!)
      // Jika berhasil daftar, langsung arahkan ke halaman Setup Profile
      if (data.session) {
        goto('/setup'); 
      } else {
        // Jika butuh verifikasi email dulu
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
    <img src="/logo.svg" alt="LIT-NUMIC" class="h-36 w-auto mx-auto drop-shadow-md" />
    <p class="text-base text-blue-600/70 mt-1 italic" style="font-family: 'Dancing Script', cursive;">Literacy &amp; Numeracy Interactive Comic</p>
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
        disabled={loading} 
        class="w-full py-2 md:py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-base md:text-lg shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Proses...' : 'Buat Akun'}
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