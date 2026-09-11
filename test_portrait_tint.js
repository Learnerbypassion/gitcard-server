const fs = require('fs');
const path = require('path');

const imgBuffer = fs.readFileSync('assets/portrait_512.jpg');
const base64Img = 'data:image/jpeg;base64,' + imgBuffer.toString('base64');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="420" viewBox="0 0 390 420" role="img">
  <defs>
    <linearGradient id="portBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="#10b981" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="#8b5cf6" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="portOrb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#070913" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="asciiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="45%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <linearGradient id="scanBeam" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </linearGradient>

    <!-- Color matrix filter to tint white ASCII characters into vibrant electric cyan/teal -->
    <filter id="asciiColor" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="
        0.25 0 0 0 0
        0 0.82 0 0 0
        0 0 0.98 0 0
        0 0 0 1 0
      "/>
    </filter>
  </defs>

  <!-- Outer background & glowing border -->
  <rect x="1" y="1" width="388" height="418" rx="18" fill="#070913" stroke="url(#portBorder)" stroke-width="1.5"/>

  <!-- Roaming background orb -->
  <circle cx="200" cy="200" r="140" fill="url(#portOrb)" pointer-events="none">
    <animate attributeName="cx" values="140;260;180;140" dur="12s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="160;280;190;160" dur="12s" repeatCount="indefinite"/>
  </circle>

  <!-- Inner terminal window -->
  <rect x="16" y="16" width="358" height="388" rx="14" fill="#05070d" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.2"/>

  <!-- Terminal top bar -->
  <circle cx="34" cy="34" r="4.5" fill="#ff5f56"/>
  <circle cx="48" cy="34" r="4.5" fill="#ffbd2e"/>
  <circle cx="62" cy="34" r="4.5" fill="#27c93f"/>
  <text x="78" y="38" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600" fill="#64748b">learnerbypassion@terminal:~# <tspan fill="#38bdf8">./portrait.sh</tspan><tspan fill="#38bdf8"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>_</tspan></text>
  <line x1="16" y1="48" x2="374" y2="48" stroke="#1e293b" stroke-width="1"/>

  <!-- Rendered ASCII portrait image with electric cyber tint -->
  <image href="${base64Img}" x="22" y="54" width="346" height="344" preserveAspectRatio="xMidYMid meet" filter="url(#asciiColor)"/>

  <!-- CRT Scanline beam sweeping over portrait -->
  <rect x="22" y="54" width="346" height="32" fill="url(#scanBeam)" pointer-events="none">
    <animate attributeName="y" values="54;360;54" dur="4.5s" repeatCount="indefinite"/>
  </rect>
</svg>`;

fs.writeFileSync('preview_portrait_test.svg', svg);
console.log('Saved preview_portrait_test.svg, total length:', svg.length);
