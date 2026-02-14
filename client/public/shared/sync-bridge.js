/**
 * Sync Bridge for Integrated Static Projects
 * Handles data persistence to the main database.
 */
window.SyncService = {
  async syncStockAnalysis(results, portfolioName = "Main Stock") {
    console.log("🔄 Syncing Stock Analysis...", results);
    try {
      const response = await fetch("/api/sync/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, portfolioName }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log("✅ Stock Sync SUCCESS:", data);
      this.showToast("Análisis sincronizado con éxito", "success");
      return data;
    } catch (err) {
      console.error("❌ Stock Sync FAILED:", err);
      this.showToast("Error al sincronizar análisis", "error");
    }
  },

  async syncLPAnalysis(symbol, capital, results) {
    console.log(`🔄 Syncing LP Analysis for ${symbol}...`, results);
    try {
      const response = await fetch("/api/sync/lp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, capital, results }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log("✅ LP Sync SUCCESS");
      this.showToast("Análisis de LP guardado", "success");
      return data;
    } catch (err) {
      console.error("❌ LP Sync FAILED:", err);
      this.showToast("Error al guardar análisis de LP", "error");
    }
  },

  showToast(message, type = "success") {
    // Simple toast implementation or use existing UI if possible
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.background = type === "success" ? "#238636" : "#f85149";
    toast.style.color = "white";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
    toast.style.zIndex = "9999";
    toast.style.transition = "all 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 100);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};
