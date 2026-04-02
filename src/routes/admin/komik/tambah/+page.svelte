<script>
    import { supabase } from '$lib/supabaseClient';
    import { fly } from 'svelte/transition';

    let title = '';
    let description = '';
    let coverFile = null;
    let pdfFile = null;
    let loading = false;
    let errorMessage = '';
    let successMessage = '';

    // Tangkap file Gambar
    const handleCoverChange = (e) => { 
        coverFile = e.target.files[0]; 
    };

    // Tangkap file PDF & Validasi Limit 5MB
    const handlePdfChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 5) {
                alert(`File terlalu besar! (${fileSizeMB.toFixed(2)} MB).\nMaksimal 5 MB. Silakan kompres dulu di iLovePDF.`);
                e.target.value = ''; // Reset input
                pdfFile = null;
            } else {
                pdfFile = file;
            }
        }
    };

    const uploadComic = async () => {
        if (!title || !description || !coverFile || !pdfFile) {
            errorMessage = "Semua kolom wajib diisi ya!";
            return;
        }

        loading = true;
        errorMessage = '';
        
        try {
            // 1. Upload Cover ke Storage (Bucket: comics-files, Folder: covers)
            const coverName = `covers/${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error: coverError } = await supabase.storage.from('comics-files').upload(coverName, coverFile);
            if (coverError) throw new Error("Gagal upload Cover: " + coverError.message);
            const coverUrl = supabase.storage.from('comics-files').getPublicUrl(coverName).data.publicUrl;

            // 2. Upload PDF ke Storage (Bucket: comics-files, Folder: pdfs)
            const pdfName = `pdfs/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error: pdfError } = await supabase.storage.from('comics-files').upload(pdfName, pdfFile);
            if (pdfError) throw new Error("Gagal upload PDF: " + pdfError.message);
            const pdfUrl = supabase.storage.from('comics-files').getPublicUrl(pdfName).data.publicUrl;

            // --- PERBAIKAN: Bikin Slug otomatis dari Judul ---
            // Contoh: "Misteri Hutan" -> "misteri-hutan"
            const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            // 3. Simpan data ke Database (Tabel comics)
            const { error: dbError } = await supabase.from('comics').insert([
                {
                    title: title,
                    description: description,
                    cover_url: coverUrl,
                    file_url: pdfUrl,
                    total_pages: 0,
                    slug: generatedSlug // <--- Ini data slug yang dikirim agar tidak error
                }
            ]);

            if (dbError) throw new Error("Gagal menyimpan ke database: " + dbError.message);

            successMessage = "Hore! Komik berhasil diunggah.";
            
            // Redirect kembali ke daftar komik setelah 2 detik
            setTimeout(() => {
                window.location.href = '/admin/komik';
            }, 2000);
            
        } catch (err) {
            console.error(err);
            errorMessage = err.message;
        } finally {
            loading = false;
        }
    };
</script>

<div in:fly={{ y: 20, duration: 500 }} class="max-w-3xl mx-auto">
    
    <button onclick={() => window.history.back()} class="text-blue-600 font-bold mb-6 flex items-center gap-2 hover:text-blue-800 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg> Kembali
    </button>

    <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h2 class="text-3xl font-bold text-blue-900 mb-2 font-poppins">Upload Komik Baru</h2>
        <p class="text-gray-500 mb-8">Pastikan file PDF sudah dikompres (maks 5MB) agar aplikasi tetap ringan.</p>

        {#if errorMessage}
            <div class="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 flex-shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> {errorMessage}
            </div>
        {/if}

        {#if successMessage}
            <div class="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> {successMessage} Mengalihkan...
            </div>
        {/if}

        <form onsubmit={(e) => { e.preventDefault(); uploadComic(); }} class="space-y-6">
            
            <div>
                <label for="title" class="block text-sm font-bold text-gray-700 mb-2">Judul Komik</label>
                <input id="title" type="text" bind:value={title} placeholder="Contoh: Misteri Angka Hilang" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" required disabled={loading} />
            </div>

            <div>
                <label for="description" class="block text-sm font-bold text-gray-700 mb-2">Deskripsi / Sinopsis Singkat</label>
                <textarea id="description" bind:value={description} rows="3" placeholder="Ceritakan sedikit tentang komik ini..." class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium resize-none" required disabled={loading}></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="border-2 border-dashed border-gray-200 rounded-3xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                    <label class="cursor-pointer block">
                        <div class="mb-3 flex justify-center text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                        <span class="block text-sm font-bold text-blue-600 mb-1">Pilih Gambar Cover</span>
                        <span class="block text-xs text-gray-400">Format: JPG, PNG, WEBP</span>
                        <input type="file" accept="image/*" onchange={handleCoverChange} class="hidden" id="cover-input" required disabled={loading} />
                    </label>
                    {#if coverFile}
                        <p class="mt-4 text-xs font-bold text-green-600 bg-green-50 py-1 px-2 rounded-lg inline-block">✓ {coverFile.name}</p>
                    {/if}
                </div>

                <div class="border-2 border-dashed border-gray-200 rounded-3xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                    <label class="cursor-pointer block">
                        <div class="mb-3 flex justify-center text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <span class="block text-sm font-bold text-blue-600 mb-1">Pilih File PDF</span>
                        <span class="block text-xs text-red-400 font-bold">MAKSIMAL 5 MB</span>
                        <input type="file" accept="application/pdf" onchange={handlePdfChange} class="hidden" id="pdf-input" required disabled={loading} />
                    </label>
                    {#if pdfFile}
                        <p class="mt-4 text-xs font-bold text-green-600 bg-green-50 py-1 px-2 rounded-lg inline-block">✓ {pdfFile.name}</p>
                    {/if}
                </div>
            </div>

            <button type="submit" class="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all flex justify-center items-center gap-2 mt-4" disabled={loading}>
                {#if loading}
                    <div class="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengunggah Data...</span>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <span>Unggah Komik Sekarang</span>
                {/if}
            </button>
        </form>
    </div>
</div>