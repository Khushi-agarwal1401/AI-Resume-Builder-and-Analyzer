const fs = require('fs');
const twColors = require('tailwindcss/colors');

const config = require('./tailwind.config.js');
const customColors = config.theme.extend.colors;

let css = fs.readFileSync('./src/app/globals.css', 'utf8');

// Find the reset block
const resetStart = css.indexOf('/* ── Resume Paper Resets ── */');
if (resetStart !== -1) {
  let before = css.substring(0, resetStart);
  let resetsBlock = css.substring(resetStart);
  
  resetsBlock = resetsBlock.replace(/\.([a-zA-Z0-9_\-]+)\s*\{\s*@apply\s+([a-zA-Z0-9_\-]+)\s*!important;\s*\}/g, (match, className, applyName) => {
    // Determine if bg-, text-, or border-
    let prop = '';
    let colorName = '';
    
    if (applyName.startsWith('bg-')) {
      prop = 'background-color';
      colorName = applyName.substring(3);
    } else if (applyName.startsWith('text-')) {
      prop = 'color';
      colorName = applyName.substring(5);
    } else if (applyName.startsWith('border-')) {
      prop = 'border-color';
      colorName = applyName.substring(7);
    } else {
      return match; // fallback
    }

    // Resolve color value
    let val = '';
    if (colorName === 'white') val = '#ffffff';
    else if (colorName === 'black') val = '#000000';
    else if (colorName === 'transparent') val = 'transparent';
    else {
      // e.g. blue-600
      let parts = colorName.split('-');
      if (parts.length === 2) {
        let [hue, shade] = parts;
        if (customColors[hue] && typeof customColors[hue][shade] === 'string') {
           val = customColors[hue][shade];
        } else if (twColors[hue] && twColors[hue][shade]) {
           val = twColors[hue][shade];
        }
      }
    }
    
    // For colors like text-gradient-primary which don't map to a single hex, we skip or handle them manually.
    // If we couldn't resolve, fallback to @apply (which might error, but we'll see)
    if (val) {
      // replace <alpha-value> if present
      val = val.replace(' / <alpha-value>', '');
      return `  .${className} { ${prop}: ${val} !important; }`;
    }
    
    return match;
  });

  fs.writeFileSync('./src/app/globals.css', before + resetsBlock);
  console.log('Fixed resets block');
} else {
  console.log('Reset block not found');
}
