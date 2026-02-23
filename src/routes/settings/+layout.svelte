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

<div class="flex flex-col gap-4 md:gap-6 w-full" in:fade>
  
  <!-- Sub-nav: horizontal scrollable pills on mobile, sidebar on desktop -->
  <aside class="w-full">
    <div class="bg-white rounded-2xl md:rounded-[2rem] p-3 md:p-6 shadow-sm border border-gray-100 md:sticky md:top-28">
      <!-- Mobile: horizontal scrollable tab pills -->
      <div class="flex md:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
        {#each menuItems as item}
          {@const isActive = $page.url.pathname.includes(item.href)}
          {@const Icon = item.icon}
          <a
            href={item.href}
            class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
            {isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-blue-600'}"
          >
            <Icon size={16} />
            {item.label}
          </a>
        {/each}
      </div>
      <!-- Desktop: vertical sidebar nav -->
      <div class="hidden md:block">
        <div class="mb-6 px-4">
            <h2 class="text-xl font-bold text-gray-800">Pengaturan</h2>
            <p class="text-xs text-gray-400 mt-1">Kelola data dan keamanan akunmu.</p>
        </div>
        <nav class="space-y-2">
          {#each menuItems as item}
            {@const isActive = $page.url.pathname.includes(item.href)}
            {@const Icon = item.icon}
            <a 
              href={item.href} 
              class="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300
              {isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}"
            >
              <Icon size={20} />
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
    </div>
  </aside>

  <!-- Content Slot -->
  <main class="flex-1 min-w-0 w-full">
    <div class="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 shadow-sm border border-gray-100 min-h-[400px] overflow-hidden">
      {@render children()}
    </div>
  </main>
</div>
