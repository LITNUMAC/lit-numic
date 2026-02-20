<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly } from 'svelte/transition';

    let loading = true;
    let quizData = [];
    let canvasScore; // Referensi untuk grafik skor
    let canvasComics; // Referensi untuk grafik komik populer

    onMount(async () => {
        await fetchData();
        renderCharts();
    });

    async function fetchData() {
        loading = true;
        // Ambil data skor kuis lengkap dengan nama komik & siswa
        const { data, error } = await supabase
            .from('quiz_scores')
            .select('score, created_at, comics(title), profiles(full_name)');
        
        if (!error) quizData = data;
        loading = false;
    }

    function renderCharts() {
        if (quizData.length === 0) return;

        // --- GRAFIK 1: Rata-rata Nilai Per Komik ---
        const comicStats = {};
        quizData.forEach(item => {
            const title = item.comics?.title || 'Lainnya';
            if (!comicStats[title]) comicStats[title] = { total: 0, count: 0 };
            comicStats[title].total += item.score;
            comicStats[title].count += 1;
        });

        const labels = Object.keys(comicStats);
        const averages = labels.map(l => comicStats[l].total / comicStats[l].count);

        new Chart(canvasScore, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Rata-rata Skor (%)',
                    data: averages,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 10
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        // --- GRAFIK 2: Distribusi Kelulusan (>= 70) ---
        const lulus = quizData.filter(d => d.score >= 70).length;
        const remedial = quizData.length - lulus;

        new Chart(canvasComics, {
            type: 'doughnut',
            data: {
                labels: ['Lulus (>=70)', 'Remedial (<70)'],
                datasets: [{
                    data: [lulus, remedial],
                    backgroundColor: ['#10b981', '#ef4444'],
                    hoverOffset: 4
                }]
            },
            options: { cutout: '70%' }
        });
    }
</script>

<div in:fly={{ y: 20 }} class="pb-10">
    <div class="mb-8">
        <h2 class="text-3xl font-black text-blue-900 font-fredoka uppercase">Analisis Statistik Detail</h2>
        <p class="text-gray-500">Data menyeluruh aktivitas belajar siswa pada platform LIT-NUMIC.</p>
    </div>

    {#if loading}
        <p>Menghitung data...</p>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 class="font-bold text-gray-800 mb-6">Performa Nilai per Komik</h3>
                <canvas bind:this={canvasScore}></canvas>
            </div>
            
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
                <h3 class="font-bold text-gray-800 mb-6 w-full">Tingkat Kelulusan</h3>
                <div class="w-full max-w-[200px]">
                    <canvas bind:this={canvasComics}></canvas>
                </div>
                <div class="mt-8 grid grid-cols-2 gap-4 w-full text-center">
                    <div class="bg-green-50 p-4 rounded-2xl">
                        <span class="block text-2xl font-black text-green-600">{quizData.filter(d => d.score >= 70).length}</span>
                        <span class="text-[10px] font-bold text-green-700 uppercase">Lulus</span>
                    </div>
                    <div class="bg-red-50 p-4 rounded-2xl">
                        <span class="block text-2xl font-black text-red-600">{quizData.filter(d => d.score < 70).length}</span>
                        <span class="text-[10px] font-bold text-red-700 uppercase">Remedial</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-8 border-b border-gray-50 font-bold text-gray-800 text-xl">Log Aktivitas Siswa</div>
            <table class="w-full text-left">
                <thead class="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                        <th class="px-8 py-4">Waktu</th>
                        <th class="px-8 py-4">Nama Siswa</th>
                        <th class="px-8 py-4">Materi Komik</th>
                        <th class="px-8 py-4 text-center">Skor Akhir</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    {#each quizData as item}
                        <tr class="hover:bg-blue-50/50 transition-colors">
                            <td class="px-8 py-4 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                            <td class="px-8 py-4 font-bold text-gray-700">{item.profiles?.full_name || 'Siswa'}</td>
                            <td class="px-8 py-4 text-sm">{item.comics?.title}</td>
                            <td class="px-8 py-4 text-center">
                                <span class="font-black {item.score >= 70 ? 'text-green-600' : 'text-red-600'}">{item.score}</span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>