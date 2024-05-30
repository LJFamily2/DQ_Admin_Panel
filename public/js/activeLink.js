const currentURL = window.location.pathname;

const navigationLinks = document.querySelectorAll('nav a');


navigationLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    
    if (currentURL === linkHref) {
        link.classList.add('active');
        link.classList.remove('link-dark');
    }else{
        link.classList.remove('active');
        link.classList.add('link-dark');
    }
});