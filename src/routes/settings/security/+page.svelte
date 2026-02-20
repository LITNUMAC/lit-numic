<script>
  import { supabase } from '$lib/supabaseClient';
  import { Lock, BadgeCheck } from 'lucide-svelte';

  let newPassword = '';
  let confirmPassword = '';
  let loading = false;
  let message = '';
  let success = false;

  async function updatePassword() {
    if (newPassword !== confirmPassword) {
        message = 'Password baru dan konfirmasi tidak cocok!';
        success = false;
        return;
    }
    
    if (newPassword.length < 6) {
        message = 'Password minimal 6 karakter!';
        success = false;
        return;
    }

    loading = true;
    message = '';
    
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        message = 'Error: ' + error.message;
        success = false;
    } else {
        message = 'Password berhasil diubah!';
        success = true;
        newPassword = '';
        confirmPassword = '';
    }
    loading = false;
  }
</script>

<div class="max-w-xl">
  <h2 class="text-2xl font-bold text-blue-900 mb-6 font-fredoka border-b border-gray-100 pb-4">Keamanan & Password</h2>

  <form on:submit|preventDefault={updatePassword} class="space-y-6">
    
    <div class="relative">
      <label class="block text-sm font-bold text-slate-600 mb-2">Password Baru</label>
      <div class="relative">
        <input 
          type="password" 
          bind:value={newPassword}
          class="w-full pl-11 pr-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-300"
          placeholder="Minimal 6 karakter"
        />
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={18} />
        </div>
      </div>
    </div>

    <div>
      <label class="block text-sm font-bold text-slate-600 mb-2">Konfirmasi Password Baru</label>
      <div class="relative">
        <input 
          type="password" 
          bind:value={confirmPassword}
          class="w-full pl-11 pr-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-300"
          placeholder="Ketik ulang password baru"
        />
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <BadgeCheck size={18} />
        </div>
      </div>
    </div>

    {#if message}
        <div class="p-4 rounded-xl text-sm font-medium border
            {success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}">
            {message}
        </div>
    {/if}

    <div class="pt-6 border-t border-gray-50 flex justify-end">
      <button 
        type="submit" 
        disabled={loading}
        class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Memproses...' : 'Ubah Password'}
      </button>
    </div>

  </form>
</div>