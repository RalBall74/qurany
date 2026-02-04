# Quran Player Web App Implementation Plan

## Features
-   **Reciters:** Ahmed Al-Nafis, Mishary Rashid, Yasser Al-Dosari.
-   **Functionality:**
    -   Search Surahs.
    -   Favorite Surahs/Reciters.
    -   Display Quranic Text.
    -   Sleep Timer.
    -   Dark/Light Mode (Modern Calm design).
-   **Tech Stack:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).

## File Structure
-   `/index.html`: Main page structure.
-   `/css/style.css`: Modern styling with CSS variables for themes.
-   `/js/app.js`: Application logic (API calls, Audio, UI updates).
-   `/js/reciters.js`: Configuration for reciters and their API endpoints.
-   `/assets/`: Images and icons (if needed).

## UI/UX Design
-   **Glassmorphism** for player controls.
-   **Smooth transitions** between modes.
-   **Responsive design** for mobile and desktop.
-   **Arabic Layout** (RTL).

## API Integration
-   Surah List & Text: `https://api.alquran.cloud/v1/`
-   Audio: `https://mp3quran.net/api/v3/`
