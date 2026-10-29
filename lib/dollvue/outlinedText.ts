import 'server-only';
import path from 'node:path';
import {openSync,type Font} from 'fontkit';

export const DOLLVUE_WATERMARK_VERSION='bundled-outlines-v1';

let cachedFont:Font|undefined;
function font() {
  if(cachedFont) return cachedFont;
  const loaded=openSync(path.join(process.cwd(),'node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff'));
  if(!('layout' in loaded)) throw new Error('Expected a single bundled branding font');
  cachedFont=loaded;return loaded;
}

/** Shape with the bundled font and emit outlines: no operating-system font lookup. */
export function outlinedText(text:string,options:{x:number;y:number;size:number;fill:string;anchor?:'start'|'middle'}) {
  if(text.length>500||!/^#[0-9a-f]{6}$/i.test(options.fill)||!Number.isFinite(options.size)||options.size<=0) {
    throw new Error('Invalid branding text');
  }
  const face=font();
  if([...text].some(character=>!face.hasGlyphForCodePoint(character.codePointAt(0)!))) {
    throw new Error('Branding text requires an unsupported glyph');
  }
  const run=face.layout(text),scale=options.size/face.unitsPerEm;
  const width=run.positions.reduce((sum,position)=>sum+position.xAdvance,0)*scale;
  let x=0,y=0;
  const paths=run.glyphs.map((glyph,index)=>{
    const position=run.positions[index];
    const svg=`<path transform="translate(${x+position.xOffset} ${y+position.yOffset})" d="${glyph.path.toSVG()}"/>`;
    x+=position.xAdvance;y+=position.yAdvance;return svg;
  }).join('');
  const left=options.x-(options.anchor==='middle'?width/2:0);
  return {width,svg:`<g fill="${options.fill}" transform="translate(${left} ${options.y}) scale(${scale} ${-scale})">${paths}</g>`};
}

export function dollVueWatermark(width:number,height:number) {
  const size=Math.max(22,Math.round(Math.min(width,height)*0.026));
  const horizontal=Math.max(18,Math.round(size*0.72)),vertical=Math.max(12,Math.round(size*0.44));
  const text=outlinedText('DOLLWOW.COM - DOLLVUE',{x:horizontal,y:vertical+size,size,fill:'#fff8f2'});
  const boxWidth=Math.ceil(text.width+horizontal*2),boxHeight=Math.ceil(size*1.25+vertical*2);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${boxWidth}" height="${boxHeight}"><rect width="100%" height="100%" rx="${Math.round(boxHeight/2)}" fill="#160f0c" fill-opacity=".58"/>${text.svg}</svg>`);
}
