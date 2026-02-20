<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';

    let { children } = $props();
    let loading = $state(true);

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = '/login';
            return;
        }

        // Proteksi Role: Hanya Admin yang boleh masuk
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data && data.role !== 'admin') {
            alert("Akses Ditolak! Anda bukan Admin.");
            window.location.href = '/dashboard'; 
            return;
        }
        loading = false;
    });
</script>

{#if loading}
    <div class="flex h-[60vh] items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
    </div>
{:else}
    {@render children()}
{/if}