const fs = require('fs');

const src = 'datasets';
const dest = 'src/global/data/datasets';

if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log('Moved datasets to src/global/data/datasets');
} else {
    console.log('datasets folder not found');
}
