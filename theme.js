// Theme Management Logic
// Runs immediately to prevent FOUC (Flash of Unstyled Content)

const initTheme = () => {
    const savedTheme = localStorage.getItem('TB_THEME');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to light if no saved theme, or use saved theme
    const themeToApply = savedTheme || (prefersDark ? 'dark' : 'light');
    
    if (themeToApply === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    return themeToApply;
};

// Apply immediately on load
const currentTheme = initTheme();

// Toggle function for the UI button
window.toggleTheme = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('TB_THEME', newTheme);
    updateThemeIcon(newTheme);
};

// Helper to update the icon in the header if it exists
window.updateThemeIcon = (theme) => {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-moon';
        } else {
            themeIcon.className = 'fa-solid fa-sun';
        }
    }
};

// Wait for DOM to load to set the initial icon state
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    updateThemeIcon(currentTheme);
});
