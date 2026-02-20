<script>
  import { page } from '$app/stores';
  import { User, Settings, Shield, ChevronLeft, LogOut } from 'lucide-svelte';
  
  // Menu items config
  const menuItems = [
    { href: '/settings/profile', label: 'Profil Saya', icon: User },
    { href: '/settings/account', label: 'Akun', icon: Settings },
    { href: '/settings/security', label: 'Keamanan', icon: Shield },
  ];
</script>

<div class="min-h-screen bg-blue-50 font-poppins text-slate-800 p-4 md:p-8">
  <div class="max-w-6xl mx-auto">
    
    <!-- Header Mobile/Desktop -->
    <div class="mb-8 flex items-center gap-4">
      <a href="/dashboard" class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition-all text-blue-600">
        <ChevronLeft size={20} />
      </a>
      <h1 class="text-2xl md:text-3xl font-bold text-blue-900 font-fredoka">Pengaturan</h1>
    </div>

    <div class="flex flex-col md:flex-row gap-6 md:gap-8">
      
      <!-- SIDEBAR -->
      <aside class="w-full md:w-64 flex-shrink-0">
        <div class="bg-white rounded-[2rem] p-6 shadow-sm shadow-blue-100 border border-blue-50 sticky top-8">
          <nav class="space-y-2">
            {#each menuItems as item}
              {@const isActive = $page.url.pathname.includes(item.href)}
              <a 
                href={item.href} 
                class="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300
                {isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}"
              >
                <svelte:component this={item.icon} size={20} />
                {item.label}
              </a>
            {/each}
          </nav>

          <div class="mt-8 pt-6 border-t border-gray-100">
             <a href="/logout" class="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <LogOut size={20} />
                Keluar
             </a>
          </div>
        </div>
      </aside>

      <!-- CONTENT SLOT -->
      <main class="flex-1">
        <div class="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm shadow-blue-100 border border-blue-50 min-h-[500px]">
          <slot />
        </div>
      </main>

    </div>
  </div>
</div>
