const fs = require('fs');
const path = require('path');

const dirsToMake = [
  'src/shared/components',
  'src/shared/context',
  'src/global/pages',
  'src/global/components',
  'src/global/data',
  'src/countries/usa/pages',
  'src/countries/usa/components',
  'src/countries/usa/data'
];

dirsToMake.forEach(d => fs.mkdirSync(d, { recursive: true }));

const moves = [
  ['src/components/Navbar.jsx', 'src/shared/components/Navbar.jsx'],
  ['src/components/Footer.jsx', 'src/shared/components/Footer.jsx'],
  ['src/context/ScopeContext.jsx', 'src/shared/context/ScopeContext.jsx'],
  ['src/components/CountriesList.jsx', 'src/global/components/CountriesList.jsx'],
  ['src/components/Globe.jsx', 'src/global/components/Globe.jsx'],
  ['src/components/Hero.jsx', 'src/global/components/Hero.jsx'],
  ['src/components/Map.jsx', 'src/global/components/Map.jsx'],
  ['src/data/countries.js', 'src/global/data/countries.js'],
  ['src/pages/country/CountryHome.jsx', 'src/countries/usa/pages/USAHome.jsx'],
  ['src/pages/country/CountryAnalysisWorkspace.jsx', 'src/countries/usa/pages/USAAnalysisWorkspace.jsx'],
  ['src/pages/country/CountryChoropleth.jsx', 'src/countries/usa/pages/USAChoropleth.jsx'],
  ['src/pages/country/CountryDataDirectory.jsx', 'src/countries/usa/pages/USADataDirectory.jsx'],
  ['src/components/USMap.jsx', 'src/countries/usa/components/USMap.jsx'],
  ['src/data/usMockData.js', 'src/countries/usa/data/usMockData.js']
];

moves.forEach(([src, dest]) => {
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
});

// Move global pages
const globalPagesDir = 'src/pages/global';
if (fs.existsSync(globalPagesDir)) {
  const files = fs.readdirSync(globalPagesDir);
  files.forEach(f => {
    fs.renameSync(path.join(globalPagesDir, f), path.join('src/global/pages', f));
  });
}

// Clean up empty dirs
const emptyDirs = [
  'src/context',
  'src/pages/country',
  'src/pages/global',
  'src/pages',
  'src/components',
  'src/data'
];

emptyDirs.forEach(d => {
  if (fs.existsSync(d)) {
    try {
      fs.rmdirSync(d);
    } catch (e) {}
  }
});
