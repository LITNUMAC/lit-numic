<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabaseClient';
    import { fly, fade } from 'svelte/transition';
  import { Info, PenTool, Rocket, CheckCircle, XCircle, Lightbulb, ChevronRight } from 'lucide-svelte';

    let comicId = $page.params.id;
    let loading = true;
    let step = 1;
    
    // Kita simpan jawaban user dalam object: { [questionId]: 'jawaban' }
    let answers = {}; 
    
    let isReviewMode = false; 
    let finalScore = 0;
    
    // Variabel untuk menampung soal dari Database
    let activeQuestions = [];

    onMount(async () => {
        await fetchRandomQuestions();
    });

    // --- 1. AMBIL & ACAK SOAL DARI DATABASE ---
    async function fetchRandomQuestions() {
        loading = true;

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('comic_id', comicId); 

        if (error) {
            console.error("Gagal ambil soal:", error);
            loading = false;
            return;
        }

        if (data && data.length > 0) {
            // Acak urutan soal (Shuffle)
            const shuffled = data.sort(() => 0.5 - Math.random());
            // Ambil 3 soal saja
            activeQuestions = shuffled.slice(0, 3);
        }
        loading = false;
    }

    // --- 2. LOGIKA PENILAIAN OTOMATIS (Auto-Calculating) ---
    function calculateScore() {
        let correctCount = 0;
        
        activeQuestions.forEach(q => {
            const userAnswer = answers[q.id]; 

            if (q.type === 'isian') {
                 const textAnswer = userAnswer ? userAnswer.toLowerCase().trim() : "";
                 const correctAnswer = q.correct_answer ? q.correct_answer.toLowerCase().trim() : "";
                 
                 if (textAnswer === correctAnswer) {
                     correctCount++;
                 }
            } else {
                 let correctOptionText = "";
                 if (q.correct_answer === 'A') correctOptionText = q.option_a;
                 else if (q.correct_answer === 'B') correctOptionText = q.option_b;
                 else if (q.correct_answer === 'C') correctOptionText = q.option_c;
                 else if (q.correct_answer === 'D') correctOptionText = q.option_d;

                 if (userAnswer === correctOptionText) {
                     correctCount++;
                 }
            }
        });

        // Hitung Nilai (Skala 100)
        return Math.round((correctCount / activeQuestions.length) * 100);
    }

    async function submitQuiz() {
        loading = true;
        finalScore = calculateScore();
        console.log("Mencoba mengirim nilai:", finalScore); 

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
           console.log("User ID:", session.user.id); 
           console.log("Comic ID:", comicId);       

           const { data, error } = await supabase
            .from('student_progress')
            .upsert({ 
              user_id: session.user.id, 
              comic_id: comicId, 
              is_completed: true,
              score: finalScore,
              updated_at: new Date()
            }, { onConflict: 'user_id, comic_id' })
            .select();

           if (error) {
               console.error("GAGAL SIMPAN:", error); 
               alert("Gagal menyimpan: " + error.message);
           } else {
               console.log("BERHASIL SIMPAN:", data); 

               // --- TAMBAHAN: Simpan ke quiz_scores untuk statistik ---
               await supabase.from('quiz_scores').insert({
                   user_id: session.user.id,
                   comic_id: comicId,
                   score: finalScore
               });
           }
        } else {
            alert("Sesi habis, silakan login lagi.");
        }

        loading = false;
        isReviewMode = true; 
    }
</script>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&display=swap');
    .font-fredoka { font-family: 'Fredoka', sans-serif; }
    .bg-pattern {
        background-color: #f0f4f8;
        background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px);
        background-size: 24px 24px;
    }
</style>

<div class="min-h-screen bg-pattern flex items-center justify-center p-4 md:p-10 font-poppins overflow-hidden">
    <div class="bg-white w-full max-w-6xl rounded-2xl md:rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-4 md:border-[6px] border-blue-600 relative flex flex-col min-h-[500px]">
        
        <div class="pt-8 md:pt-10 pb-4 md:pb-6 px-4 md:px-10 text-center">
            {#if !isReviewMode}
                <span class="bg-blue-100 text-blue-700 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest">Tantangan Seru</span>
                <h1 class="text-4xl lg:text-5xl font-black text-blue-900 mt-4 font-fredoka uppercase tracking-tight">Mode Tantangan!</h1>
                
                <div class="flex justify-center gap-4 mt-8">
                    {#each activeQuestions as _, i}
                        <div class="h-4 w-4 rounded-full transition-all duration-500 {step >= i + 1 ? 'bg-blue-600 scale-125' : 'bg-blue-100'} shadow-sm"></div>
                    {/each}
                </div>
            {:else}
                <span class="bg-yellow-100 text-yellow-700 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest">Hasil Belajar</span>
                <h1 class="text-5xl font-black text-blue-900 mt-4 font-fredoka uppercase tracking-tight">Nilai Kamu: {finalScore}</h1>
            {/if}
        </div>

        <div class="flex-1 px-4 md:px-10 pb-12 overflow-y-auto max-h-[70vh]">
            <div class="bg-blue-50/50 rounded-2xl md:rounded-[2rem] p-6 md:p-12 border-2 border-dashed border-blue-200 min-h-[300px] flex flex-col items-center justify-center relative w-full">
                
                {#if loading}
                    <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                
                {:else if !isReviewMode && activeQuestions.length > 0}
                    
                    {#each activeQuestions as question, index}
                        {#if step === index + 1}
                            <div in:fly={{ y: 20, duration: 500 }} class="w-full">
                                <div class="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                                    
                                    <div>
                                        <h2 class="text-2xl md:text-3xl font-black text-blue-900 mb-4 font-fredoka">Soal {index + 1}</h2>
                                        <p class="text-gray-600 text-lg md:text-xl font-medium leading-relaxed">{question.question_text}</p>
                                    </div>
                                    
                                    <div class="space-y-4 w-full">
                                        {#if question.type === 'pilihan_ganda' || (!question.type && question.options)} 
                                            <div class="grid gap-3">
                                                <div class="p-4 bg-blue-50 text-blue-800 rounded-xl mb-2 text-sm font-bold border border-blue-100 flex items-center gap-2">
                                                    <Info size={18} /> Pilih satu jawaban yang paling tepat.
                                                </div>
                                                <button 
                                                    onclick={() => { 
                                                        answers[question.id] = question.option_a; 
                                                        if(step < activeQuestions.length) step++; 
                                                    }}
                                                    class="group w-full text-left p-6 rounded-2xl bg-white border-4 border-transparent shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex justify-between items-center {answers[question.id] === question.option_a ? 'border-blue-500 bg-blue-50' : ''}"
                                                >
                                                    <span class="text-lg font-bold text-gray-700 group-hover:text-blue-700">A. {question.option_a}</span>
                                                    <div class="w-6 h-6 rounded-full border-2 {answers[question.id] === question.option_a ? 'bg-blue-500 border-blue-500' : 'border-gray-200'}"></div>
                                                </button>
                                                <button 
                                                    onclick={() => { 
                                                        answers[question.id] = question.option_b; 
                                                        if(step < activeQuestions.length) step++; 
                                                    }}
                                                    class="group w-full text-left p-6 rounded-2xl bg-white border-4 border-transparent shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex justify-between items-center {answers[question.id] === question.option_b ? 'border-blue-500 bg-blue-50' : ''}"
                                                >
                                                    <span class="text-lg font-bold text-gray-700 group-hover:text-blue-700">B. {question.option_b}</span>
                                                    <div class="w-6 h-6 rounded-full border-2 {answers[question.id] === question.option_b ? 'bg-blue-500 border-blue-500' : 'border-gray-200'}"></div>
                                                </button>
                                                <button 
                                                    onclick={() => { 
                                                        answers[question.id] = question.option_c; 
                                                        if(step < activeQuestions.length) step++; 
                                                    }}
                                                    class="group w-full text-left p-6 rounded-2xl bg-white border-4 border-transparent shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex justify-between items-center {answers[question.id] === question.option_c ? 'border-blue-500 bg-blue-50' : ''}"
                                                >
                                                    <span class="text-lg font-bold text-gray-700 group-hover:text-blue-700">C. {question.option_c}</span>
                                                    <div class="w-6 h-6 rounded-full border-2 {answers[question.id] === question.option_c ? 'bg-blue-500 border-blue-500' : 'border-gray-200'}"></div>
                                                </button>
                                                <button 
                                                    onclick={() => { 
                                                        answers[question.id] = question.option_d; 
                                                        if(step < activeQuestions.length) step++; 
                                                    }}
                                                    class="group w-full text-left p-6 rounded-2xl bg-white border-4 border-transparent shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex justify-between items-center {answers[question.id] === question.option_d ? 'border-blue-500 bg-blue-50' : ''}"
                                                >
                                                    <span class="text-lg font-bold text-gray-700 group-hover:text-blue-700">D. {question.option_d}</span>
                                                    <div class="w-6 h-6 rounded-full border-2 {answers[question.id] === question.option_d ? 'bg-blue-500 border-blue-500' : 'border-gray-200'}"></div>
                                                </button>
                                            </div>
                                        {:else if question.type === 'isian'}
                                            <div class="space-y-3">
                                                <div class="p-4 bg-yellow-50 text-yellow-800 rounded-xl mb-2 text-sm font-bold border border-yellow-100 flex items-center gap-2">
                                                    <PenTool size={18} /> Ketik jawaban singkatmu di bawah ini.
                                                </div>
                                                <textarea 
                                                    bind:value={answers[question.id]} 
                                                    placeholder="Tulis jawabanmu di sini..." 
                                                    class="w-full p-6 h-40 rounded-3xl bg-white border-4 border-gray-100 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 shadow-inner outline-none font-medium text-lg transition-all"
                                                ></textarea>
                                                
                                                {#if step < activeQuestions.length}
                                                    <button 
                                                        onclick={() => step++} 
                                                        class="w-full mt-4 bg-blue-100 text-blue-700 py-4 rounded-2xl font-black text-xl hover:bg-blue-200 transition-all shadow-sm flex items-center justify-center gap-2">
                                                        Selanjutnya <ChevronRight size={24} />
                                                    </button>
                                                {/if}
                                            </div>
                                        {/if}

                                        {#if step === activeQuestions.length}
                                            <button onclick={submitQuiz} class="w-full mt-4 bg-yellow-400 text-blue-900 py-6 rounded-3xl font-black text-2xl shadow-[0_12px_0_0_#ca8a04] hover:translate-y-[4px] active:translate-y-[8px] active:shadow-none transition-all flex items-center justify-center gap-2">
                                                KIRIM JAWABAN <Rocket size={24} />
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}

                {:else if isReviewMode}
                    <div in:fade class="w-full space-y-6">
                        {#each activeQuestions as q, i}
                            {@const userAnswer = answers[q.id]}
                            {@const isCorrect = q.type === 'isian' 
                                ? (userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim())
                                : (userAnswer === (q.correct_answer === 'A' ? q.option_a : q.correct_answer === 'B' ? q.option_b : q.correct_answer === 'C' ? q.option_c : q.option_d))}
                            
                            <div class="bg-white p-6 rounded-3xl border-l-8 {isCorrect ? 'border-green-400' : 'border-red-400'} shadow-sm">
                                <div class="flex justify-between mb-2">
                                    <h3 class="font-bold text-gray-800">Soal {i+1} <span class="text-xs font-normal text-gray-500 uppercase">({q.type === 'isian' ? 'Isian' : 'Pilgan'})</span></h3>
                                    <span class="px-3 py-1 rounded-full text-xs font-black {isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                        {isCorrect ? 'BENAR' : 'SALAH'}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 mb-4 italic">"{q.question_text}"</p>
                                
                                <div class="bg-gray-50 p-4 rounded-xl text-sm">
                                    <p>Jawabmu: <span class="font-bold text-gray-800">{userAnswer || '-'}</span></p>
                                    
                                    {#if q.type === 'pilihan_ganda'}
                                        {@const correctText = q.correct_answer === 'A' ? q.option_a : q.correct_answer === 'B' ? q.option_b : q.correct_answer === 'C' ? q.option_c : q.option_d}
                                        <p class="text-green-600 mt-1">Kunci: <span class="font-bold">{q.correct_answer}. {correctText}</span></p>
                                    {:else}
                                        <p class="text-green-600 mt-1">Kunci: <span class="font-bold">{q.correct_answer}</span></p>
                                    {/if}
                                    
                                    {#if q.explanation}
                                        <hr class="border-gray-200 my-2">
                                        <p class="text-blue-600 font-medium flex items-start gap-2">
                                            <Lightbulb size={16} class="mt-1 shrink-0" /> 
                                            <span>{q.explanation}</span>
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                        <button onclick={() => window.location.href = '/dashboard'} class="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">Kembali ke Dashboard</button>
                    </div>
                {/if}

            </div>
        </div>
    </div>
</div>