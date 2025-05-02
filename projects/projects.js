import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
let selectedIndex = -1; // For pie chart selection

// Helper function to filter projects based on query (case-insensitive, all fields)
function getFilteredProjects(query, data = projects) {
  return data.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// --- PIE CHART RENDERING ---
function renderPieChart(projectsGiven) {
  // 1. Roll up data
  let newRolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.Year,
  );
  let newData = newRolledData.map(([year, count]) => ({ label: year, value: count }));

  // 2. Pie and arc generators
  let newSliceGenerator = d3.pie().value(d => d.value);
  let newArcData = newSliceGenerator(newData);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // 3. Select the <svg> group and clear previous paths
  const svgGroup = d3.select('svg');
  svgGroup.selectAll('path').remove();

  // 4. Draw new pie slices and attach click handler
  svgGroup.selectAll('path')
    .data(newArcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, idx) => colors(idx))
    .attr('class', (d, idx) => selectedIndex === idx ? 'selected' : '')
    .on('click', function (event, d) {
      // Toggle selection
      const idx = newArcData.indexOf(d);
      selectedIndex = selectedIndex === idx ? -1 : idx;

      // Highlight selection
      svgGroup.selectAll('path')
        .attr('class', (_, i) => selectedIndex === i ? 'selected' : '');

      // Filter and render projects
      if (selectedIndex === -1) {
        renderProjects(projectsGiven, projectsContainer, 'h2');
        if (titleElement) titleElement.textContent = `${projectsGiven.length} Projects`;
      } else {
        const selectedLabel = newData[selectedIndex].label;
        const filtered = projectsGiven.filter(p => p.Year === selectedLabel);
        renderProjects(filtered, projectsContainer, 'h2');
        if (titleElement) titleElement.textContent = `${filtered.length} Projects`;
      }
    });

  // 5. Update legend
  d3.select('.legend').selectAll('li').remove();
  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend.append('li')
      .attr('style', selectedIndex === idx
        ? '--color: oklch(60% 45% 0)' 
        : `--color: ${colors(idx)}`  
      )
      .attr('class', selectedIndex === idx ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// --- INITIAL RENDER ---
renderProjects(projects, projectsContainer, 'h2');
if (titleElement) titleElement.textContent = `${projects.length} Projects`;
renderPieChart(projects);

// --- SEARCH BAR SECTION ---
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  let query = event.target.value;
  let filteredProjects = getFilteredProjects(query);

  // Reset selection on search
  selectedIndex = -1;

  // Render filtered projects and pie chart
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);

  // Update the project count in the title
  if (titleElement) {
    titleElement.textContent = `${filteredProjects.length} Projects`;
  }
});