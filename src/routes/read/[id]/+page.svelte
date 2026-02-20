<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabaseClient';
  import { ArrowLeft, Target, Lock, Zap, CheckCircle } from 'lucide-svelte';

  let comicId = $page.params.id;
  let user = null;
  let comic = null;
  let pdfDoc = null;
  let pages = [];
  let loading = true;
  let pdfjs;

  // State untuk Progress & Unlock
  let scrollPercent = 0;
  let currentPage = 1; // Halaman saat ini
  let isUnlocked = false;
  let mainContainer;
  let saveTimeout; // Untuk timer penyimpanan (Debounce)

  async function initReader() {
    try {
      // 1. Ambil User dulu
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Kalau ga login, ga bisa simpan progress
      user = session.user;

      const pdfjsDist = await import('pdfjs-dist');
      pdfjs = pdfjsDist;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .eq('id', comicId)
        .single();

      if (!error && data) {
        comic = data;
        loadPDF(comic.file_url);
        
        // Cek progress lama (Resume reading)
        fetchPreviousProgress();
      }
    } catch (err) {
      console.error(err);
      loading = false;
    }
  }

  // Ambil progress terakhir biar bisa resume (Opsional, tapi bagus buat UX)
  async function fetchPreviousProgress() {
      const { data } = await supabase
        .from('student_progress')
        .select('last_read_page, is_completed')
        .eq('user_id', user.id)
        .eq('comic_id', comicId)
        .single();
      
      if (data && data.is_completed) isUnlocked = true;
  }

  async function loadPDF(url) {
    try {
      const loadingTask = pdfjs.getDocument(url);
      pdfDoc = await loadingTask.promise;
      pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

      // --- PERBAIKAN OTOMATIS JUMLAH HALAMAN (SELF-HEALING) ---
      // Jika database mencatat halaman salah (misal 3), tapi asli PDF ada 6,
      // kita update database secara otomatis di sini.
      if (comic && comic.total_pages !== pdfDoc.numPages) {
          console.log(`Memperbaiki Data Halaman: DB(${comic.total_pages}) -> Asli(${pdfDoc.numPages})`);
          
          // Update ke Database Supabase
          const { error } = await supabase
              .from('comics')
              .update({ total_pages: pdfDoc.numPages })
              .eq('id', comic.id);
          
          // Update state lokal biar UI langsung bener
          if (!error) {
              comic.total_pages = pdfDoc.numPages;
          }
      }
      // --------------------------------------------------------

    } catch (err) {
      console.error("Gagal load PDF:", err);
    }
    loading = false;
  }

  async function renderPage(canvas, num) {
    if (!pdfDoc || !canvas) return;
    const page = await pdfDoc.getPage(num);
    const windowWidth = window.innerWidth > 800 ? 800 : window.innerWidth * 0.95;
    const initialViewport = page.getViewport({ scale: 1 });
    const scale = windowWidth / initialViewport.width;
    const viewport = page.getViewport({ scale: scale });

    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
  }

  // --- LOGIKA PENYIMPANAN DATA (PENTING) ---

  // Fungsi simpan ke Supabase
  async function saveProgressToDB() {
    if (!user || !comic) return;

    // Pastikan halaman tidak melebihi total halaman (Safety check)
    const safePage = Math.min(currentPage, pages.length || 1);

    const { error } = await supabase
        .from('student_progress')
        .upsert({
            user_id: user.id,
            comic_id: comic.id,
            last_read_page: safePage, 
            is_completed: isUnlocked,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, comic_id' });
    
    if (error) console.error("Gagal simpan progress:", error);
  }

  // Debounce: Tunggu user berhenti scroll 1 detik, baru simpan.
  function triggerSave() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
          saveProgressToDB();
      }, 1000); 
  }

  // LOGIKA SCROLL PROGRESS
  function handleScroll() {
    if (!mainContainer) return;
    
    const scrollTop = mainContainer.scrollTop;
    const scrollHeight = mainContainer.scrollHeight - mainContainer.clientHeight;
    
    if (scrollHeight > 0) {
      // 1. Hitung Persentase
      scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
      
      // 2. Hitung Estimasi Halaman (untuk Dashboard)
      if (pages.length > 0) {
          currentPage = Math.max(1, Math.ceil((scrollPercent / 100) * pages.length));
      }

      // 3. Unlock Logic
      if (scrollPercent >= 98) {
        if (!isUnlocked) {
            isUnlocked = true;
            saveProgressToDB(); // Langsung simpan kalau selesai
        }
      } else {
          // 4. Trigger Simpan Otomatis (Debounce)
          triggerSave();
      }
    }
  }

  onMount(() => { 
    initReader(); 
  });

  // Simpan terakhir kali saat user keluar halaman
  onDestroy(() => {
      saveProgressToDB();
  });

</script>

<div class="h-screen w-screen bg-[#F0F4F8] flex flex-col font-poppins overflow-hidden relative">
  
  <header class="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 px-6 py-4 flex flex-col gap-2">
    <div class="flex justify-between items-center">
        <button onclick={() => { saveProgressToDB(); window.history.back(); }} class="group flex items-center gap-2 text-blue-900 font-bold">
            <span class="bg-blue-100 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><ArrowLeft size={20} /></span>
            <span class="text-sm hidden sm:block">Kembali</span>
        </button>
        
        <div class="text-center">
            <h1 class="text-md font-bold text-blue-900 leading-none" style="font-family: 'Fredoka', sans-serif;">{comic?.title || 'Memuat...'}</h1>
            <p class="text-[9px] text-blue-400 font-black mt-1 uppercase tracking-widest">
                HALAMAN {currentPage} / {pages.length || '?'} • {scrollPercent}%
            </p>
        </div>

            <div class="flex items-center gap-2">
            {#if isUnlocked}
                <span class="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black animate-bounce flex items-center gap-1">READY! <Target size={12} /></span>
            {:else}
                <span class="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">LOCKED <Lock size={12} /></span>
            {/if}
            </div>
    </div>

    <div class="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden">
        <div 
            class="h-full bg-yellow-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
            style="width: {scrollPercent}%"
        ></div>
    </div>
  </header>

  <main 
    bind:this={mainContainer}
    onscroll={handleScroll}
    class="flex-1 flex flex-col items-center gap-6 pt-32 pb-12 px-4 overflow-y-auto scroll-smooth"
  >
    {#if loading}
        <div class="mt-20 flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-[10px] font-black tracking-widest uppercase text-blue-900">Membuka Cerita...</p>
        </div>
    {/if}
    
    {#each pages as pageNum}
        <div class="relative group">
            <canvas 
                use:renderPage={pageNum}
                class="bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)] rounded-xl max-w-full border border-white/50"
            ></canvas>
        </div>
    {/each}

    {#if !loading && pages.length > 0}
        <div class="py-16 flex flex-col items-center gap-6 w-full max-w-lg">
            <div class="w-full h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
            
            <div class="text-center">
                <p class="text-sm font-bold {isUnlocked ? 'text-blue-600' : 'text-gray-400'} mb-2">
                    {isUnlocked ? 'Selamat! Kamu sudah menyelesaikan bacaan.' : 'Selesaikan bacaan untuk membuka tantangan!'}
                </p>
                
                {#if isUnlocked}
                    <button 
                        onclick={() => { saveProgressToDB(); window.location.href = `/quiz/${comicId}`; }}
                        class="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <span>AMBIL TANTANGAN</span>
                        <Zap size={24} />
                    </button>
                {:else}
                    <div class="bg-gray-100 text-gray-400 px-10 py-4 rounded-3xl font-black text-lg flex items-center gap-3 cursor-not-allowed border-2 border-dashed border-gray-200">
                        <span>LOCKED</span>
                        <Lock size={20} />
                    </div>
                {/if}
            </div>
        </div>
    {/if}
  </main>
</div>

<style>
    main::-webkit-scrollbar { width: 5px; }
    main::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>