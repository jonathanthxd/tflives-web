/** Pause native CSS frame decorations outside the viewport without changing recipes. */
export function observeCosmeticVisibility(root: HTMLElement = document.body): () => void {
  const frames = new Set<HTMLElement>();
  const property = "--cosmetic-play-state";
  const globalProperty = "--cosmetic-global-play-state";
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) (entry.target as HTMLElement).style.setProperty(property, entry.isIntersecting ? "running" : "paused");
  });
  const visit = (node: Node, adding: boolean) => {
    if (!(node instanceof HTMLElement)) return;
    const items = [...node.querySelectorAll<HTMLElement>(".cosmetic-avatar-frame")];
    if (node.matches(".cosmetic-avatar-frame")) items.push(node);
    for (const frame of items) {
      if (adding && !frames.has(frame)) { frames.add(frame); frame.style.setProperty(property, "paused"); observer.observe(frame); }
      if (!adding && frames.delete(frame)) { observer.unobserve(frame); frame.style.removeProperty(property); }
    }
  };
  const updateVisibility = () => {
    if (document.hidden) root.style.setProperty(globalProperty, "paused");
    else root.style.removeProperty(globalProperty);
  };
  visit(root, true);
  updateVisibility();
  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      record.removedNodes.forEach((node) => visit(node, false));
      record.addedNodes.forEach((node) => visit(node, true));
    }
  });
  mutations.observe(root, { childList: true, subtree: true });
  document.addEventListener("visibilitychange", updateVisibility);
  return () => {
    observer.disconnect(); mutations.disconnect();
    document.removeEventListener("visibilitychange", updateVisibility);
    root.style.removeProperty(globalProperty);
    frames.forEach((frame) => frame.style.removeProperty(property));
    frames.clear();
  };
}
