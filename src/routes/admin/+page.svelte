<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';
    import { Users, Library, CheckCircle, TrendingUp } from 'lucide-svelte';
    
    import Chart from 'chart.js/auto'; 
    // Cache disabled — always fetch fresh data so chart reflects real database state
    import { t, locale } from '$lib/i18n';

    let stats = {
        totalUser: 0,
        totalKomik: 0,
        totalKuis: 0,
        rataRataNilai: 0
    };
    let loading = true;
    let canvasElement; // Referensi untuk grafik
    let chartInstance = null; // Untuk menyimpan data grafik agar tidak menumpuk

    // Chart data — initialized with zeros, populated from Supabase
    // Day labels are reactive to locale
    let chartLabels = $derived($t('chartDays'));
    let chartData = [0, 0, 0, 0, 0, 0, 0];

    onMount(async () => {
        await fetchData();
        renderChart(chartData);
    });

    // Re-render chart when locale changes so day labels update
    $effect(() => {
        const _ = $locale; // subscribe
        if (chartInstance) {
            renderChart(chartData);
        }
    });

    async function fetchData() {
        loading = true;

        // Last 7 days date boundary
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        console.log('Admin: Fetching fresh data from Supabase...');

        const [userRes, komikRes, quizRes, activityRes] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('comics').select('id', { count: 'exact', head: true }),
            supabase.from('quiz_scores').select('score'),
            supabase.from('quiz_scores')
                .select('created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
        ]);

        console.log('Admin quiz_scores raw:', quizRes.data, quizRes.error);
        console.log('Admin activity raw (7d):', activityRes.data, activityRes.error);

        stats.totalUser = userRes.count || 0;
        stats.totalKomik = komikRes.count || 0;
        stats.totalKuis = quizRes.data?.length || 0;
        stats.rataRataNilai = 0;

        if (quizRes.data && quizRes.data.length > 0) {
            const sum = quizRes.data.reduce((a, b) => a + b.score, 0);
            stats.rataRataNilai = Math.round(sum / quizRes.data.length);
        }

        // Build chart data grouped by day-of-week (Mon=0 ... Sun=6)
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        if (activityRes.data && activityRes.data.length > 0) {
            activityRes.data.forEach(row => {
                const d = new Date(row.created_at);
                const monFirstIndex = (d.getDay() + 6) % 7;
                dayCounts[monFirstIndex]++;
            });
        }
        chartData = dayCounts;
        console.log('Chart data final (Mon-Sun):', chartData);

        loading = false;
    }

    function renderChart(data = [0, 0, 0, 0, 0, 0, 0]) {
        if (!canvasElement) return;

        // Hancurkan grafik lama sebelum membuat yang baru
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(canvasElement, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Aktivitas Belajar',
                    data: data, // Real-time data from Supabase
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
    <h2 class="text-2xl font-bold text-blue-900 mb-6 font-poppins">{$t('adminTitle')}</h2>

    {#if loading}
        <div class="flex flex-col items-center justify-center py-20 text-blue-400 font-bold animate-pulse">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            {$t('loading')}
        </div>
    {:else}
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-blue-50 opacity-20 group-hover:scale-110 transition-transform"><Users size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{$t('adminUsers')}</h3>
                <span class="text-5xl font-black text-blue-600 font-fredoka">{stats.totalUser}</span>
            </div>

            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-yellow-50 opacity-20 group-hover:scale-110 transition-transform"><Library size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{$t('adminComics')}</h3>
                <span class="text-5xl font-black text-yellow-400 font-fredoka">{stats.totalKomik}</span>
            </div>

            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-green-50 opacity-20 group-hover:scale-110 transition-transform"><CheckCircle size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{$t('adminQuiz')}</h3>
                <span class="text-5xl font-black text-green-500 font-fredoka">{stats.totalKuis}</span>
            </div>

            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-purple-50 opacity-20 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
                <h3 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{$t('adminAvg')}</h3>
                <span class="text-5xl font-black text-purple-500 font-fredoka">{stats.rataRataNilai}</span>
            </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">{$t('adminChartTitle')}</h3>
                    <p class="text-sm text-gray-400">{$t('adminChartSub')}</p>
                </div>
                <div class="flex gap-2">
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">{$t('adminChartBadge')}</span>
                </div>
            </div>

            <div class="h-[300px] w-full">
                <canvas bind:this={canvasElement}></canvas>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-50 flex justify-center">
                <p class="text-xs text-blue-400 italic">{$t('adminChartNote')}</p>
            </div>
        </div>
    {/if}
</div>
