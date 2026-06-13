const fs = require('fs');
const file = 'src/pages/country/CountryAnalysisWorkspace.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replacements
content = content.replace(/selectedCountries/g, 'selectedStates');
content = content.replace(/removeCountry/g, 'removeState');
content = content.replace(/handleAddCountry/g, 'handleAddState');
content = content.replace(/countryColors/g, 'stateColors');
content = content.replace(/countryObj/g, 'stateObj');
content = content.replace(/dimensions\.forEach/g, 'usDimensions.forEach');
content = content.replace(/dimensionsMap/g, 'usDimensionsMap');
content = content.replace(/dimensions\.map/g, 'usDimensions.map');
content = content.replace(/dimensions\[/g, 'usDimensions[');
content = content.replace(/const dimensions =/g, '// const dimensions =');
content = content.replace(/countryIso3/g, 'stateName');
content = content.replace(/country\.iso3/g, 'state.name');
content = content.replace(/country\.name/g, 'state.name');
content = content.replace(/country =>/g, 'state =>');
content = content.replace(/country,/g, 'state,');
content = content.replace(/country\)/g, 'state)');
content = content.replace(/country\./g, 'state.');
content = content.replace(/cData/g, 'sData');

fs.writeFileSync(file, content);
