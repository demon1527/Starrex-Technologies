/* Accessible mobile navigation module. */
export function initNavigation() {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const menu = document.querySelector("#mobile-navigation");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  };
  const openMenu = () => {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
  };

  toggle.addEventListener("click", () => {
    toggle.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu();
  });
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("click", event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
}
