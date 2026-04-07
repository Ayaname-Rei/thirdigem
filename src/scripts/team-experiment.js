function initReveal() {
  const elements = document.querySelectorAll('.cx-layout-page .reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
  );

  elements.forEach((element) => observer.observe(element));
}

function initExperimentPage() {
  const root = document.querySelector('[data-cx-experiment-root]');
  if (!root) return;

  const sidebar = root.querySelector('[data-experiment-sidebar]');
  const startTrigger = root.querySelector('[data-experiment-content-start]');
  const footer = document.querySelector('.igem-footer') || document.getElementById('contact-footer');
  const sectionLinks = Array.from(root.querySelectorAll('[data-exp-nav-link]'));
  const sections = Array.from(root.querySelectorAll('[data-exp-section]'));
  const cycleTabGroups = Array.from(root.querySelectorAll('[data-cycle-tabs]'));

  const headerHeight = () => {
    const header = document.querySelector('.header');
    return header ? header.getBoundingClientRect().height : 80;
  };

  if (sidebar && startTrigger) {
    let ticking = false;

    const updateSidebarVisibility = () => {
      const offset = headerHeight() + 28;
      const startReached = startTrigger.getBoundingClientRect().top <= offset;
      const footerVisible = footer ? footer.getBoundingClientRect().top <= window.innerHeight - 60 : false;
      sidebar.classList.toggle('is-visible', startReached && !footerVisible);
      ticking = false;
    };

    const requestSidebarUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateSidebarVisibility);
    };

    updateSidebarVisibility();
    window.addEventListener('scroll', requestSidebarUpdate, { passive: true });
    window.addEventListener('resize', requestSidebarUpdate);
  }

  if (sectionLinks.length && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible || !visible.target || !visible.target.id) return;
        const id = `#${visible.target.id}`;
        sectionLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      },
      {
        rootMargin: `-${headerHeight() + 90}px 0px -55% 0px`,
        threshold: [0.12, 0.25, 0.45, 0.7]
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));

    sectionLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const target = root.querySelector(href);
        if (!(target instanceof HTMLElement)) return;

        event.preventDefault();
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 22;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });

        if (history.replaceState) {
          history.replaceState(null, '', href);
        }

        sectionLinks.forEach((item) => {
          item.classList.toggle('is-active', item === link);
        });
      });
    });
  }

  cycleTabGroups.forEach((group) => {
    const tabs = Array.from(group.querySelectorAll('[data-cycle-tab]'));
    const panels = tabs
      .map((tab) => {
        const id = tab.getAttribute('href')?.replace('#', '');
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    if (!tabs.length || !panels.length) return;

    const activateById = (id, options = {}) => {
      const { updateHash = false } = options;

      tabs.forEach((tab) => {
        const isActive = tab.getAttribute('href') === `#${id}`;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isActive = panel.id === id;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      if (updateHash && history.replaceState) {
        history.replaceState(null, '', `#${id}`);
      }
    };

    const hashId = window.location.hash ? window.location.hash.replace('#', '') : '';
    const initialActiveId = panels.some((panel) => panel.id === hashId)
      ? hashId
      : panels.find((panel) => panel.classList.contains('is-active'))?.id || panels[0]?.id;

    if (initialActiveId) {
      activateById(initialActiveId);
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        const id = tab.getAttribute('href')?.replace('#', '');
        if (id) activateById(id, { updateHash: true });
      });
    });

    window.addEventListener('hashchange', () => {
      const id = window.location.hash.replace('#', '');
      if (id && panels.some((panel) => panel.id === id)) {
        activateById(id);
      }
    });
  });
}

function init() {
  initReveal();
  initExperimentPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
