<script>
  import { page } from '$app/stores';
  import { User, Settings, Shield, LogOut } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  
  let { children } = $props();

  // Menu items config
  const menuItems = [
    { href: '/settings/profile', label: 'Profil Saya', icon: User },
    { href: '/settings/account', label: 'Akun', icon: Settings },
    { href: '/settings/security', label: 'Keamanan', icon: Shield },
  ];
</script>

<div class="flex flex-row gap-8" in:fade>
  
  <!-- Sub-Sidebar Pengaturan -->
  <aside class="w-full lg:w-72 flex-shrink-0">
    <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 sticky top-28">
      <div class="mb-6 px-4">
          <h2 class="text-xl font-bold text-gray-800">Pengaturan</h2>
          <p class="text-xs text-gray-400 mt-1">Kelola data dan keamanan akunmu.</p>
      </div>

      <nav class="space-y-2">
        {#each menuItems as item}
          {@const isActive = $page.url.pathname.includes(item.href)}
          <a 
            href={item.href} 
            class="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300
            {isActive 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
              : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}"
          >
            <svelte:component this={item.icon} size={20} />
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="mt-8 pt-6 border-t border-gray-50">
         <a href="/logout" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm">
            <LogOut size={20} />
            Keluar Akun
         </a>
      </div>
    </div>
  </aside>

  <!-- Content Slot -->
  <main class="flex-1 min-w-0">
    <div class="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 min-h-[600px]">
      {@render children()}
    </div>
  </main>
</div>
