console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/YihsuanKuo', title: 'Github Portfolio' },
    { url: 'cv/', title: 'My CV' }
  ];
  
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/portfolio/"                  // Local server
  : "https://yihsuankuo.github.io/portfolio/";         // GitHub Pages repo name
  
let nav = document.createElement('nav');
document.body.prepend(nav);
  
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
      }
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
  
  export async function fetchJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      // Optional: Inspect the response in the console
      console.log(response);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
    }
  }

  export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';
    for (const project of projects) {
      const article = document.createElement('article');
      const title = project.title || 'Untitled Project';
      const image = project.image ? `<img src="${project.image}" alt="${title}">` : '';
      const description = project.description || '';
      const year = project.Year || '';
  
      article.innerHTML = `
        <${headingLevel}>${title}</${headingLevel}>
        ${image}
        <div>
          <p>${description}</p>
          <i style="font-family: Baskerville, serif; font-variant-numeric: oldstyle-nums;">c. ${year}</i>
        </div>
      `;
      containerElement.appendChild(article);
    }
  }
  
  export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
  }