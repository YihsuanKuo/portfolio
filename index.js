import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];

const projectsContainer = document.querySelector('.projects');
if (projectsContainer) {
  renderProjects(latestProjects, projectsContainer, 'h2');
}

const githubData = await fetchGitHubData('YihsuanKuo');
console.log(githubData);

const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt><dd>${githubData.followers}</dd>
        <dt>Following:</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }

// async function displayGitHubStats() {
//     const profileStats = document.querySelector('#profile-stats');
//     if (profileStats) {
//       try {
//         const githubData = await fetchGitHubData('YihsuanKuo');
//         profileStats.innerHTML = `
//           <h2>GitHub Profile Stats</h2>
//           <dl>
//             <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
//             <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
//             <dt>Followers:</dt><dd>${githubData.followers}</dd>
//             <dt>Following:</dt><dd>${githubData.following}</dd>
//           </dl>
//         `;
//       } catch (error) {
//         profileStats.textContent = 'Failed to load GitHub data.';
//       }
//     }
//   }
  
//   displayGitHubStats();