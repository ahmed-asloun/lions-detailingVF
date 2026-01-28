// ===================================
// MOBILE MENU FUNCTIONALITY
// ===================================

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
});

const mobileLinks = document.querySelectorAll('.mobile-menu-links a');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// ===================================
// SCROLL ANIMATIONS
// ===================================

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

// ===================================
// PACKAGE SELECTION FUNCTION
// ===================================

function selectPackage(packageName) {
    document.getElementById('message').value =
        `I'm interested in the ${packageName}. Please contact me to schedule an appointment.`;

    document.querySelector('#contact').scrollIntoView({
        behavior: 'smooth'
    });
}

// ===================================
// CONTACT FORM SUBMISSION (GOOGLE FORMS)
// ===================================

function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = encodeURIComponent(document.getElementById("name").value);
        const email = encodeURIComponent(document.getElementById("email").value);
        const phone = encodeURIComponent(document.getElementById("phone").value || "");
        const company = encodeURIComponent(document.getElementById("company").value || "");
        const message = encodeURIComponent(document.getElementById("message").value);

        // Replace entry.X with your Google Form field entry IDs
        const googleFormURL =
            `https://docs.google.com/forms/d/e/1FAIpQLSdrl0y5oTtbkzKgPAVgMzqfgpa1iLvSZmfgpTDkhG6GwEHdZw/formResponse?usp=pp_url&entry.1696071945=${name}&entry.1554818105=${email}&entry.873400004=${phone}&entry.1067544475=${company}&entry.1548694298=${message}`;

        fetch(googleFormURL, { method: "POST", mode: "no-cors" })
            .then(() => {
                const status = document.getElementById("formStatus");
                if (status) status.textContent = "Thank you! We’ll get back to you shortly.";
                contactForm.reset();
            })
            .catch(() => {
                const status = document.getElementById("formStatus");
                if (status) status.textContent = "Something went wrong. Please try again.";
            });
    });
}
initContactForm();

// ===================================
// LIGHTBOX (shared for Our Work + Package images)
// ===================================

(function initSharedLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const imgEl = document.getElementById("lightboxImage");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  // Keep one "active list" at a time (gallery OR package drawer)
  let activeList = [];
  let currentIndex = 0;

  function lockScroll() {
    document.body.style.overflow = "hidden";
  }

  function unlockScroll() {
    document.body.style.overflow = "";
  }

  function render(index) {
    if (!activeList.length) return;
    currentIndex = ((index % activeList.length) + activeList.length) % activeList.length;

    const src = activeList[currentIndex];
    imgEl.src = src;
    imgEl.alt = "";
  }

  function open(list, startIndex = 0) {
    activeList = Array.isArray(list) ? list.filter(Boolean) : [];
    if (!activeList.length) return;

    render(startIndex);
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    lockScroll();
  }

  function close() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    unlockScroll();
    imgEl.src = "";
    activeList = [];
    currentIndex = 0;
  }

  function prev() {
    if (!activeList.length) return;
    render(currentIndex - 1);
  }

  function next() {
    if (!activeList.length) return;
    render(currentIndex + 1);
  }

  // Expose API so package drawer can reuse this lightbox
  window.Lightbox = { open, close };

  // Our Work (gallery) images
  const galleryImgs = Array.from(document.querySelectorAll('[data-lightbox="gallery"]'));
  const galleryList = galleryImgs.map((img) => img.getAttribute("src")).filter(Boolean);

  galleryImgs.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => {
      const src = img.getAttribute("src");
      const idx = Math.max(0, galleryList.indexOf(src));
      open(galleryList, idx);
    });
  });

  // Controls
  closeBtn?.addEventListener("click", close);
  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // Click outside image closes
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
})();


// ===================================
// PACKAGE DETAILS DRAWER (DETAILS BUTTON)
// Supports:
// - data-details-steps="a|b|c"  -> renders checklist
// - data-details-images="path1|path2" -> renders image grid (click opens image)
// ===================================

(function initPackageDetailsDrawer() {
    const drawer = document.getElementById('pkgDrawer');
    if (!drawer) return;

    const titleEl = document.getElementById('pkgDrawerTitle');
    const priceEl = document.getElementById('pkgDrawerPrice');
    const hintEl = document.getElementById('pkgDrawerHint');
    const listEl = document.getElementById('pkgDrawerList');
    const galleryEl = document.getElementById('pkgDrawerGallery');
    const ctaBtn = document.getElementById('pkgDrawerCta');

    let lastFocused = null;

    function parsePipeList(raw) {
        return String(raw || '')
            .split('|')
            .map(s => s.trim())
            .filter(Boolean);
    }

    function lockScroll() {
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.overflow = '';
    }

    function setSteps(steps) {
        listEl.innerHTML = '';
        if (!steps.length) {
            const li = document.createElement('li');
            li.textContent = 'Details coming soon';
            listEl.appendChild(li);
            return;
        }
        steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            listEl.appendChild(li);
        });
    }

    function setGallery(images) {
      if (!galleryEl) return;
      galleryEl.innerHTML = "";

      if (!images.length) {
        galleryEl.hidden = true;
        return;
      }

      images.forEach((src, idx) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Beispiel unserer Arbeit";
        img.loading = "lazy";
        img.style.cursor = "zoom-in";

      img.addEventListener("click", (e) => {
        e.preventDefault();

        // 1) close the package drawer so it doesn't stay visible
        closeDrawer();

        // 2) open the lightbox after the drawer starts closing (smooth UX)
        setTimeout(() => {
          if (window.Lightbox && typeof window.Lightbox.open === "function") {
            window.Lightbox.open(images, idx);
          }
        }, 120);
      });


        galleryEl.appendChild(img);
      });

      galleryEl.hidden = false;
    }


    function openDrawer(btn) {
        lastFocused = document.activeElement;

        const title = btn.getAttribute('data-details-title') || 'Paket';
        const price = btn.getAttribute('data-details-price') || '';

        const images = parsePipeList(btn.getAttribute('data-details-images'));
        const steps = parsePipeList(btn.getAttribute('data-details-steps'));

        titleEl.textContent = title;
        priceEl.textContent = price;

        // reset state
        listEl.style.display = '';
        setGallery([]);

        // Image mode (preferred if images exist)
        if (images.length) {
            if (hintEl) hintEl.textContent = 'Beispiele unserer Arbeit:';
            setGallery(images);
            listEl.innerHTML = '';
            listEl.style.display = 'none';
        } else {
            if (hintEl) hintEl.textContent = 'Was enthalten ist:';
            listEl.style.display = '';
            setSteps(steps);
        }

        ctaBtn.onclick = () => {
            if (typeof selectPackage === 'function') {
                selectPackage(`${title} (${price})`);
            }
            closeDrawer();
        };

        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        lockScroll();

        const closeBtn = drawer.querySelector('[data-pkg-close]');
        if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        unlockScroll();

        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    document.addEventListener('click', (e) => {
        const detailsBtn = e.target.closest('.btn-details');
        if (detailsBtn) {
            e.preventDefault();
            openDrawer(detailsBtn);
            return;
        }

        if (e.target.matches('[data-pkg-close]') || e.target.closest('[data-pkg-close]')) {
            e.preventDefault();
            closeDrawer();
            return;
        }

        if (e.target.classList && e.target.classList.contains('pkg-drawer__backdrop')) {
            closeDrawer();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!drawer.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeDrawer();
    });
})();

/* =========================================================
   Reuse the existing Our Work lightbox for popup images
   ========================================================= */
(function () {
  // Helper: collect image srcs from popup gallery and open same lightbox
  function enablePopupImagesLightbox() {
    // Change selector if your popup images container has a different class
    const popupGalleries = document.querySelectorAll(
      ".details-images, .package-details-images, .details-gallery, .popup-gallery"
    );

    popupGalleries.forEach((gallery) => {
      const imgs = Array.from(gallery.querySelectorAll("img"));
      if (!imgs.length) return;

      const srcList = imgs
        .map((img) => img.getAttribute("src"))
        .filter(Boolean);

      imgs.forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", (e) => {
          e.preventDefault();

          // If the existing lightbox opener exists, use it
          if (typeof window.openLightbox === "function") {
            const clickedSrc = img.getAttribute("src");
            const startIndex = Math.max(0, srcList.indexOf(clickedSrc));
            window.openLightbox(srcList, startIndex);
          }
        });
      });
    });
  }

  // Run now + also after opening the package popup
  document.addEventListener("DOMContentLoaded", enablePopupImagesLightbox);

  // If your popup is injected dynamically, this re-runs after any click on "DETAILS"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-details, [data-details-images]");
    if (!btn) return;

    // Wait for popup DOM to render
    setTimeout(enablePopupImagesLightbox, 50);
  });
})();


// ===================================
// GOOGLE FORMS – FORM HANDLER (WORKING)
// Uses your PREFILLED LINK entry IDs + redirects to thank-you.html
// ===================================

(function initGoogleFormsHandler() {
  const form = document.getElementById("contactForm"); // ✅ matches index.html
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formAction =
      "https://docs.google.com/forms/d/e/1FAIpQLSezHCoOIUMbGSFOwUfbqzGQWf1Oq7X1NHffAuyYCeBTh3i4Tg/formResponse";

    // Build form payload using YOUR entry IDs (from your prefilled link)
    const payload = new FormData();
    payload.append("entry.551890527", form.elements["name"]?.value || "");      // name
    payload.append("entry.1876424960", form.elements["email"]?.value || "");    // email
    payload.append("entry.1058534029", form.elements["phone"]?.value || "");    // phone
    payload.append("entry.1561924556", form.elements["vehicle"]?.value || "");  // vehicle
    payload.append("entry.1977724755", form.elements["message"]?.value || "");  // message

    // Optional UI status text
    const statusEl = document.getElementById("formStatus");
    if (statusEl) statusEl.textContent = "Sending…";

    // Best-effort submit (no-cors means we can't read success response)
    fetch(formAction, {
      method: "POST",
      mode: "no-cors",
      body: payload,
    }).catch(() => {
      // We'll still redirect; no-cors hides most errors anyway
    });

    // ✅ Redirect reliably (do NOT wait on fetch, because no-cors is opaque)
    setTimeout(() => {
      window.location.href = "thank-you.html?from=form";
    }, 350);
  });
})();
