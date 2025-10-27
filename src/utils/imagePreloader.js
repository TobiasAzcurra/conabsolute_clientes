// utils/imagePreloader.js
class ImagePreloader {
  constructor(maxConcurrent = 4) {
    // ← Reducido de 8 a 4
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.loading = new Set();
    this.loaded = new Set();
    this.failed = new Set();
    this.stats = { total: 0, loaded: 0, failed: 0 };
  }

  preload(urls, priority = "normal") {
    const uniqueUrls = [...new Set(urls)].filter(
      (url) => url && !this.loaded.has(url) && !this.failed.has(url)
    );

    uniqueUrls.forEach((url) => {
      this.queue.push({ url, priority });
    });

    this.stats.total += uniqueUrls.length;
    this.processQueue();
  }

  async processQueue() {
    while (this.loading.size < this.maxConcurrent && this.queue.length > 0) {
      this.queue.sort((a, b) => {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });

      const { url } = this.queue.shift();
      this.loadImage(url);
    }
  }

  async loadImage(url) {
    this.loading.add(url);

    return new Promise((resolve) => {
      const img = new Image();

      const cleanup = () => {
        this.loading.delete(url);
        this.processQueue();
      };

      img.onload = () => {
        this.loaded.add(url);
        this.stats.loaded++;
        console.log(
          `✅ Precargada: ${url.substring(url.lastIndexOf("/") + 1)} (${
            this.stats.loaded
          }/${this.stats.total})`
        );
        cleanup();
        resolve(true);
      };

      img.onerror = () => {
        this.failed.add(url);
        this.stats.failed++;
        console.warn(`❌ Fallo precarga: ${url}`);
        cleanup();
        resolve(false);
      };

      setTimeout(() => {
        if (this.loading.has(url)) {
          this.failed.add(url);
          this.stats.failed++;
          cleanup();
          resolve(false);
        }
      }, 10000);

      img.src = url;
    });
  }

  getStats() {
    return {
      ...this.stats,
      loading: this.loading.size,
      successRate:
        this.stats.total > 0
          ? ((this.stats.loaded / this.stats.total) * 100).toFixed(1)
          : 0,
    };
  }

  reset() {
    this.queue = [];
    this.loading.clear();
    this.loaded.clear();
    this.failed.clear();
    this.stats = { total: 0, loaded: 0, failed: 0 };
  }
}

export const preloader = new ImagePreloader(4);
