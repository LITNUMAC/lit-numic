<script>
    import { page } from '$app/stores';
    import { 
        AlertTriangle, 
        Home, 
        RefreshCw 
    } from 'lucide-svelte';

    // Mendapatkan status dan message error dari system router SvelteKit
    const statusCode = $derived($page.status);
    const errorMessage = $derived($page.error?.message || "Sebuah masalah tak terduga terjadi.");

    function reloadPage() {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }
</script>

<svelte:head>
    <title>Ups! Ada Masalah | LIT-NUMIC</title>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-poppins text-slate-800 text-center">
    
    <div class="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 max-w-lg w-full flex flex-col items-center relative overflow-hidden">
        
        <!-- Ornamen dekoratif -->
        <div class="absolute -top-12 -right-12 w-32 h-32 bg-red-100 rounded-full blur-2xl"></div>
        <div class="absolute -bottom-12 -left-12 w-32 h-32 bg-yellow-100 rounded-full blur-2xl"></div>

        <div class="relative z-10 flex flex-col items-center">
            
            <!-- Ikon Error -->
            <div class="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100 animate-bounce">
                <AlertTriangle size={48} strokeWidth={2.5} />
            </div>

            <h1 class="text-4xl md:text-5xl font-black text-red-600 font-fredoka mb-2">
                ERROR {statusCode}
            </h1>
            
            <h2 class="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                Yah, sepertinya kita tersesat!
            </h2>
            
            <p class="text-sm md:text-base text-slate-500 mb-8 max-w-sm">
                "{errorMessage}"<br><br>
                Kami tidak bisa menemukan halaman yang kamu cari atau terjadi gangguan pada sistem. Jangan panik, mari kita perbaiki!
            </p>

            <div class="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <a 
                    href="/dashboard" 
                    class="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                    <Home size={20} />
                    Dashboard
                </a>
                
                <button 
                    onclick={reloadPage}
                    class="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <RefreshCw size={20} />
                    Muat Ulang
                </button>
            </div>
            
        </div>
    </div>
    
    <div class="mt-8 text-slate-400 text-xs font-semibold tracking-wider">
        PLATFORM LIT-NUMIC &copy; {new Date().getFullYear()}
    </div>
</div>
