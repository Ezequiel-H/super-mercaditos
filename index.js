const fs = require('fs');
const path = require('path');

// Get all JSON files from the data directory
const dataDir = './data';
const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

console.log('Length of all JSON files:');
console.log('========================');

let totalSum = 0;

jsonFiles.forEach(file => {
  try {
    const filePath = path.resolve(dataDir, file);
    const data = require(filePath);
    const length = data.length;
    totalSum += length;
    console.log(`${file}: ${length} items`);
  } catch (error) {
    console.log(`${file}: Error reading file - ${error.message}`);
  }
});

console.log(`\nTotal files processed: ${jsonFiles.length}`);
console.log(`Total sum of all items: ${totalSum}`);
