import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale, xAxis;
let data, commits;
let commitProgress = 100;
let timeScale, commitMaxTime, filteredCommits;

const scroller = scrollama();

(async () => {
  data = await loadData();
  commits = processCommits(data);

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, 100]);

  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits;

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
  updateFileDisplay(filteredCommits);

  document.getElementById('commit-progress')
    .addEventListener('input', onTimeSliderChange);

  generateStory(commits); // Step 3.2
  setupScrollama();       // Step 3.3

  onTimeSliderChange();   // Initial render
})();

async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;
    const obj = {
      id: commit,
      url: `https://github.com/YihsuanKuo/portfolio/commit/${commit}`,
      author, date, time, timezone, datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    Object.defineProperty(obj, 'lines', {
      value: lines, configurable: true, writable: true, enumerable: false
    });
    return obj;
  });
}

function onTimeSliderChange(event) {
  const slider = document.getElementById('commit-progress');
  commitProgress = event ? +event.target.value : +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById('commit-time').textContent = commitMaxTime.toLocaleString();
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

function renderScatterPlot(data, commits) {
  const width = 1000, height = 600;
  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime().domain(d3.extent(commits, d => d.datetime)).range([0, width]).nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const rScale = d3.scaleSqrt().domain(d3.extent(commits, d => d.totalLines)).range([5, 30]);
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  const dots = svg.append('g').attr('class', 'dots');
  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', event => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).attr('class', 'x-axis').call(xAxis);
  svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).attr('class', 'y-axis').call(yAxis);
  svg.append('g').attr('class', 'gridlines').attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  createBrushSelector(svg);
}

function updateScatterPlot(data, commits) {
  xScale.domain(d3.extent(commits, d => d.datetime));
  xAxis.scale(xScale);
  d3.select('g.x-axis').call(xAxis);

  const rScale = d3.scaleSqrt().domain(d3.extent(commits, d => d.totalLines)).range([2, 30]);
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  const dots = d3.select('g.dots');
  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', event => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function renderCommitInfo(data, commits) {
  const numFiles = new Set(data.map(d => d.file)).size;
  const fileLengths = d3.rollups(data, v => d3.max(v, v => v.line), d => d.file);
  const averageFileLength = d3.mean(fileLengths, d => d[1]);
  const workByPeriod = d3.rollups(data, v => v.length, d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }));
  const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  const fileGroups = d3.groups(data, d => d.file);
  const maxLinesInFile = d3.max(fileGroups, ([, lines]) => lines.length);

  const dl = d3.select('#stats').html('').append('dl').attr('class', 'stats');
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);
  dl.append('dt').text('Avg. File Length');
  dl.append('dd').text(averageFileLength);
  dl.append('dt').text('Max Period');
  dl.append('dd').text(maxPeriod);
  dl.append('dt').text('Max lines in a file');
  dl.append('dd').text(maxLinesInFile);
}

function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const filesContainer = d3.select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(enter => enter.append('div').call(div => {
      div.append('dt').append('code');
      div.append('dd');
    }));

  filesContainer.select('dt > code').text(d => d.name);

  filesContainer.select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', d => `--color: ${colors(d.type)}`);
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (!commit) return;
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', d => isCommitSelected(selection, d));
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  document.querySelector('#selection-count').textContent = `${selected.length || 'No'} commits selected`;
}

function renderLanguageBreakdown(selection) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  const container = document.getElementById('language-breakdown');
  if (!selected.length) return container.innerHTML = '';
  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const percent = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${percent})</dd>`;
  }
}

function generateStory(commits) {
  d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html((d, i) => `
      On ${d.datetime.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })}, 
      I made <a href="${d.url}" target="_blank">
      ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}</a>.
      I edited ${d.totalLines} lines across ${
        d3.rollups(d.lines, v => v.length, d => d.file).length
      } files.
      Then I looked over all I had made, and I saw that it was very good.
    `);
}

function setupScrollama() {
  scroller
    .setup({
      step: '#scrolly-1 .step',
      offset: 0.5,
      debug: false,
    })
    .onStepEnter(onStepEnter);
}

function onStepEnter({ index }) {
  const commit = commits[index];
  commitMaxTime = commit.datetime;
  commitProgress = timeScale(commitMaxTime);
  document.getElementById('commit-progress').value = commitProgress;
  document.getElementById('commit-time').textContent = commitMaxTime.toLocaleString();
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);

  // Highlight active step
  d3.selectAll('.step').classed('is-active', false);
  d3.select(d3.selectAll('.step').nodes()[index]).classed('is-active', true);
}
