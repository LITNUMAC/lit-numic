<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { locale, t, toggleLocale } from '$lib/i18n';
    import { invalidateAll } from '$app/navigation';
    import { User, Settings, Shield, LayoutDashboard, Camera, Save, Image as ImageIcon, Trash2, Lock, BadgeCheck, Mail, AlertTriangle, Languages } from 'lucide-svelte';

    // --- Tab state ---
    let activeTab = 'profil'; // 'profil' | 'akun' | 'keamanan' | 'admin'

    // --- Profile state ---
    let loadingProfile = false;
    let user = null;
    let avatarUrl = '';
    let files = null;
    let cameraInput, galleryInput;
    let profile = { full_name: '', username: '', school_origin: '', class: '', avatar_url: '' };

    const MAX_SIZE_KB = 50, MAX_WIDTH = 150, MAX_HEIGHT = 150;

    // --- Security state ---
    let newPassword = '', confirmPassword = '', pwLoading = false, pwMessage = '', pwSuccess = false;

    // --- Account state ---
    let email = 'Memuat...';

    // --- Admin / Leaderboard state ---
    let isLeaderboardActive = true;
    let leaderboardLoading = true;
    let leaderboardSaving = false;

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            user = session.user;
            email = session.user.email;
            fetchProfile();
        }
        // Load leaderboard setting
        const { data } = await supabase.from('app_settings').select('leaderboard_active').eq('id', 1).single();
        if (data) isLeaderboardActive = data.leaderboard_active;
        leaderboardLoading = false;
    });

    // === PROFILE ===
    async function fetchProfile() {
        loadingProfile = true;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            profile = { full_name: data.full_name || '', username: data.username || '', school_origin: data.school_origin || '', class: data.class || '', avatar_url: data.avatar_url };
            avatarUrl = data.avatar_url || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.email}`;
        }
        loadingProfile = false;
    }

    async function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; } }
                    else { if (h > MAX_HEIGHT) { w *= MAX_HEIGHT / h; h = MAX_HEIGHT; } }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        if (!blob) { reject(new Error('Compression failed')); return; }
                        if (blob.size > MAX_SIZE_KB * 1024) { reject(new Error(`File terlalu besar (${(blob.size/1024).toFixed(0)}KB > ${MAX_SIZE_KB}KB)`)); return; }
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.6);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error('File > 5MB.');
            loadingProfile = true;
            const compressed = await compressImage(file);
            avatarUrl = URL.createObjectURL(compressed);
            files = compressed;
        } catch (err) { alert(err.message); e.target.value = ''; }
        finally { loadingProfile = false; }
    };

    const deleteAvatar = async () => {
        if (!confirm('Hapus foto profil?')) return;
        loadingProfile = true;
        try {
            await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
            await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
            profile.avatar_url = null;
            avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.email}`;
            files = null;
            invalidateAll();
        } catch (err) { alert('Gagal: ' + err.message); }
        finally { loadingProfile = false; }
    };

    async function updateProfile() {
        loadingProfile = true;
        try {
            if (files) {
                const fileName = `${user.id}/avatar.jpg`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, files, { contentType: 'image/jpeg', upsert: true });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`/${fileName}`);
                profile.avatar_url = publicUrl;
            }
            const { data, error } = await supabase.from('profiles').update({ full_name: profile.full_name, username: profile.username, school_origin: profile.school_origin, class: profile.class, avatar_url: profile.avatar_url }).eq('id', user.id).select();
            if (error) throw error;
            alert('Profil berhasil diupdate! 🎉');
            files = null;
            invalidateAll();
        } catch (err) { alert('Gagal: ' + err.message); }
        finally { loadingProfile = false; }
    }

    // === SECURITY ===
    async function updatePassword() {
        if (newPassword !== confirmPassword) { pwMessage = 'Password tidak cocok!'; pwSuccess = false; return; }
        if (newPassword.length < 6) { pwMessage = 'Password minimal 6 karakter!'; pwSuccess = false; return; }
        pwLoading = true; pwMessage = '';
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { pwMessage = 'Error: ' + error.message; pwSuccess = false; }
        else { pwMessage = 'Password berhasil diubah! ✅'; pwSuccess = true; newPassword = ''; confirmPassword = ''; }
        pwLoading = false;
    }

    // === ADMIN ===
    async function toggleLeaderboard() {
        leaderboardSaving = true;
        const newState = !isLeaderboardActive;
        const { error } = await supabase.from('app_settings').update({ leaderboard_active: newState }).eq('id', 1);
        if (!error) {
            isLeaderboardActive = newState;
            alert(isLeaderboardActive ? '✅ Leaderboard DIAKTIFKAN!' : '❌ Leaderboard DIMATIKAN!');
        } else { alert('Gagal: ' + error.message); }
        leaderboardSaving = false;
    }
</script>

<div class="p-4 md:p-8 font-poppins max-w-5xl mx-auto">
    <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-blue-900 font-fredoka">⚙️ Pengaturan</h2>
        <p class="text-sm text-gray-400 mt-1">Kelola profil, akun, keamanan, dan konfigurasi aplikasi.</p>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {#each [
            { key: 'profil', label: 'Profil', icon: User },
            { key: 'akun', label: 'Akun', icon: Settings },
            { key: 'keamanan', label: 'Keamanan', icon: Shield },
            { key: 'admin', label: 'Admin', icon: LayoutDashboard },
        ] as tab}
            {@const Icon = tab.icon}
            <button
                onclick={() => activeTab = tab.key}
                class="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all
                {activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-blue-50 hover:text-blue-600'}"
            >
                <Icon size={16} />
                {tab.label}
            </button>
        {/each}
    </div>

    <!-- Tab Content -->
    <div class="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 min-h-[400px]">

        <!-- === TAB: PROFIL === -->
        {#if activeTab === 'profil'}
            <h3 class="text-xl font-bold text-blue-900 mb-6 font-fredoka border-b border-gray-100 pb-4">Profil Saya</h3>

            <!-- Avatar -->
            <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div class="relative group">
                    <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-50 shadow-md">
                        <img src={avatarUrl} alt="Avatar" class="w-full h-full object-cover" />
                    </div>
                    <div class="absolute -bottom-2 -right-2 flex gap-2">
                        {#if avatarUrl && !avatarUrl.includes('dicebear')}
                            <button type="button" onclick={deleteAvatar} class="bg-red-50 p-2 rounded-full text-red-500 shadow-md hover:scale-110 transition-all border border-red-100" title="Hapus Foto">
                                <Trash2 size={16} />
                            </button>
                        {/if}
                        <button type="button" onclick={() => galleryInput.click()} class="bg-white p-2 rounded-full text-blue-900 shadow-md hover:scale-110 transition-all border border-blue-100" title="Galeri">
                            <ImageIcon size={16} />
                        </button>
                        <button type="button" onclick={() => cameraInput.click()} class="bg-yellow-400 p-2 rounded-full text-blue-900 shadow-lg hover:scale-110 transition-all border-2 border-white" title="Kamera">
                            <Camera size={16} />
                        </button>
                    </div>
                    <input type="file" accept="image/*" class="hidden" bind:this={galleryInput} onchange={handleFileSelect} />
                    <input type="file" accept="image/*" capture="environment" class="hidden" bind:this={cameraInput} onchange={handleFileSelect} />
                </div>
                <div>
                    <h3 class="font-bold text-lg text-slate-800">{profile.full_name || 'Admin'}</h3>
                    <p class="text-slate-400 text-sm mt-1">@{profile.username || 'username'}</p>
                    <p class="text-[10px] text-gray-400 italic mt-1">Maks. 50KB setelah kompresi</p>
                </div>
            </div>

            <form onsubmit={(e) => { e.preventDefault(); updateProfile(); }} class="space-y-5 max-w-xl">
                <div>
                    <label for="full_name" class="block text-sm font-bold text-slate-600 mb-2">Nama Lengkap</label>
                    <input id="full_name" type="text" bind:value={profile.full_name} class="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Nama lengkap..." />
                </div>
                <div>
                    <label for="username_a" class="block text-sm font-bold text-slate-600 mb-2">Username</label>
                    <div class="relative">
                        <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                        <input id="username_a" type="text" bind:value={profile.username} class="w-full pl-10 pr-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="username..." />
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label for="school" class="block text-sm font-bold text-slate-600 mb-2">Asal Sekolah</label>
                        <input id="school" type="text" bind:value={profile.school_origin} class="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Nama sekolah..." />
                    </div>
                    <div>
                        <label for="class_a" class="block text-sm font-bold text-slate-600 mb-2">Kelas</label>
                        <select id="class_a" bind:value={profile.class} class="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white">
                            <option value="">Pilih Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                        </select>
                    </div>
                </div>
                <div class="pt-4 border-t border-gray-50 flex justify-end">
                    <button type="submit" disabled={loadingProfile} class="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-xl shadow-lg shadow-yellow-100 transition-all flex items-center gap-2 disabled:opacity-50">
                        <Save size={18} /> {loadingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                </div>
            </form>

        <!-- === TAB: AKUN === -->
        {:else if activeTab === 'akun'}
            <h3 class="text-xl font-bold text-blue-900 mb-6 font-fredoka border-b border-gray-100 pb-4">Akun</h3>

            <!-- Email -->
            <div class="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 mb-4 max-w-xl">
                <div class="flex items-center gap-3 mb-2">
                    <div class="bg-blue-100 p-2.5 rounded-full text-blue-600"><Mail size={18} /></div>
                    <h4 class="font-bold text-blue-900">Email</h4>
                </div>
                <p class="text-slate-500 text-xs mb-3">Email tidak bisa diubah karena dipakai untuk login.</p>
                <div class="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm">
                    <span class="text-slate-600 font-mono text-sm break-all">{email}</span>
                    <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase shrink-0">✓ Aktif</span>
                </div>
            </div>

            <!-- Language -->
            <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6 max-w-xl">
                <div class="flex items-center gap-3 mb-2">
                    <div class="bg-gray-100 p-2.5 rounded-full text-gray-500"><Languages size={18} /></div>
                    <h4 class="font-bold text-blue-900">Bahasa Aplikasi</h4>
                </div>
                <p class="text-slate-500 text-xs mb-4">Ubah bahasa tampilan aplikasi.</p>
                <div class="flex gap-2 flex-wrap">
                    <button onclick={toggleLocale} class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border {$locale === 'id' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}">
                        🇮🇩 Indonesia
                    </button>
                    <button onclick={toggleLocale} class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border {$locale === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}">
                        🇬🇧 English
                    </button>
                </div>
            </div>

        <!-- === TAB: KEAMANAN === -->
        {:else if activeTab === 'keamanan'}
            <h3 class="text-xl font-bold text-blue-900 mb-6 font-fredoka border-b border-gray-100 pb-4">Keamanan</h3>

            <form onsubmit={(e) => { e.preventDefault(); updatePassword(); }} class="space-y-5 max-w-xl">
                <div>
                    <label for="new_pw" class="block text-sm font-bold text-slate-600 mb-2">Password Baru</label>
                    <div class="relative">
                        <input id="new_pw" type="password" bind:value={newPassword} class="w-full pl-11 pr-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Min. 6 karakter..." />
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></div>
                    </div>
                </div>
                <div>
                    <label for="confirm_pw" class="block text-sm font-bold text-slate-600 mb-2">Konfirmasi Password</label>
                    <div class="relative">
                        <input id="confirm_pw" type="password" bind:value={confirmPassword} class="w-full pl-11 pr-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Ulangi password baru..." />
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><BadgeCheck size={18} /></div>
                    </div>
                </div>
                {#if pwMessage}
                    <div class="p-4 rounded-xl text-sm font-medium border {pwSuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}">
                        {pwMessage}
                    </div>
                {/if}
                <div class="pt-4 border-t border-gray-50 flex justify-end">
                    <button type="submit" disabled={pwLoading} class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50">
                        {pwLoading ? 'Mengubah...' : 'Ubah Password'}
                    </button>
                </div>
            </form>

        <!-- === TAB: ADMIN === -->
        {:else if activeTab === 'admin'}
            <h3 class="text-xl font-bold text-blue-900 mb-2 font-fredoka">Konfigurasi Aplikasi</h3>
            <p class="text-sm text-gray-400 mb-6 border-b border-gray-100 pb-4">Pengaturan ini hanya bisa diakses oleh Admin.</p>

            {#if leaderboardLoading}
                <p class="text-gray-400 text-sm">Memuat pengaturan...</p>
            {:else}
                <div class="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex items-center justify-between max-w-xl">
                    <div>
                        <h4 class="text-base font-bold text-gray-800">Status Leaderboard Siswa</h4>
                        <p class="text-sm text-gray-500 mt-1">Jika dimatikan, siswa tidak bisa melihat papan peringkat.</p>
                        <span class="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full {isLeaderboardActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                            {isLeaderboardActive ? '🟢 Aktif' : '🔴 Dimatikan'}
                        </span>
                    </div>
                    <button
                        onclick={toggleLeaderboard}
                        disabled={leaderboardSaving}
                        aria-label="Toggle Leaderboard"
                        class="relative inline-flex h-10 w-20 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none {isLeaderboardActive ? 'bg-green-500' : 'bg-gray-300'}"
                    >
                        <span class="inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 {isLeaderboardActive ? 'translate-x-11' : 'translate-x-1'} shadow-md"></span>
                    </button>
                </div>
            {/if}
        {/if}

    </div>
</div>