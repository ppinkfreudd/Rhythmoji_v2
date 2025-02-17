document.addEventListener('DOMContentLoaded', function() {
    const dynamicContent = document.getElementById('dynamic-content');
    
    // Add click event listeners to navigation links
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Link clicked:', this.getAttribute('href')); // Debug line
            const path = this.getAttribute('href');
            
            // If it's the home link, reload the page
            if (path === '/') {
                window.location.href = '/';
                return;
            }
            
            // Prevent default for all other links
            e.preventDefault();
            
            // Fetch the content
            fetch(path)
                .then(response => {
                    console.log('Response received:', response.status); // Debug line
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const content = doc.getElementById('about');
                    
                    if (content) {
                        // Clear existing content
                        dynamicContent.innerHTML = '';
                        // Add the new content
                        dynamicContent.appendChild(content.cloneNode(true));
                        
                        // Initialize accordion functionality if it exists
                        const accordions = dynamicContent.getElementsByClassName('accordion');
                        Array.from(accordions).forEach(accordion => {
                            accordion.addEventListener('click', function() {
                                this.classList.toggle('active');
                                const panel = this.nextElementSibling;
                                if (panel.style.maxHeight) {
                                    panel.style.maxHeight = null;
                                } else {
                                    panel.style.maxHeight = panel.scrollHeight + "px";
                                }
                            });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading content:', error);
                });
        });
    });
});

function showHome() {
    document.getElementById('about-section').style.display = 'none';
    document.querySelectorAll('.swiper-container').forEach(container => {
        container.style.display = 'block';
    });
}

function showAbout() {
    document.getElementById('about-section').style.display = 'flex';
    document.querySelectorAll('.swiper-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Initialize warp background when about is shown
    const aboutSection = document.getElementById('about-section');
    new WarpBackground(aboutSection, {
        perspective: 100,
        beamsPerSide: 3,
        beamSize: 5,
        beamDelayMax: 3,
        beamDelayMin: 0,
        beamDuration: 3,
        gridColor: 'hsl(var(--border, 215 16% 47%))'
    });
}

// Show home by default when page loads
document.addEventListener('DOMContentLoaded', function() {
    showHome();
});
