(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".sidebar");
  const menuToggle = document.querySelector(".mobile-nav-toggle");
  const navigation = document.querySelector("#navigation-panel");
  const navLinks = [...document.querySelectorAll(".nav-link")];

  function closeMenu(returnFocus = false) {
    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    if (returnFocus) menuToggle.focus();
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("menu-open")) closeMenu(true);
  });
  header.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      if (!header.contains(document.activeElement)) closeMenu();
    });
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", () => closeMenu());

  // Highlight the section at the reader's current position, including deep links.
  const sections = navLinks.map((link) => document.querySelector(link.hash));
  let scrollScheduled = false;
  function updateNavigation() {
    const position = window.scrollY + (window.innerWidth <= 760 ? 120 : 180);
    let current = sections[0];
    for (const section of sections) {
      if (section.offsetTop <= position) current = section;
    }
    navLinks.forEach((link) => {
      const active = link.hash === `#${current.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scrollScheduled = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });
  window.addEventListener("resize", updateNavigation);
  updateNavigation();

  const clock = document.querySelector("#clock");
  const torontoTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", hour12: true,
  });
  function updateClock() {
    const now = new Date();
    clock.textContent = torontoTime.format(now).toUpperCase();
    clock.dateTime = now.toISOString();
  }
  updateClock();
  setInterval(updateClock, 30000);
  document.querySelector("#year").textContent = new Date().getFullYear();

  // Only opt into reveal effects when the browser can observe them.
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    document.body.classList.add("motion-ready");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 24px 0px" });
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        document.body.classList.remove("motion-ready");
        revealObserver.disconnect();
      }
    });
  }

  const typedWord = document.querySelector(".typed-word");
  const words = ["projects.", "interests.", "creativity."];
  let wordIndex = 0;
  let characterIndex = words[0].length;
  let deleting = true;
  let typeTimer;
  function typeNextCharacter() {
    if (reducedMotion.matches || document.hidden) return;
    const word = words[wordIndex];
    characterIndex += deleting ? -1 : 1;
    typedWord.textContent = word.slice(0, characterIndex);
    let delay = deleting ? 48 : 95;
    if (characterIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 260;
    } else if (characterIndex === word.length && !deleting) {
      deleting = true;
      delay = 2600;
    }
    typeTimer = setTimeout(typeNextCharacter, delay);
  }
  if (!reducedMotion.matches) typeTimer = setTimeout(typeNextCharacter, 3000);
  reducedMotion.addEventListener("change", () => {
    clearTimeout(typeTimer);
    typedWord.textContent = words[0];
    wordIndex = 0;
    characterIndex = words[0].length;
    deleting = true;
    if (!reducedMotion.matches) typeTimer = setTimeout(typeNextCharacter, 3000);
  });
  document.addEventListener("visibilitychange", () => {
    clearTimeout(typeTimer);
    if (!document.hidden && !reducedMotion.matches) typeTimer = setTimeout(typeNextCharacter, 1500);
  });

  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const cards = [...document.querySelectorAll(".project-card")];
  const filterStatus = document.querySelector("#filter-status");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      cards.forEach((card) => {
        const visible = filter === "all" || card.dataset.categories.split(" ").includes(filter);
        card.hidden = !visible;
        card.classList.remove("filter-enter");
        if (visible) {
          card.classList.add("is-visible");
          card.style.animationDelay = `${Math.min(visibleCount, 5) * 35}ms`;
          visibleCount++;
        }
      });
      requestAnimationFrame(() => {
        cards.filter((card) => !card.hidden).forEach((card) => card.classList.add("filter-enter"));
      });
      filterStatus.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? "project" : "projects"}${filter === "all" ? "." : ` in ${button.textContent.trim()}.`}`;
    });
  });

  const projectDescriptions = {
    edify: { title: "Edify", description: "An AI-driven learning platform built with my team at UNHack 2023, tailored to different learning styles. Our project placed in the top 8 of over 150 teams, won our cohort, and received the People's Choice Award.", original: "edifydesc.png" },
    notes: { title: "The Notes Website", description: "A collaborative notes website I started with friends, designed to make complex topics easier to understand. The idea is simple: thoughtful summaries, essential concepts, and clearer study materials.", original: "notes_desc.png" },
    data: { title: "Data Analytics", description: "A project developed through Google's Data Analytics course on Coursera, exploring how Excel, SQL, and other analysis tools can turn raw data into useful insights.", original: "dadesc.png" },
    games: { title: "Game Development", description: "Small 2D games made as a hobby and a way to explore game development. A collection of experiments in playful programming, with more to learn and build along the way.", original: "gdesc.png" },
    web: { title: "Web Development", description: "My exploration of frontend development and web design, including this portfolio, my personal websites, and an expanded CV. Each site is another opportunity to learn through making.", original: "wdesc.png" },
    hackathons: { title: "Hackathons", description: "Projects and collaborations from E2E Encrypted Everything @Hack, CalHacks, McHacks, the Jarvis Ambassador Hackathon, and UNHack. A chance to meet people, try ideas, and create something together under a deadline.", original: "hcdes.png" },
    experiments: { title: "Coding Projects", description: "Smaller projects built to learn new languages and ideas, from calculators to exploring the MERN stack. A growing collection of the little things that help me become a better builder.", original: "bc.png" },
    marketing: { title: "Digital Marketing", description: "An interest that took me beyond code and into digital marketing. My experience includes a digital marketing role and certifications, with more details on LinkedIn.", original: "mcdes.png" },
    ai: { title: "AI & Machine Learning", description: "A space for my interest in artificial intelligence and machine learning. This part of my portfolio captures an area I want to keep exploring through projects and research.", original: "mldes.png" },
    photography: { title: "Photography", description: "A collection inspired by my love for taking and editing photographs. A small home for the moments and perspectives I want to capture and share.", original: "picdes.png" },
    onepiece: { title: "A Guide to One Piece", description: "A beginner's guide to One Piece, created as the resource I wish I'd had before starting the anime. A personal project bringing a favourite interest to the web.", original: "opdes.png" },
    fitness: { title: "Fitness & Calorie Calculator", description: "A website inspired by my interest in fitness, with a calorie calculator, answers to common fitness questions, and sample workouts organised by muscle group.", original: "gymdes.png" },
  };
  const dialog = document.querySelector("#project-dialog");
  let dialogTrigger;
  document.querySelectorAll(".project-details").forEach((button) => {
    button.addEventListener("click", () => {
      const project = projectDescriptions[button.dataset.project];
      const card = button.closest(".project-card");
      const image = card.querySelector("img");
      document.querySelector("#dialog-title").textContent = project.title;
      document.querySelector("#dialog-description").textContent = project.description;
      document.querySelector("#dialog-category").textContent = card.querySelector(".project-category").textContent;
      document.querySelector("#dialog-image").src = image.src;
      document.querySelector("#dialog-image").alt = image.alt;
      document.querySelector("#dialog-link").href = card.querySelector("h3 a").href;
      document.querySelector("#dialog-original").href = `assets/img/${project.original}`;
      dialogTrigger = button;
      dialog.showModal();
      dialog.scrollTop = 0;
    });
  });
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => dialogTrigger?.focus({ preventScroll: true }));
})();
