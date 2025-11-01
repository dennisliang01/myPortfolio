function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

// Automatically update the copyright year
function updateCopyrightYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Gallery functionality
class PhotoGallery {
  constructor() {
    this.modal = null;
    this.modalImg = null;
    this.modalCaption = null;
    this.closeBtn = null;
    this.galleryContainer = null;
    this.init();
  }

  async init() {
    this.galleryContainer = document.getElementById("photoGallery");

    // Only initialize if gallery container exists (on beyondWork.html page)
    if (this.galleryContainer) {
      // Prepare observers for responsive Masonry updates
      if ('ResizeObserver' in window && !this._figureObserver) {
        this._figureObserver = new ResizeObserver(() => this.requestMasonryUpdate());
      }

      await this.loadGallery();
      this.initializeModal();
    }
  }

  async loadGallery() {
    try {
      const response = await fetch("./assets/gallery-data.json");
      const data = await response.json();

      // Clear existing content
      this.galleryContainer.innerHTML = "";

      // Create gallery items from JSON data (leave all as-is)
      data.images.forEach((image) => {
        const figure = this.createGalleryItem(image);
        this.galleryContainer.appendChild(figure);

        // Observe each figure so we recompute spans when its size changes
        if (this._figureObserver) {
          this._figureObserver.observe(figure);
        }

        // Recalculate masonry when each image loads
        const img = figure.querySelector("img");
        if (img) {
          if (img.complete) {
            this.requestMasonryUpdate();
          } else {
            img.addEventListener("load", () => this.requestMasonryUpdate(), { once: true });
            img.addEventListener("error", () => this.requestMasonryUpdate(), { once: true });
          }
        }
      });

      // Initial pass (in case images are cached)
      this.requestMasonryUpdate();
      // Mark as ready for any CSS that depends on layout being measured
      this.galleryContainer.classList.add('masonry-ready');
      window.addEventListener("resize", () => this.requestMasonryUpdate());
    } catch (error) {
      console.error("Error loading gallery data:", error);
      this.galleryContainer.innerHTML =
        "<p>Error loading gallery. Please try again later.</p>";
    }
  }

  createGalleryItem(image) {
    const figure = document.createElement("figure");
    figure.innerHTML = `
            <img src="${image.path}" alt="${image.alt}" data-id="${image.id}" loading="lazy">
            <figcaption>
                <h3>${image.title}</h3>
                <p>${image.description}</p>
            </figcaption>
        `;
    return figure;
  }

  // Masonry layout helpers (scoped to the photo gallery)
  requestMasonryUpdate() {
    clearTimeout(this._masonryTimer);
    this._masonryTimer = setTimeout(() => this.applyMasonry(), 50);
  }

  applyMasonry() {
    if (!this.galleryContainer) return;
    const grid = this.galleryContainer;
    const style = window.getComputedStyle(grid);
    const rowHeight = parseFloat(style.getPropertyValue("grid-auto-rows")) || 8;
    const rowGap = parseFloat(style.getPropertyValue("row-gap")) || 12;

    grid.querySelectorAll("figure").forEach((item) => {
      item.style.gridRowEnd = "span 1"; // reset before measuring
      const height = item.getBoundingClientRect().height;
      // Add a small fudge factor to avoid underestimation rounding at large widths
      const span = Math.ceil((height + rowGap + 1) / (rowHeight + rowGap));
      item.style.gridRowEnd = `span ${span}`;
    });
  }

  initializeModal() {
    this.modal = document.getElementById("imageModal");
    this.modalImg = document.getElementById("modalImage");
    this.modalCaption = document.getElementById("modalCaption");
    this.closeBtn = document.getElementById("closeModal");

    if (!this.modal) return;

    this.bindModalEvents();
  }

  bindModalEvents() {
    // Add click event to all gallery images
    const galleryImages = document.querySelectorAll(".gallery img");
    galleryImages.forEach((img) => {
      img.addEventListener("click", (e) => this.openModal(e.target));
    });

    // Close modal events
    this.closeBtn.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.style.display === "block") {
        this.closeModal();
      }
    });
  }

  openModal(imgElement) {
    this.modal.style.display = "block";
    this.modalImg.src = imgElement.src;
    this.modalImg.alt = imgElement.alt;

    // Get caption from the figcaption element
    const figure = imgElement.closest("figure");
    const figcaption = figure.querySelector("figcaption");

    if (figcaption) {
      const title = figcaption.querySelector("h3")?.textContent || "";
      const description = figcaption.querySelector("p")?.textContent || "";
      this.modalCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    } else {
      this.modalCaption.innerHTML = imgElement.alt;
    }
  }

  closeModal() {
    this.modal.style.display = "none";
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  updateCopyrightYear();
  new PhotoGallery();
  new CyclingCarousel();
  setupProjectThumbnails();
});

// Setup blurred background for project thumbnails
function setupProjectThumbnails() {
  const projectThumbs = document.querySelectorAll(".project-thumb");

  projectThumbs.forEach((img) => {
    // Create wrapper div
    const wrapper = document.createElement("div");
    wrapper.className = "project-thumb-wrapper";

    // Set the background image for the blur effect
    wrapper.style.setProperty("--bg-image", `url('${img.src}')`);

    // Insert wrapper before the image
    img.parentNode.insertBefore(wrapper, img);

    // Move image inside wrapper
    wrapper.appendChild(img);
  });
}

// Cycling carousel
class CyclingCarousel {
  constructor() {
    this.container = document.getElementById("cyclingCarousel");
    this.track = document.getElementById("cyclingTrack");
    this.prevBtn = document.getElementById("cyclingPrev");
    this.nextBtn = document.getElementById("cyclingNext");
    this.items = [];
    this.index = 0;
    this.timer = null;
    this.autoMs = 4000; // auto-advance interval
    if (this.container && this.track) {
      // Make container focusable for keyboard support without HTML change
      if (!this.container.hasAttribute("tabindex")) {
        this.container.setAttribute("tabindex", "0");
      }
      this.init();
    }
  }
  async init() {
    try {
      const response = await fetch("./assets/cycling-gallery.json");
      const data = await response.json();
      const cycling = Array.isArray(data.images) ? data.images : [];

      // Render items
      this.track.innerHTML = "";
      cycling.forEach((image) => {
        const item = document.createElement("div");
        item.className = "carousel-item";
        item.innerHTML = `
          <figure class="blur-bg" style="--bg-image: url('${image.path}')">
            <img src="${image.path}" alt="${image.alt || ''}" data-title="${image.title || ''}" data-desc="${image.description || ''}" loading="lazy" />
            <figcaption>
              <h3>${image.title || ''}</h3>
              <p>${image.description || ''}</p>
            </figcaption>
          </figure>
        `;
        this.track.appendChild(item);
      });

      this.items = Array.from(this.track.children);
      if (this.items.length === 0) {
        this.showPlaceholder();
        return;
      }
      this.update();
      this.bind();
      this.enableModalOnItems();
      if (this.items.length > 1 && !this.prefersReducedMotion()) {
        this.startAuto();
      }
    } catch (e) {
      console.error("Error loading cycling data:", e);
      this.showPlaceholder();
    }
  }

  showPlaceholder() {
    if (this.prevBtn) this.prevBtn.style.display = "none";
    if (this.nextBtn) this.nextBtn.style.display = "none";
    if (this.track) this.track.innerHTML = "";
    if (this.container && !this.container.querySelector('.cycling-placeholder')) {
      const placeholder = document.createElement("div");
      placeholder.className = 'cycling-placeholder';
      placeholder.style.padding = "1rem";
      placeholder.style.textAlign = "center";
      placeholder.textContent = "Cycling photos coming soon.";
      this.container.appendChild(placeholder);
    }
  }

  bind() {
    if (!this.prevBtn || !this.nextBtn) return;
    this.prevBtn.addEventListener("click", () => this.go(-1));
    this.nextBtn.addEventListener("click", () => this.go(1));
    // Keyboard support
    this.container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.go(-1);
      if (e.key === "ArrowRight") this.go(1);
    });

    // Pause on hover/focus
    this.container.addEventListener("mouseenter", () => this.stopAuto());
    this.container.addEventListener("mouseleave", () => this.startAuto());
    this.container.addEventListener("focusin", () => this.stopAuto());
    this.container.addEventListener("focusout", () => this.startAuto());

    // Pause when tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stopAuto();
      else this.startAuto();
    });
  }

  go(delta) {
    const count = this.items.length;
    if (count <= 1) return;
    this.index = (this.index + delta + count) % count;
    this.update();
    this.restartAuto();
  }

  update() {
    const count = this.items.length;
    const offset = -this.index * 100;
    this.track.style.transform = `translateX(${offset}%)`;
    // Hide controls if not needed
    const showControls = count > 1;
    if (this.prevBtn && this.nextBtn) {
      this.prevBtn.style.display = showControls ? "block" : "none";
      this.nextBtn.style.display = showControls ? "block" : "none";
    }
  }

  enableModalOnItems() {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const modalCaption = document.getElementById("modalCaption");
    const closeBtn = document.getElementById("closeModal");
    if (!modal || !modalImg || !modalCaption || !closeBtn) return;

    this.track.querySelectorAll("img").forEach((img) => {
      img.addEventListener("click", () => {
        modal.style.display = "block";
        modalImg.src = img.src;
        modalImg.alt = img.alt || "";
        const title = img.getAttribute("data-title") || "";
        const desc = img.getAttribute("data-desc") || "";
        modalCaption.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
      });
    });

    closeBtn.addEventListener("click", () => (modal.style.display = "none"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display === "block") {
        modal.style.display = "none";
      }
    });
  }

  startAuto() {
    if (this.items.length <= 1) return;
    if (this.prefersReducedMotion()) return;
    if (this.timer) return;
    this.timer = setInterval(() => this.go(1), this.autoMs);
  }

  stopAuto() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  restartAuto() {
    this.stopAuto();
    this.startAuto();
  }

  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}




