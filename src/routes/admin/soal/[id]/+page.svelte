<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';
    import { Trash2 } from 'lucide-svelte';

    let comicId = $page.params.id;
    let comic = null;
    let questions = [];
    let loading = true;
    let isSubmitting = false;

    // State Form yang sudah diupdate
    let form = {
        question_type: 'pilihan_ganda', // Default jenis soal
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer_pg: 'A', // Kunci jawaban untuk Pilihan Ganda
        correct_answer_isian: '', // Kunci jawaban untuk Isian
        tags: ''
    };

    onMount(async () => {
        await fetchData();
    });

    async function fetchData() {
        loading = true;
        const { data: comicData } = await supabase.from('comics').select('*').eq('id', comicId).single();
        if (comicData) comic = comicData;

        const { data: qData } = await supabase.from('questions').select('*').eq('comic_id', comicId).order('created_at', { ascending: true });
        if (qData) questions = qData;
        
        loading = false;
    }

    async function addQuestion() {
        // Validasi sesuai jenis soal
        if (form.question_type === 'pilihan_ganda') {
            if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
                alert("Semua kolom pertanyaan dan pilihan ganda wajib diisi!");
                return;
            }
        } else if (form.question_type === 'isian') {
            if (!form.question_text || !form.correct_answer_isian) {
                alert("Pertanyaan dan Kunci Jawaban Isian wajib diisi!");
                return;
            }
        }

        isSubmitting = true;

        // Tentukan kunci jawaban akhir berdasarkan jenis soal
        let finalCorrectAnswer = form.question_type === 'pilihan_ganda' ? form.correct_answer_pg : form.correct_answer_isian;

        const { error } = await supabase.from('questions').insert([
            {
                comic_id: comicId,
                type: form.question_type,
                question_text: form.question_text,
                option_a: form.question_type === 'pilihan_ganda' ? form.option_a : null,
                option_b: form.question_type === 'pilihan_ganda' ? form.option_b : null,
                option_c: form.question_type === 'pilihan_ganda' ? form.option_c : null,
                option_d: form.question_type === 'pilihan_ganda' ? form.option_d : null,
                correct_answer: finalCorrectAnswer,
                tags: form.tags
            }
        ]);

        if (error) {
            alert("Gagal menyimpan soal: " + error.message);
        } else {
            // Reset form
            form = { question_type: 'pilihan_ganda', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer_pg: 'A', correct_answer_isian: '', tags: '' };
            await fetchData();
        }
        
        isSubmitting = false;
    }

    async function deleteQuestion(id) {
        if (confirm("Yakin ingin menghapus soal ini?")) {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (!error) await fetchData();
            else alert("Gagal menghapus: " + error.message);
        }
    }
</script>

<div in:fly={{ y: 20, duration: 500 }} class="max-w-6xl mx-auto pb-10">
    
    <div class="flex items-center gap-4 mb-8">
        <button on:click={() => window.history.back()} class="bg-white p-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors border border-gray-100">
            ←
        </button>
        <div>
            <h2 class="text-2xl font-bold text-blue-900 font-poppins">Kelola Soal</h2>
            <p class="text-gray-500 text-sm">Untuk Komik: <span class="font-bold text-blue-600">{comic?.title || 'Memuat...'}</span></p>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div class="lg:col-span-5 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit sticky top-6">
                <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                     Tambah Soal Baru
                </h3>

                <div class="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button on:click={() => form.question_type = 'pilihan_ganda'} class="flex-1 text-sm font-bold py-2 rounded-lg transition-all {form.question_type === 'pilihan_ganda' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Pilihan Ganda</button>
                    <button on:click={() => form.question_type = 'isian'} class="flex-1 text-sm font-bold py-2 rounded-lg transition-all {form.question_type === 'isian' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Isian Singkat</button>
                </div>

                <form on:submit|preventDefault={addQuestion} class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pertanyaan</label>
                        <textarea bind:value={form.question_text} rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" placeholder="Ketik pertanyaan di sini..." required></textarea>
                    </div>

                    {#if form.question_type === 'pilihan_ganda'}
                        <div class="space-y-3" in:fade>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pilihan Jawaban</label>
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">A</span>
                                <input bind:value={form.option_a} type="text" class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Pilihan A" required>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">B</span>
                                <input bind:value={form.option_b} type="text" class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Pilihan B" required>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">C</span>
                                <input bind:value={form.option_c} type="text" class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Pilihan C" required>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">D</span>
                                <input bind:value={form.option_d} type="text" class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Pilihan D" required>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 pt-2" in:fade>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kunci Jawaban</label>
                                <select bind:value={form.correct_answer_pg} class="w-full px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold cursor-pointer">
                                    <option value="A">Jawaban A</option>
                                    <option value="B">Jawaban B</option>
                                    <option value="C">Jawaban C</option>
                                    <option value="D">Jawaban D</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tag (Opsional)</label>
                                <input bind:value={form.tags} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Cth: Logika">
                            </div>
                        </div>
                    {/if}

                    {#if form.question_type === 'isian'}
                        <div class="pt-2 space-y-4" in:fade>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kunci Jawaban Benar</label>
                                <input bind:value={form.correct_answer_isian} type="text" class="w-full px-4 py-3 bg-green-50 text-green-800 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder-green-300" placeholder="Ketik jawaban yang benar di sini..." required>
                                <p class="text-[10px] text-gray-400 mt-1">*Siswa harus mengetik jawaban persis seperti ini agar dianggap benar.</p>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tag (Opsional)</label>
                                <input bind:value={form.tags} type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Cth: Aljabar">
                            </div>
                        </div>
                    {/if}

                    <button type="submit" disabled={isSubmitting} class="w-full bg-blue-600 text-white font-bold py-3 mt-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50">
                        {#if isSubmitting}
                            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menyimpan...
                        {:else}
                            Simpan Soal
                        {/if}
                    </button>
                </form>
            </div>

            <div class="lg:col-span-7">
                <div class="flex items-center justify-between mb-4 px-2">
                    <h3 class="text-lg font-bold text-gray-800">Daftar Soal ({questions.length})</h3>
                </div>

                {#if questions.length === 0}
                    <div class="bg-blue-50/50 p-10 rounded-[2rem] text-center border-2 border-dashed border-blue-100">
                        <span class="text-4xl mb-3 block">📭</span>
                        <p class="text-blue-600 font-medium">Belum ada soal untuk komik ini.</p>
                    </div>
                {:else}
                    <div class="space-y-4">
                        {#each questions as q, i (q.id)}
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group transition-all hover:border-blue-200" in:fade>
                                <button on:click={() => deleteQuestion(q.id)} class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100" title="Hapus Soal">
                                    <Trash2 size={18} />
                                </button>

                                <div class="flex gap-4">
                                    <div class="w-8 h-8 shrink-0 bg-blue-100 text-blue-700 font-black rounded-full flex items-center justify-center text-sm">
                                        {i + 1}
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                                {q.type === 'isian' ? 'Isian Singkat' : 'Pilihan Ganda'}
                                            </span>
                                            {#if q.tags}
                                                <span class="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">TAG: {q.tags}</span>
                                            {/if}
                                        </div>
                                        <p class="font-medium text-gray-800 mb-4">{q.question_text}</p>
                                        
                                        {#if q.type === 'pilihan_ganda' || !q.type}
                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                <div class="p-2 rounded-lg border {q.correct_answer === 'A' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-600'}">
                                                    <span class="mr-2 opacity-50">A.</span> {q.option_a}
                                                </div>
                                                <div class="p-2 rounded-lg border {q.correct_answer === 'B' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-600'}">
                                                    <span class="mr-2 opacity-50">B.</span> {q.option_b}
                                                </div>
                                                <div class="p-2 rounded-lg border {q.correct_answer === 'C' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-600'}">
                                                    <span class="mr-2 opacity-50">C.</span> {q.option_c}
                                                </div>
                                                <div class="p-2 rounded-lg border {q.correct_answer === 'D' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-600'}">
                                                    <span class="mr-2 opacity-50">D.</span> {q.option_d}
                                                </div>
                                            </div>
                                        {:else}
                                            <div class="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-sm flex gap-2">
                                                <span class="font-bold opacity-70">Kunci Jawaban:</span>
                                                <span class="font-black">{q.correct_answer}</span>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>