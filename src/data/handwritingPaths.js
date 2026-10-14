// Provisional centerline transcription for Kannada ಅ.
// Reference animation: Kannada-alphabet-a.gif by Gopala Krishna A, Wikimedia Commons.
// https://commons.wikimedia.org/wiki/File:Kannada-alphabet-a.gif
// Licensed CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/
// Changes: interpreted the two visible pen motions as open SVG centerlines in a
// 400 × 400 viewBox. The animation supports this two-motion interpretation, but
// the exact centerline and teaching sequence have not been independently verified.

export const VERIFIED_HANDWRITING_PATHS = {
  'Kannada:\u0C85': {
    script: 'Kannada',
    char: '\u0C85',
    source: 'https://commons.wikimedia.org/wiki/File:Kannada-alphabet-a.gif',
    sourceAuthor: 'Gopala Krishna A',
    sourceLicense: 'CC BY-SA 4.0',
    verificationStatus: 'provisional',
    verificationNote: 'Provisional two-motion transcription from the cited animation; not an authoritative or universal handwriting standard.',
    viewBox: '0 0 400 400',
    strokes: [
      {
        // Loop and body are one continuous motion, transcribed from the animation.
        d: `
      M 125 192
      C 190 215 200 100 108 150
      
      
      
        
      
      
      C 80 178  96 221 101 244
      `/*C 107 271 128 289 158 296
      C 194 305 241 299 274 282
      C 304 266 321 239 322 210
      C 323 189 317 172 306 161
    `*/,     
      },
      {
        // Independent crossbar motion; kept separate from the first path.
        d:`M 35,20 
                                            C 25,20 20,25 20,35 
                                            C 20,45 25,50 35,50 
                                            C 45,50 50,45 50,35 
                                            C 50,25 45,20 35,20`,
      },
    ],
  },
};
