const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const allReplacements = [
    // global pages -> components
    ['../../components/Hero', '../../global/components/Hero'],
    ['../../components/Map', '../../global/components/Map'],
    ['../../components/Globe', '../../global/components/Globe'],
    ['../../components/CountriesList', '../../global/components/CountriesList'],
    ['../../data/countries', '../../global/data/countries'],

    // usa pages -> components
    ['../../components/USMap', '../../countries/usa/components/USMap'],
    ['../../data/usMockData', '../../countries/usa/data/usMockData'],

    // shared context
    ['../context/ScopeContext', '../context/ScopeContext'], // in shared/components/Navbar.jsx

    // USA pages imports
    ['CountryHome', 'USAHome'],
    ['CountryAnalysisWorkspace', 'USAAnalysisWorkspace'],
    ['CountryChoropleth', 'USAChoropleth'],
    ['CountryDataDirectory', 'USADataDirectory']
];

walkDir('src', (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let fileReplacements = [...allReplacements];
        
        // Custom replacements depending on file location
        if (filePath.includes('shared/components/Navbar.jsx')) {
            fileReplacements.push(['../context/ScopeContext', '../context/ScopeContext']);
        }
        
        if (filePath.includes('global/pages')) {
            fileReplacements.push(['../../components', '../components']);
            fileReplacements.push(['../../data/countries', '../data/countries']);
        }

        if (filePath.includes('countries/usa/pages')) {
            fileReplacements.push(['../../components/USMap', '../components/USMap']);
            fileReplacements.push(['../../data/usMockData', '../data/usMockData']);
            fileReplacements.push(['../../components/Globe', '../../../global/components/Globe']);
            fileReplacements.push(['../../components/Map', '../../../global/components/Map']);
        }

        if (filePath.includes('global/components')) {
            fileReplacements.push(['../../data/countries', '../data/countries']);
        }

        replaceInFile(filePath, fileReplacements);
    }
});
