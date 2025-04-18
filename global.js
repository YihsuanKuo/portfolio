console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
//   );

//   currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/YihsuanKuo', title: 'Github Portfolio' },
    { url: 'cv/', title: 'My CV' }
  ];
  
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "";         // GitHub Pages repo name
  
let nav = document.createElement('nav');
document.body.prepend(nav);
  
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !url.startsWith('http') ? BASE_PATH + url : url;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    if (a.host !== location.host){
        a.target = '_blank';
    }
    nav.append(a);
  }

  // Inject the theme switcher HTML
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
  );
  
  const select = document.querySelector('.color-scheme select');
  
  const savedScheme = localStorage.getItem('colorScheme');
  if (savedScheme) {
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    select.value = savedScheme;
  }
  
  select.addEventListener('input', (event) => {
    const selectedScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', selectedScheme);
    localStorage.setItem('colorScheme', selectedScheme);
  });
  