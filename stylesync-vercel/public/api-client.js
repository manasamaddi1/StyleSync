// Frontend helpers — talk to the Next.js API routes.
// Drop this into public/ as `api-client.js` and load it from index.html
// BEFORE prod.jsx. It exposes window.SS_API.

(function () {
  async function jsonFetch(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${url} → ${res.status} ${body}`);
    }
    return res.json();
  }

  window.SS_API = {
    // Wardrobe
    async getWardrobe() {
      const { wardrobe } = await jsonFetch('/api/wardrobe');
      return wardrobe || [];
    },
    async addWardrobeItem(item) {
      const { item: saved } = await jsonFetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return saved;
    },
    async deleteWardrobeItem(id) {
      return jsonFetch(`/api/wardrobe/${id}`, { method: 'DELETE' });
    },
    async updateWardrobeItem(id, patch) {
      const { item } = await jsonFetch(`/api/wardrobe/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return item;
    },

    // Saved outfits
    async getOutfits() {
      const { outfits } = await jsonFetch('/api/outfits');
      return outfits || [];
    },
    async addOutfit(outfit) {
      const { outfit: saved } = await jsonFetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outfit),
      });
      return saved;
    },
    async deleteOutfit(id) {
      return jsonFetch(`/api/outfits/${id}`, { method: 'DELETE' });
    },

    // ML
    async predict(imageBlob) {
      const fd = new FormData();
      fd.append('image', imageBlob);
      const { prediction } = await jsonFetch('/api/predict', {
        method: 'POST',
        body: fd,
      });
      return prediction;
    },

    // Image upload (returns CDN URL)
    async uploadImage(file) {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await jsonFetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      return url;
    },
  };
})();
