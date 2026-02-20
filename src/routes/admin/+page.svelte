<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';
    import { Users, Library, CheckCircle, TrendingUp } from 'lucide-svelte';
    
    // 👇 TAMBAHAN WAJIB: Import Chart.js agar grafiknya bisa dirender
    import Chart from 'chart.js/auto'; 

    let stats = {
        totalUser: 0,
        totalKomik: 0,
        totalKuis: 0,
        rataRataNilai: 0
    };
    let loading = true;
    let canvasElement; // Referensi untuk grafik
    let chartInstance = null; // Untuk menyimpan data grafik agar tidak menumpuk

    onMount(async () => {
        await fetchData();
        renderChart();
    });

    async function fetchData() {
        loading = true;
        
        // 1. Hitung Total Student
        const { count: countUser } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');
        
        // 2. Hitung Total Komik
        const { count: countKomik } = await supabase
            .from('comics')
            .select('*', { count: 'exact', head: true });

        // 3. Hitung Total Kuis yang pernah dikerjakan
        const { data: scores } = await supabase
            .from('quiz_scores')
            .select('score');

        stats.totalUser = countUser || 0;
        stats.totalKomik = countKomik || 0;
        stats.totalKuis = scores?.length || 0;
        
        if (scores && scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b.score, 0);
            stats.rataRataNilai = Math.round(sum / scores.length);
        }

        loading = false;
    }

    function renderChart() {
        if (!canvasElement) return;

        // 👇 TAMBAHAN WAJIB: Hancurkan grafik lama sebelum membuat yang baru (mencegah bug visual)
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(canvasElement, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                datasets: [{
                    label: 'Aktivitas Belajar',
                    data: [12, 19, 15, 25, 22, 30, 45], // Data contoh UI
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
</script>

<div in:fly={{ y: 20, duration: 500 }} class="pb-10 font-poppins">
    <h2 class="text-2xl font-bold text-blue-900 mb-6 font-poppins">Ringkasan Dashboard</h2>

    {#if loading}
        <div class="flex justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-blue-50 opacity-20 group-hover:scale-110 transition-transform"><Users size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Total Siswa</h3>
                <span class="text-5xl font-black text-blue-600 font-fredoka">{stats.totalUser}</span>
            </div>

            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-yellow-50 opacity-20 group-hover:scale-110 transition-transform"><Library size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Total Komik</h3>
                <span class="text-5xl font-black text-yellow-400 font-fredoka">{stats.totalKomik}</span>
            </div>

            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-green-50 opacity-20 group-hover:scale-110 transition-transform"><CheckCircle size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Kuis Selesai</h3>
                <span class="text-5xl font-black text-green-500 font-fredoka">{stats.totalKuis}</span>
            </div>

            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-purple-50 opacity-20 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Rata-rata Nilai</h3>
                <span class="text-5xl font-black text-purple-500 font-fredoka">{stats.rataRataNilai}</span>
            </div>
        </div>
    {/if}

    <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h3 class="text-xl font-bold text-gray-800">Tren Aktivitas Belajar</h3>
                <p class="text-sm text-gray-400">Jumlah pengerjaan kuis dalam 7 hari terakhir</p>
            </div>
            <div class="flex gap-2">
                <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">Minggu Ini</span>
            </div>
        </div>

        <div class="h-[300px] w-full">
            <canvas bind:this={canvasElement}></canvas>
        </div>
        
        <div class="mt-6 pt-6 border-t border-gray-50 flex justify-center">
            <p class="text-xs text-blue-400 italic">Data otomatis diperbarui setiap ada siswa yang menyelesaikan kuis.</p>
        </div>
    </div>
</div>