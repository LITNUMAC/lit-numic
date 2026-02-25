<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  import { Camera, Save, Image as ImageIcon, Trash2 } from 'lucide-svelte'; // Rename Image to ImageIcon to avoid conflict
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/i18n';

  let loading = false;
  let user = null;
  let avatarUrl = '';
  
  let profile = {
    full_name: '',
    username: '',
    school_origin: '',
    class: '',
    avatar_url: ''
  };

  let cameraInput;
  let galleryInput;
  let files;

  // COMPRESSION LOGIC
  const MAX_SIZE_KB = 50;
  const MAX_WIDTH = 150;
  const MAX_HEIGHT = 150;

  async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize Logic
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG 0.6
                canvas.toBlob((blob) => {
                    if (!blob) { reject(new Error('Compression failed')); return; }
                    
                    if (blob.size > MAX_SIZE_KB * 1024) {
                        reject(new Error(`File terlalu besar! Meskipun sudah dikompres, ukurannya ${(blob.size/1024).toFixed(2)}KB (Max ${MAX_SIZE_KB}KB).`));
                    } else {
                        // Return as File object
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    }
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  }

  // Handle Photo Selection (Camera/Gallery)
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            // Validate initial size (soft check)
            if (file.size > 5 * 1024 * 1024) { throw new Error("File terlalu besar (> 5MB). Mohon pilih yang lebih kecil."); }

            loading = true;
            const compressed = await compressImage(file);
            
            avatarUrl = URL.createObjectURL(compressed);
            files = compressed;
        } catch (error) {
            alert(error.message);
            e.target.value = ''; // Reset input
        } finally {
            loading = false;
        }
    }
  };



  // Handle Delete Avatar
  const deleteAvatar = async () => {
      if (!confirm("Apakah Anda yakin ingin menghapus foto profil ini?")) return;

      try {
          loading = true;

          // 1. Delete from Storage (if it's a custom upload)
          // We assume custom uploads are hosted on Supabase.
          // The filename strategy is fixed: "${user.id}/avatar.jpg"
          // Even if the old file had a different name (timestamp), we can try to delete the fixed one, 
          // or just rely on setting DB to null. 
          // However, to be thorough (Zero Waste), we should try to delete the file.
          
          const filePath = `${user.id}/avatar.jpg`;
          const { error: storageError } = await supabase.storage
              .from('avatars')
              .remove([filePath]);

          if (storageError) console.error("Storage delete error:", storageError);

          // 2. Update DB
          const { error: dbError } = await supabase.from('profiles')
              .update({ avatar_url: null })
              .eq('id', user.id);

          if (dbError) throw dbError;

          // 3. Reset UI
          alert("Foto profil berhasil dihapus!");
          profile.avatar_url = null;
          avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.email}`;
          files = null;
          
          invalidateAll();

      } catch (error) {
          alert("Gagal menghapus foto: " + error.message);
      } finally {
          loading = false;
      }
  };

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      user = session.user;
      fetchProfile();
    }
  });

  async function fetchProfile() {
    loading = true;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      profile = {
        full_name: data.full_name || '',
        username: data.username || '',
        school_origin: data.school_origin || '',
        class: data.class || '',
        avatar_url: data.avatar_url // PERBAIKAN: Pastikan ini terbawa
      };
      avatarUrl = data.avatar_url || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.email}`;
    }
    loading = false;
  }

  async function updateProfile() {
    loading = true;

    try {
        // 1. Upload Avatar if changed AND it's a file (not a URL string)
        // 1. Upload Avatar if changed AND it's a file (not a URL string)
        if (files) {
            // ZERO WASTE STRATEGY: Fixed filename per user
            const fileExt = "jpg"; 
            const fileName = `${user.id}/avatar.${fileExt}`; // Fixed path: userid/avatar.jpg
            const filePath = `/${fileName}`; // Root of bucket
            
            // Upload compressed file (Upsert = Overwrite = Zero Waste)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, files, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
                
            profile.avatar_url = publicUrl;
        }

        // 2. Update Profile Data
        const { data, error } = await supabase.from('profiles').update({
            full_name: profile.full_name,
            username: profile.username,
            school_origin: profile.school_origin,
            class: profile.class,
            avatar_url: profile.avatar_url
        }).eq('id', user.id).select(); // Tambah select() untuk memastikan data kembali
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            throw new Error("Data tidak ditemukan atau tidak ada perubahan yang disimpan.");
        }
        
        alert('Profile berhasil diupdate! 🎉');
        files = null; 
        
        // Refresh semua data aplikasi agar dashboard & sidebar update otomatis
        invalidateAll();

    } catch (error) {
        alert('Gagal update profile: ' + error.message);
    } finally {
        loading = false;
    }
  }
</script>

<div class="w-full max-w-xl">
  <h2 class="text-xl md:text-2xl font-bold text-blue-900 mb-5 font-fredoka border-b border-gray-100 pb-4">{$t('settProfileTitle')}</h2>

  <!-- Avatar Section -->
  <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10 text-center md:text-left">
    <div class="relative group">
      <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-50 shadow-md">
        <img src={avatarUrl} alt="Avatar" class="w-full h-full object-cover" />
      </div>
      <!-- Buttons: Camera & Gallery -->
      <div class="absolute -bottom-2 -right-2 flex gap-2">
        <!-- Delete Button (Only if custom avatar) -->
        {#if avatarUrl && !avatarUrl.includes('dicebear')}
            <button 
                type="button"
                onclick={deleteAvatar}
                class="bg-red-50 p-2 rounded-full text-red-500 shadow-md hover:scale-110 transition-all border border-red-100 group-hover:block"
                title="Hapus Foto"
            >
                <Trash2 size={16} />
            </button>
        {/if}

        <!-- Gallery Button -->
        <button 
            type="button"
            onclick={() => galleryInput.click()}
            class="bg-white p-2 rounded-full text-blue-900 shadow-md hover:scale-110 transition-all border border-blue-100 group-hover:block"
            title="Pilih dari Galeri/File"
        >
            <ImageIcon size={16} />
        </button>

        <!-- Camera Button -->
        <button 
            type="button"
            onclick={() => cameraInput.click()}
            class="bg-yellow-400 p-2 rounded-full text-blue-900 shadow-lg hover:scale-110 transition-all border-2 border-white"
            title="Ambil Foto"
        >
            <Camera size={16} />
        </button>
      </div>
      
      <!-- Hidden Inputs -->
      <input 
        type="file" 
        accept="image/*" 
        class="hidden" 
        bind:this={galleryInput} 
        onchange={handleFileSelect} 
      />
      
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        class="hidden" 
        bind:this={cameraInput} 
        onchange={handleFileSelect} 
      />
    </div>
    
    <!-- Default Avatars Selection -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
          <h3 class="font-bold text-lg text-slate-800">{profile.full_name || 'User'}</h3>
      </div>
      
      <!-- Default Avatars Removed (Moved to Setup) -->
      
      <p class="text-slate-400 text-sm font-medium mt-1">@{profile.username || 'username'}</p>
      {#if !profile.username}<p class="text-xs text-red-400">{$t('settUsernameNotSet')}</p>{/if}
      <p class="text-[10px] text-gray-400 italic mt-1">{$t('settPhotoMax')}</p>
    </div>
  </div>

  <!-- Form -->
  <form onsubmit={(e) => { e.preventDefault(); updateProfile(); }} class="space-y-6">
    
    <div>
      <label for="full_name" class="block text-sm font-bold text-slate-600 mb-2">{$t('settFullName')}</label>
      <input 
        id="full_name"
        type="text" 
        bind:value={profile.full_name}
        class="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-300"
        placeholder={$t('settFullNamePlaceholder')}
      />
    </div>

    <div>
      <label for="username" class="block text-sm font-bold text-slate-600 mb-2">{$t('settUsername')}</label>
      <div class="relative">
        <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
        <input 
          id="username"
          type="text" 
          bind:value={profile.username}
          class="w-full pl-10 pr-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-300"
          placeholder={$t('settUsernamePlaceholder')}
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <label for="school_origin" class="block text-sm font-bold text-slate-600 mb-2">{$t('settSchool')}</label>
        <input 
          id="school_origin"
          type="text" 
          bind:value={profile.school_origin}
          class="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-300"
          placeholder={$t('settSchoolPlaceholder')}
        />
      </div>
      <div>
        <label for="class_select" class="block text-sm font-bold text-slate-600 mb-2">{$t('settClass')}</label>
        <select 
          id="class_select"
          bind:value={profile.class}
          class="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
        >
          <option value="">{$t('settClassSelect')}</option>
          <option value="7">{$t('settClass7')}</option>
          <option value="8">{$t('settClass8')}</option>
          <option value="9">{$t('settClass9')}</option>
        </select>
      </div>
    </div>

    <div class="pt-6 border-t border-gray-50 flex justify-end">
      <button 
        type="submit" 
        disabled={loading}
        class="w-full sm:w-auto px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-xl shadow-lg shadow-yellow-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
      >
        <Save size={18} />
        {loading ? $t('settSaving') : $t('settSave')}
      </button>
    </div>

  </form>
</div>