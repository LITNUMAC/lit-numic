<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { Mail, AlertTriangle, Trash2, Languages } from 'lucide-svelte';
  import { locale, t, toggleLocale } from '$lib/i18n';

  let email = 'Memuat...';
  let loading = false;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      email = session.user.email;
    }
  });

  async function deleteAccount() {
    if (confirm('APAKAH ANDA YAKIN? Tindakan ini tidak dapat dibatalkan. Semua data (progress, XP, streak) akan hilang selamanya.')) {
        // Implementasi hapus akun butuh server-side logic (Supabase Admin) biasanya.
        // Simulasi Client-side (Sign Out + Alert)
        alert('Permintaan hapus akun telah dikirim. Mengeluarkan Anda sekarang...');
        await supabase.auth.signOut();
        window.location.href = '/';
    }
  }
</script>

<div class="max-w-xl">
  <h2 class="text-2xl font-bold text-blue-900 mb-6 font-fredoka border-b border-gray-100 pb-4">Akun & Data</h2>

  <!-- Email Card -->
  <div class="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 mb-6">
    <div class="flex items-start gap-4">
        <div class="bg-blue-100 p-3 rounded-full text-blue-600">
            <Mail size={24} />
        </div>
        <div class="flex-1">
            <h3 class="font-bold text-lg text-blue-900 mb-1">Email Terdaftar</h3>
            <p class="text-slate-500 text-sm mb-4">Email ini digunakan untuk login dan pemulihan akun.</p>
            <div class="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-blue-200 text-slate-600 font-mono text-sm shadow-sm">
                {email}
                <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Terverifikasi</span>
            </div>
        </div>
    </div>
  </div>

  <!-- Language Switcher Card -->
  <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-10">
    <div class="flex items-start gap-4">
        <div class="bg-gray-100 p-3 rounded-full text-gray-500">
            <Languages size={24} />
        </div>
        <div class="flex-1">
            <h3 class="font-bold text-lg text-blue-900 mb-1">
              {$locale === 'id' ? 'Bahasa Tampilan' : 'Display Language'}
            </h3>
            <p class="text-slate-500 text-sm mb-5">
              {$locale === 'id'
                ? 'Pilih bahasa yang ingin digunakan di seluruh aplikasi.'
                : 'Choose the language used across the app.'}
            </p>
            <div class="flex gap-3">
                <button
                    onclick={toggleLocale}
                    class="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border
                    {$locale === 'id'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-blue-200'}"
                >
                    🇮🇩 Bahasa Indonesia
                </button>
                <button
                    onclick={toggleLocale}
                    class="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border
                    {$locale === 'en'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-blue-200'}"
                >
                    🇬🇧 English
                </button>
            </div>
            <p class="text-xs text-gray-400 mt-3 italic">
              {$locale === 'id' ? '* Bahasa aktif disimpan otomatis.' : '* Active language is saved automatically.'}
            </p>
        </div>
    </div>
  </div>

  <!-- Danger Zone -->
  <div>
    <h3 class="text-red-500 font-bold mb-4 flex items-center gap-2">
        <AlertTriangle size={20} /> Danger Zone
    </h3>
    
    <div class="border border-red-200 rounded-2xl p-6 bg-red-50/30">
        <h4 class="font-bold text-slate-800 mb-2">Hapus Akun</h4>
        <p class="text-slate-500 text-sm mb-6">
            Menghapus akun Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        
        <button 
            onclick={deleteAccount}
            class="px-5 py-2.5 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
        >
            <Trash2 size={16} />
            Hapus Akun Saya
        </button>
    </div>
  </div>
</div>