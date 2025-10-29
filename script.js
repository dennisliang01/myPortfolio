function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

// Automatically update the copyright year
function updateCopyrightYear() {
    const yearElement = document.getElementById('current-year');
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
        this.galleryContainer = document.getElementById('photoGallery');
        
        // Only initialize if gallery container exists (on beyondWork.html page)
        if (this.galleryContainer) {
            await this.loadGallery();
            this.initializeModal();
        }
    }
    
    async loadGallery() {
        try {
            const response = await fetch('./assets/gallery-data.json');
            const data = await response.json();
            
            // Clear existing content
            this.galleryContainer.innerHTML = '';
            
            // Create gallery items from JSON data
            data.images.forEach(image => {
                const figure = this.createGalleryItem(image);
                this.galleryContainer.appendChild(figure);
            });
            
        } catch (error) {
            console.error('Error loading gallery data:', error);
            this.galleryContainer.innerHTML = '<p>Error loading gallery. Please try again later.</p>';
        }
    }

    createGalleryItem(image) {
        const figure = document.createElement('figure');
        figure.innerHTML = `
            <img src="${image.path}" alt="${image.alt}" data-id="${image.id}" loading="lazy">
            <figcaption>
                <h3>${image.title}</h3>
                <p>${image.description}</p>
            </figcaption>
        `;
        return figure;
    }

    initializeModal() {
        this.modal = document.getElementById('imageModal');
        this.modalImg = document.getElementById('modalImage');
        this.modalCaption = document.getElementById('modalCaption');
        this.closeBtn = document.getElementById('closeModal');

        if (!this.modal) return;

        this.bindModalEvents();
    }

    bindModalEvents() {
        // Add click event to all gallery images
        const galleryImages = document.querySelectorAll('.gallery img');
        galleryImages.forEach(img => {
            img.addEventListener('click', (e) => this.openModal(e.target));
        });

        // Close modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    openModal(imgElement) {
        this.modal.style.display = 'block';
        this.modalImg.src = imgElement.src;
        this.modalImg.alt = imgElement.alt;
        
        // Get caption from the figcaption element
        const figure = imgElement.closest('figure');
        const figcaption = figure.querySelector('figcaption');
        
        if (figcaption) {
            const title = figcaption.querySelector('h3')?.textContent || '';
            const description = figcaption.querySelector('p')?.textContent || '';
            this.modalCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
        } else {
            this.modalCaption.innerHTML = imgElement.alt;
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateCopyrightYear();
    new PhotoGallery();
});
