<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';

    let isActive = true;
    let loading = true;
    let isSaving = false;

    onMount(async () => {
        // Ambil status saklar saat ini dari database
        const { data } = await supabase.from('app_settings').select('leaderboard_active').eq('id', 1).single();
        if (data) isActive = data.leaderboard_active;
        loading = false;
    });

    async function toggleLeaderboard() {
        isSaving = true;
        const newState = !isActive;
        
        // Update ke database
        const { error } = await supabase.from('app_settings').update({ leaderboard_active: newState }).eq('id', 1);
        
        if (!error) {
            isActive = newState;
            alert(isActive ? "✅ Leaderboard BERHASIL DIAKTIFKAN!" : "❌ Leaderboard BERHASIL DIMATIKAN!");
        } else {
            alert("Gagal mengubah pengaturan: " + error.message);
        }
        isSaving = false;
    }
</script>

<div class="p-8 font-poppins">
    <h2 class="text-3xl font-bold text-blue-900 mb-8">⚙️ Pengaturan Aplikasi</h2>

    {#if loading}
        <p>Memuat pengaturan...</p>
    {:else}
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <h3 class="text-lg font-bold text-gray-800">Status Leaderboard Siswa</h3>
                <p class="text-sm text-gray-500 mt-1">Jika dimatikan, siswa tidak akan bisa melihat papan peringkat.</p>
            </div>
            
            <button 
                onclick={toggleLeaderboard} 
                disabled={isSaving}
                aria-label="Toggle Leaderboard Status"
                class="relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none {isActive ? 'bg-green-500' : 'bg-gray-300'}"
            >
                <span class="inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 {isActive ? 'translate-x-11' : 'translate-x-1'} shadow-md"></span>
            </button>
        </div>
    {/if}
</div>