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
        alert('Permintaan hapus akun telah dikirim. Mengeluarkan Anda sekarang...');
        await supabase.auth.signOut();
        window.location.href = '/';
    }
  }
</script>

<div class="w-full max-w-xl">
  <h2 class="text-xl md:text-2xl font-bold text-blue-900 mb-5 font-fredoka border-b border-gray-100 pb-4">Akun &amp; Data</h2>

  <!-- Email Card -->
  <div class="bg-blue-50/50 rounded-2xl p-4 md:p-6 border border-blue-100 mb-4">
    <div class="flex items-start gap-3">
      <!-- Icon: hidden on very small screens, inline icon in title -->
      <div class="hidden sm:flex bg-blue-100 p-3 rounded-full text-blue-600 shrink-0 mt-0.5">
        <Mail size={20} />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-base md:text-lg text-blue-900 mb-1 flex items-center gap-1.5">
          <span class="sm:hidden text-blue-500"><Mail size={16} /></span>
          Email Terdaftar
        </h3>
        <p class="text-slate-500 text-xs md:text-sm mb-3">Email ini digunakan untuk login dan pemulihan akun.</p>
        <!-- Email box: truncate long text, "Terverifikasi" wraps below if too narrow -->
        <div class="flex flex-wrap items-center gap-2 bg-white px-3 md:px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm">
          <span class="text-slate-600 font-mono text-xs md:text-sm break-all">{email}</span>
          <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wide shrink-0">✓ Aktif</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Language Switcher Card -->
  <div class="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 mb-6">
    <div class="flex items-start gap-3">
      <div class="hidden sm:flex bg-gray-100 p-3 rounded-full text-gray-500 shrink-0 mt-0.5">
        <Languages size={20} />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-base md:text-lg text-blue-900 mb-1 flex items-center gap-1.5">
          <span class="sm:hidden text-gray-500"><Languages size={16} /></span>
          {$locale === 'id' ? 'Bahasa Tampilan' : 'Display Language'}
        </h3>
        <p class="text-slate-500 text-xs md:text-sm mb-4">
          {$locale === 'id'
            ? 'Pilih bahasa yang digunakan di seluruh aplikasi.'
            : 'Choose the language used across the app.'}
        </p>
        <!-- Buttons: full-width stacked on mobile, side-by-side on sm+ -->
        <div class="flex flex-col sm:flex-row gap-2">
          <button
            onclick={toggleLocale}
            class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border
            {$locale === 'id'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}"
          >
            🇮🇩 Bahasa Indonesia
          </button>
          <button
            onclick={toggleLocale}
            class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border
            {$locale === 'en'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}"
          >
            🇬🇧 English
          </button>
        </div>
        <p class="text-[11px] text-gray-400 mt-2.5 italic">
          {$locale === 'id' ? '* Bahasa aktif disimpan otomatis.' : '* Active language is saved automatically.'}
        </p>
      </div>
    </div>
  </div>

  <!-- Danger Zone -->
  <div>
    <h3 class="text-red-500 font-bold mb-3 flex items-center gap-1.5 text-sm md:text-base">
      <AlertTriangle size={17} /> Danger Zone
    </h3>
    <div class="border border-red-200 rounded-2xl p-4 md:p-6 bg-red-50/30">
      <h4 class="font-bold text-slate-800 mb-1 text-sm md:text-base">Hapus Akun</h4>
      <p class="text-slate-500 text-xs md:text-sm mb-4">
        Menghapus akun Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
      </p>
      <button
        onclick={deleteAccount}
        class="px-4 py-2.5 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2 text-sm"
      >
        <Trash2 size={15} />
        Hapus Akun Saya
      </button>
    </div>
  </div>
</div>