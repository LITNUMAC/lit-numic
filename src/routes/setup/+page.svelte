<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { fly, fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  let step = 1; // 1: Name, 2: Username/Class, 3: Gender, 4: Language, 5: Finish
  let loading = false;
  let user = null;

  // Data yang akan diisi
  let formData = {
    fullName: '',
    username: '',
    kelas: '',
    sekolah: '',
    gender: '', // 'male' or 'female'
    language: 'id' // Default Indonesia
  };

  // Cek User saat halaman dimuat
  onMount(async () => {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (!user) goto('/login');
  });

  // Fungsi Pindah Slide & Validasi
  const nextStep = () => {
    if (step === 1 && !formData.fullName) return alert("Nama wajib diisi!");
    if (step === 2 && (!formData.username || !formData.kelas)) return alert("Username & Kelas wajib diisi!");
    if (step === 3 && !formData.gender) return alert("Pilih karakter kamu dulu!");
    step++;
  };

  // Fungsi Simpan Data ke Database
  const finishSetup = async () => {
    loading = true;
    
    // Update tabel profiles
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        username: formData.username,
        school_origin: formData.sekolah,
        class: formData.kelas,
        language: formData.language,
        avatar_url: formData.gender === 'male' 
            ? "https://api.dicebear.com/9.x/pixel-art/svg?seed=Kimberly" 
            : "https://api.dicebear.com/9.x/pixel-art/svg?seed=Christopher",
        level: 1,
        xp: 0
      })
      .eq('id', user.id);

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      goto('/dashboard');
    }
    loading = false;
  };

  const selectLanguage = (lang) => {
    formData.language = lang;
  };

  const selectGender = (gender) => {
    formData.gender = gender;
  };
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center p-6 font-poppins text-white relative overflow-hidden">
  
  <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
  <div class="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400 rounded-full blur-[100px] opacity-20"></div>
  <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20"></div>

  <div class="w-full max-w-lg relative z-10 flex flex-col items-center">
    
    <div class="mb-8">
        <h1 class="text-4xl font-bold font-fredoka tracking-wide text-white drop-shadow-lg">LIT-NUMIC</h1>
    </div>

    <div class="w-full bg-white/20 h-2 rounded-full mb-10 overflow-hidden">
      <div 
        class="h-full bg-yellow-400 transition-all duration-500 ease-out" 
        style="width: {step === 1 ? '20%' : step === 2 ? '40%' : step === 3 ? '60%' : step === 4 ? '80%' : '100%'}"
      ></div>
    </div>

    {#if step === 1}
      <div in:fly={{ x: 50, duration: 500 }} out:fade class="text-center w-full">
        <h2 class="text-3xl font-bold mb-4">Halo! <br> Siapa nama lengkapmu?</h2>
        <p class="text-blue-100 mb-8">Biar kami bisa memanggilmu dengan benar.</p>
        
        <input 
          aria-label="Nama Lengkap"
          bind:value={formData.fullName}
          type="text" 
          placeholder="Ketik namamu di sini..." 
          class="w-full text-center bg-transparent border-b-2 border-white/30 focus:border-yellow-400 text-3xl py-4 outline-none placeholder-white/30 transition-all mb-12 text-white font-bold"
        />

        <button onclick={nextStep} class="px-8 py-4 bg-white text-blue-700 font-bold rounded-full text-lg shadow-lg hover:scale-105 transition-all">
          Lanjut ➔
        </button>
      </div>
    {/if}

    {#if step === 2}
      <div in:fly={{ x: 50, duration: 500 }} out:fade class="text-center w-full">
        <h2 class="text-3xl font-bold mb-4">Sedikit lagi, {formData.fullName.split(' ')[0]}! 🚀</h2>
        <p class="text-blue-100 mb-8">Buat username keren & pilih kelasmu.</p>
        
        <div class="space-y-6 mb-12 text-left">
          <div>
            <label for="username" class="text-sm font-semibold text-blue-200 ml-2">Username</label>
            <input 
              id="username"
              bind:value={formData.username}
              type="text" 
              placeholder="@siswa_smp" 
              class="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 focus:bg-white/20 focus:border-yellow-400 outline-none text-xl transition-all"
            />
          </div>
          <div>
            <label for="kelas" class="text-sm font-semibold text-blue-200 ml-2">Kelas (SMP)</label>
            <select 
              id="kelas"
              bind:value={formData.kelas}
              class="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 focus:bg-white/20 focus:border-yellow-400 outline-none text-xl transition-all text-white cursor-pointer"
            >
              <option value="" class="text-slate-500">Pilih Kelas...</option>
              <option value="7" class="text-slate-800">Kelas 7</option>
              <option value="8" class="text-slate-800">Kelas 8</option>
              <option value="9" class="text-slate-800">Kelas 9</option>
            </select>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button onclick={() => step = 1} class="px-6 py-3 text-white/70 hover:text-white font-medium">
            Kembali
          </button>
          <button onclick={nextStep} class="px-8 py-4 bg-white text-blue-700 font-bold rounded-full text-lg shadow-lg hover:scale-105 transition-all">
            Lanjut ➔
          </button>
        </div>
      </div>
    {/if}

    {#if step === 3}
      <div in:fly={{ x: 50, duration: 500 }} out:fade class="text-center w-full">
        <h2 class="text-3xl font-bold mb-4">Pilih Karaktermu 👤</h2>
        <p class="text-blue-100 mb-8">Kamu ingin tampil sebagai siapa?</p>
        
        <div class="grid grid-cols-2 gap-6 mb-12">
          <button 
            onclick={() => selectGender('male')}
            class="p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group cursor-pointer
              {formData.gender === 'male' 
                ? 'bg-blue-800/40 border-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.5)]' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'}"
          >
            <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Kimberly" alt="Male" class="w-20 h-20 rounded-full bg-white object-cover shadow-md" />
            <div class="text-lg font-bold {formData.gender === 'male' ? 'text-yellow-400' : 'text-white'}">Laki-laki</div>
          </button>

          <button 
            onclick={() => selectGender('female')}
            class="p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group cursor-pointer
              {formData.gender === 'female' 
                ? 'bg-pink-800/40 border-pink-400 scale-105 shadow-[0_0_20px_rgba(244,114,182,0.5)]' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'}"
          >
            <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Christopher" alt="Female" class="w-20 h-20 rounded-full bg-white object-cover shadow-md" />
            <div class="text-lg font-bold {formData.gender === 'female' ? 'text-pink-400' : 'text-white'}">Perempuan</div>
          </button>
        </div>

        <div class="flex justify-center gap-4">
          <button onclick={() => step = 2} class="px-6 py-3 text-white/70 hover:text-white font-medium">
            Kembali
          </button>
          <button onclick={nextStep} class="px-8 py-4 bg-white text-blue-700 font-bold rounded-full text-lg shadow-lg hover:scale-105 transition-all">
            Lanjut ➔
          </button>
        </div>
      </div>
    {/if}

    {#if step === 4}
      <div in:fly={{ x: 50, duration: 500 }} out:fade class="text-center w-full">
        <h2 class="text-3xl font-bold mb-4">Pilih Bahasamu 🌍</h2>
        <p class="text-blue-100 mb-8">Kamu lebih nyaman pakai bahasa apa?</p>
        
        <div class="grid grid-cols-2 gap-6 mb-12">
          <button 
            onclick={() => selectLanguage('id')}
            class="p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group cursor-pointer
              {formData.language === 'id' 
                ? 'bg-blue-800/40 border-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.5)]' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'}"
          >
            <img src="https://flagcdn.com/w160/id.png" alt="Indonesia" class="w-16 h-16 rounded-full object-cover shadow-md" />
            <div class="text-lg font-bold {formData.language === 'id' ? 'text-yellow-400' : 'text-white'}">Indonesia</div>
          </button>

          <button 
            onclick={() => selectLanguage('en')}
            class="p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group cursor-pointer
              {formData.language === 'en' 
                ? 'bg-blue-800/40 border-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.5)]' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'}"
          >
            <img src="https://flagcdn.com/w160/gb.png" alt="English" class="w-16 h-16 rounded-full object-cover shadow-md" />
            <div class="text-lg font-bold {formData.language === 'en' ? 'text-yellow-400' : 'text-white'}">English</div>
          </button>
        </div>

        <div class="flex justify-center gap-4">
          <button onclick={() => step = 3} class="px-6 py-3 text-white/70 hover:text-white font-medium">
            Kembali
          </button>
          <button onclick={nextStep} class="px-8 py-4 bg-white text-blue-700 font-bold rounded-full text-lg shadow-lg hover:scale-105 transition-all">
            Lanjut ➔
          </button>
        </div>
      </div>
    {/if}

    {#if step === 5}
      <div in:fly={{ y: 50, duration: 500 }} class="text-center w-full">
        <div class="text-6xl mb-6 animate-bounce">🎉</div>
        <h2 class="text-4xl font-bold mb-4">Semua Siap!</h2>
        <p class="text-blue-100 mb-8">Akunmu sudah jadi. Ayo mulai belajar.</p>
        
        <div class="bg-white/10 p-6 rounded-2xl mb-10 backdrop-blur-sm border border-white/10 text-left mx-auto max-w-xs shadow-lg">
          <div class="flex justify-between mb-2">
            <span class="text-blue-200">Nama:</span>
            <span class="font-bold">{formData.fullName}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-blue-200">User:</span>
            <span class="font-bold">@{formData.username}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-blue-200">Kelas:</span>
            <span class="font-bold">{formData.kelas}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-blue-200">Karakter:</span>
            <span class="font-bold">{formData.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-blue-200">Bahasa:</span>
            <span class="font-bold flex items-center gap-2">
              {formData.language === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English'}
            </span>
          </div>
        </div>

        <button onclick={finishSetup} disabled={loading} class="w-full py-4 bg-yellow-400 text-blue-900 font-bold rounded-2xl text-xl shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:scale-105 transition-all">
          {loading ? 'Menyiapkan Dashboard...' : 'Masuk Dashboard'}
        </button>
      </div>
    {/if}

  </div>
</div>