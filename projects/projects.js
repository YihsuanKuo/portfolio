import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');


const projectCount = Array.isArray(projects) ? projects.length : 0;

// Update the title with the project count
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projectCount} Projects`;
}

// Render projects as usual
renderProjects(projects, projectsContainer, 'h2');