// ============================================================
// LORE — Background Photo Config
// ============================================================
// Replace each value below with your own photo.
//
// HOW TO ADD YOUR PHOTOS:
// 1. Put your .jpg or .png files in: src/assets/
//    e.g. src/assets/my-photo-landing.jpg
//
// 2. Import them here:
//    import landingBg from './my-photo-landing.jpg'
//
// 3. Swap the URL strings below for your imported variables:
//    landing: landingBg,
//
// PHOTO RECOMMENDATIONS:
//   landing  → a group shot, landscape scene, or candid moment
//   mission  → a moody/action photo, dark enough for white text
//   board    → a fun group photo or venue shot
//   submit   → a candid or close-up moment
//   recap    → your best group shot of the night
//
// All photos will be cropped to fill the screen (cover).
// Vertical/portrait photos work best on mobile.
// ============================================================

// 🔁 REPLACE THESE with your imported photo variables or URLs:
export const backgrounds = {
  landing: null,  // → your landing background photo
  mission: null,  // → your mission page background photo
  submit:  null,  // → your submit proof background photo
  recap:   null,  // → your recap/mission-accomplished background photo
}

// Fallback gradient when no photo is set
// You can change these colors to match your vibe
export const fallbackGradients = {
  landing: 'linear-gradient(170deg, #000016 0%, #00051f 60%, #000c2c 100%)',
  mission: 'linear-gradient(170deg, #000016 0%, #000a2e 55%, #00051f 100%)',
  submit:  'linear-gradient(170deg, #00051f 0%, #000c2c 55%, #000016 100%)',
  recap:   'linear-gradient(170deg, #000016 0%, #0015AD 120%)',
}
