<script>
  import { fade, fly, slide } from 'svelte/transition';
  import { reveal } from '$lib/actions/reveal';
  import { Lock, Shuffle, CheckCircle, Smartphone, Rocket, Menu, X } from 'lucide-svelte';
  import { getContext } from 'svelte';
  
  const { profile, user, loadingProfile } = getContext('appState');

  let isMobileMenuOpen = $state(false);
  let isScrolled = $state(false);

  // Scroll detection for transparent-to-solid navbar
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      isScrolled = window.scrollY > 20;
    });
  }
</script>

<svelte:head>
  <title>LIT-NUMIC - Belajar Literasi & Numerasi</title>
  <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen font-poppins bg-white text-slate-800">

  <!-- Dedicated Landing Navbar -->
  <nav class="fixed top-0 left-0 w-full z-[100] transition-all duration-300 {isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}">
    <div class="max-w-7xl mx-auto px-6 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-bold text-blue-800 font-fredoka">LIT-NUMIC<span class="text-yellow-400">.</span></h1>
      </div>

      <!-- Desktop Nav -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#home" class="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">Home</a>
        <a href="#fitur" class="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">Fitur</a>
        <a href="#cara-kerja" class="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">Cara Kerja</a>
        
        <div class="h-6 w-px bg-gray-200"></div>

        {#if user}
          <a href="/dashboard" class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all text-xs">
            DASHBOARD
          </a>
        {:else}
          <div class="flex items-center gap-4">
            <a href="/login" class="text-sm font-bold text-blue-600 hover:text-blue-700">LOGIN</a>
            <a href="/register" class="px-6 py-2.5 bg-yellow-400 text-blue-900 font-bold rounded-xl shadow-lg shadow-yellow-100 hover:bg-yellow-500 hover:scale-105 active:scale-95 transition-all text-xs">
              DAFTAR
            </a>
          </div>
        {/if}
      </div>

      <!-- Mobile Toggle -->
      <button class="md:hidden p-2 text-gray-600" onclick={() => isMobileMenuOpen = !isMobileMenuOpen}>
        {#if isMobileMenuOpen} <X size={24} /> {:else} <Menu size={24} /> {/if}
      </button>
    </div>

    <!-- Mobile Menu -->
    {#if isMobileMenuOpen}
      <div class="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-xl" transition:slide>
        <a href="#home" onclick={() => isMobileMenuOpen = false} class="text-lg font-bold text-gray-800">Home</a>
        <a href="#fitur" onclick={() => isMobileMenuOpen = false} class="text-lg font-bold text-gray-800">Fitur</a>
        <a href="#cara-kerja" onclick={() => isMobileMenuOpen = false} class="text-lg font-bold text-gray-800">Cara Kerja</a>
        <hr class="border-gray-50">
        {#if user}
          <a href="/dashboard" class="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-center">DASHBOARD</a>
        {:else}
          <a href="/login" class="w-full py-4 text-center font-bold text-blue-600 border border-blue-100 rounded-2xl">LOGIN</a>
          <a href="/register" class="w-full py-4 bg-yellow-400 text-blue-900 font-bold rounded-2xl text-center shadow-lg shadow-yellow-100">DAFTAR</a>
        {/if}
      </div>
    {/if}
  </nav>

  <section id="home" class="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div in:fly={{ y: 30, duration: 1000 }} class="relative z-10 text-center md:text-left md:pl-10">
        <h1 class="text-4xl md:text-6xl font-bold text-blue-900 leading-tight mb-6 font-fredoka">
          Belajar Literasi & <br><span class="text-blue-600">Numerasi</span> Lewat <br> Komik Interaktif
        </h1>
        <p class="text-gray-500 text-lg mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
          Baca cerita kontekstual, pecahkan tantangan numerasi, dan pantau progres belajarmu dengan cara yang seru!
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <a href="/register" class="px-8 py-4 bg-blue-700 text-white font-bold rounded-full shadow-xl shadow-blue-300 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2">
            Mulai Sekarang <Rocket size={20} />
          </a>
          <a href="#cara-kerja" class="px-8 py-4 bg-white text-blue-700 border border-blue-100 font-bold rounded-full hover:bg-blue-50 transition-all text-center">Lihat Cara Kerja</a>
        </div>
      </div>
      <div in:fly={{ x: 30, duration: 1000, delay: 200 }} class="relative flex justify-center items-center">
        <div class="absolute inset-0 bg-blue-400/20 rounded-full blur-[80px] scale-75 animate-pulse"></div>
        <lottie-player 
          src="/buku.json" 
          background="transparent" 
          speed="1" 
          class="relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500 w-full max-w-[400px] aspect-square" 
          loop 
          autoplay
        ></lottie-player>
      </div>
    </div>
  </section>

  <section id="fitur" class="py-24 px-6 bg-blue-50/30">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16" use:reveal={{ delay: 0 }}>
        <h2 class="text-4xl font-bold text-blue-900 font-fredoka mb-4">Fitur Unggulan LIT-NUMIC</h2>
        <p class="text-gray-500 max-w-xl mx-auto">Dirancang untuk pembelajaran literasi dan numerasi yang terstruktur dan menyenangkan.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div use:reveal={{ delay: 0 }} class="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 border border-white flex flex-col items-center text-center group">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <Lock class="w-8 h-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-bold text-blue-700 mb-2">Read First Validation</h3>
          <p class="text-gray-400 text-sm leading-relaxed">Sistem memastikan kamu membaca komik sampai selesai sebelum bisa membuka tantangan.</p>
        </div>

        <div use:reveal={{ delay: 200 }} class="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 border border-white flex flex-col items-center text-center group">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
            <Shuffle class="w-8 h-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-bold text-blue-700 mb-2">Random Question</h3>
          <p class="text-gray-400 text-sm leading-relaxed">Soal tantangan selalu diacak dari bank soal, membuat latihan tidak membosankan.</p>
        </div>

        <div use:reveal={{ delay: 400 }} class="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 border border-white flex flex-col items-center text-center group">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <CheckCircle class="w-8 h-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-bold text-blue-700 mb-2">Auto Grading</h3>
          <p class="text-gray-400 text-sm leading-relaxed">Nilai langsung keluar otomatis dengan deteksi jawaban cerdas untuk soal isian.</p>
        </div>

        <div use:reveal={{ delay: 600 }} class="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 border border-white flex flex-col items-center text-center group">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
            <Smartphone class="w-8 h-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-bold text-blue-700 mb-2">Responsive Reader</h3>
          <p class="text-gray-400 text-sm leading-relaxed">Baca komik dengan nyaman di HP, Tablet, maupun Laptop dengan tampilan yang menyesuaikan.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="cara-kerja" class="py-24 px-6 bg-white overflow-hidden relative">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl font-bold text-blue-900 font-fredoka text-center mb-16" use:reveal>Bagaimana Cara Kerjanya?</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        
        <div use:reveal={{ delay: 200 }} class="hidden md:block line-container">
          <div class="line-fill"></div>
        </div>

        <div use:reveal={{ delay: 0 }} class="relative z-10 flex flex-col items-center text-center group">
          <div class="w-24 h-24 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(37,99,235,0.15)] border-4 border-blue-50 group-hover:border-yellow-400 group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-500">1</div>
          <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl w-full">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Baca Komik</h3>
            <p class="text-gray-400 text-sm">Pilih judul yang menarik dan nikmati alur ceritanya.</p>
          </div>
        </div>

        <div use:reveal={{ delay: 800 }} class="relative z-10 flex flex-col items-center text-center group">
          <div class="w-24 h-24 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(37,99,235,0.15)] border-4 border-blue-50 group-hover:border-yellow-400 group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-500">2</div>
          <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl w-full">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Kerjakan Tantangan</h3>
            <p class="text-gray-400 text-sm">Jawab soal literasi & numerasi yang muncul di akhir cerita.</p>
          </div>
        </div>

        <div use:reveal={{ delay: 1600 }} class="relative z-10 flex flex-col items-center text-center group">
          <div class="w-24 h-24 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(37,99,235,0.15)] border-4 border-blue-50 group-hover:border-yellow-400 group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-500">3</div>
          <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl w-full">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Lihat Skor</h3>
            <p class="text-gray-400 text-sm">Dapatkan nilai instan, pembahasan, dan naikkan levelmu!</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="py-24 px-6 bg-blue-600 relative overflow-hidden text-center text-white">
    <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
    <div class="relative z-10 max-w-3xl mx-auto" use:reveal={{ delay: 100 }}>
      <h2 class="text-5xl font-bold mb-6 font-fredoka">Siap Tantang Dirimu?</h2>
      <p class="text-blue-100 text-lg mb-10">Baca komik seru, jawab tantangan, dan lihat skor terbaikmu sekarang juga.</p>
      <a href="/register" class="inline-block px-10 py-4 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-[0_10px_30px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.6)] hover:scale-105 hover:-translate-y-1 transition-all duration-300 text-xl">
        Mulai Sekarang
      </a>
    </div>
  </section>

  <footer class="bg-slate-50 py-12 px-6 border-t border-gray-200">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6" use:reveal={{ delay: 0 }}>
      <div class="text-2xl font-bold text-blue-700 font-fredoka">LIT-NUMIC</div>
      <div class="flex gap-8 text-gray-500 font-medium">
        <a href="#tentang" class="hover:text-blue-600">Tentang</a>
        <a href="#kebijakan" class="hover:text-blue-600">Kebijakan</a>
        <a href="#kontak" class="hover:text-blue-600">Kontak</a>
      </div>
      <div class="text-gray-400 text-sm">
        &copy; 2026 Litnumac. All rights reserved.
      </div>
    </div>
  </footer>

</div>