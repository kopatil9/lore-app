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
  landing: 'linear-gradient(170deg, #2C4A7C 0%, #1A2F5C 40%, #0F1A35 100%)',
  mission: 'linear-gradient(170deg, #1E3A5F 0%, #0F2040 50%, #0A1428 100%)',
  submit:  'linear-gradient(170deg, #2A3A6C 0%, #1A2550 50%, #0F1830 100%)',
  recap:   'linear-gradient(170deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
}
