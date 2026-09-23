const fs = require('fs');
const path = 'c:/Users/35435/Documents/1';

// Check app.js renderGames function
const appJs = fs.readFileSync(path + '/app.js', 'utf8');
const gamesMatch = appJs.match(/function renderGames\(\)[\s\S]*?(?=function |$)/);
console.log('=== renderGames function ===');
console.log(gamesMatch ? gamesMatch[0].substring(0, 500) : 'NOT FOUND');

// Check if DOMContentLoaded exists
console.log('\n=== DOMContentLoaded check ===');
const domContentLoaded = appJs.includes("addEventListener('DOMContentLoaded'");
console.log('app.js has DOMContentLoaded:', domContentLoaded);

const gamesJs = fs.readFileSync(path + '/games.js', 'utf8');
console.log('games.js has DOMContentLoaded:', gamesJs.includes("addEventListener('DOMContentLoaded'"));

// Check index.html script order
const indexHtml = fs.readFileSync(path + '/index.html', 'utf8');
const scriptMatches = indexHtml.match(/<script[^>]*>/g);
console.log('\n=== Scripts in index.html ===');
scriptMatches.forEach(s => console.log(s));

// Check gamesContainer in HTML
console.log('\n=== gamesContainer in HTML ===');
const containerMatch = indexHtml.match(/id="gamesContainer"[^>]*>/);
console.log(containerMatch ? containerMatch[0] : 'NOT FOUND');
