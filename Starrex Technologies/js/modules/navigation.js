/* Accessible shared navigation for the homepage and contact page. */
export function initNavigation() {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const menu = document.querySelector("#mobile-navigation");
  if (!toggle || !menu) return;

  const menuLinks = [...menu.querySelectorAll("a")];
  const sectionLinks = [
    ...document.querySelectorAll(
      'nav .desktop-nav-links a[href^="#"], nav .mobile-navigation a[href^="#"]'
    ),
  ];

  const closeMenu = ({ restoreFocus = false } = {}) => {
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");

    if (restoreFocus && wasOpen) toggle.focus();
  };

  const openMenu = () => {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
    menuLinks[0]?.focus();
  };

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuLinks.forEach(link => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("click", event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu({ restoreFocus: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });

  /* Mark the homepage section currently occupying the main reading area. */
  const observedSections = sectionLinks
    .map(link => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && observedSections.length) {
    const observer = new IntersectionObserver(
      entries => {
        const visibleEntry = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const activeId = visibleEntry.target.id;

        sectionLinks.forEach(link => {
          const isActive = link.getAttribute("href") === `#${activeId}`;
          link.classList.toggle("active", isActive);

          if (isActive) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0, 0.15, 0.35, 0.6],
      }
    );

    observedSections.forEach(section => observer.observe(section));
  }
}
