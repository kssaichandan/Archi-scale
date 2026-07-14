// Tab navigation system
export function initTabs() {
    const navItems = document.querySelectorAll('.nav-item, .header-right [data-section]');
    const sections = document.querySelectorAll('.section');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');

    // Create overlay for mobile
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;

            // Update nav
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            if (item.classList.contains('nav-item')) {
                item.classList.add('active');
            }

            // Update sections
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(`section-${sectionId}`);
            if (target) {
                target.classList.add('active');
                // Scroll to top
                document.getElementById('mainContent').scrollTop = 0;
            }

            // Close mobile sidebar
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    });

    // Hamburger menu
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
}
