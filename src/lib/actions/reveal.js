export function reveal(node, { delay = 0 } = {}) {
  node.classList.add("gravity-hidden");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Gunakan isIntersecting agar animasi jalan saat masuk layar
        if (entry.isIntersecting) {
          node.style.transitionDelay = `${delay}ms`;

          node.classList.remove("gravity-hidden");
          node.classList.add("gravity-visible");

          // Tambahkan efek floating setelah animasi masuk selesai
          setTimeout(() => {
            // Cek apakah masih visible agar tidak numpuk
            if (node.classList.contains("gravity-visible")) {
              node.classList.add("float-continuous");
            }
          }, 1200 + delay);
        } else {
          // Reset animasi saat elemen keluar layar (biar bisa replay)
          node.style.transitionDelay = "0ms";
          node.classList.remove("gravity-visible", "float-continuous");
          node.classList.add("gravity-hidden");
        }
      });
    },
    { threshold: 0.2 },
  ); // Ganti jadi 0.2 (20% elemen harus masuk dulu baru animasi)

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
