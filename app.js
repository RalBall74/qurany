document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const surahListEl = document.getElementById('surah-list');
    const recitersGridEl = document.getElementById('reciters-grid');
    const searchInput = document.getElementById('surah-search');
    const themeSwitch = document.getElementById('theme-switch');
    const playerAudio = document.getElementById('main-audio');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressFilled = document.getElementById('progress-filled');
    const progressBar = document.querySelector('.progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const playerSurah = document.getElementById('player-surah');
    const playerReciter = document.getElementById('player-reciter');
    const playerImg = document.getElementById('player-img');
    const favBtn = document.getElementById('fav-btn');
    const showTextBtn = document.getElementById('show-text-btn');
    const ayahViewer = document.getElementById('ayah-viewer');
    const closeViewer = document.getElementById('close-viewer');
    const ayahContent = document.getElementById('ayah-content');
    const viewerTitle = document.getElementById('viewer-title');
    const sleepTimerBtn = document.getElementById('sleep-timer-btn');
    const timerModal = document.getElementById('timer-modal');
    const closeTimer = document.getElementById('close-timer');
    const navItems = document.querySelectorAll('.nav-item');

    // State
    let allSurahs = [];
    let currentReciter = recitersData[0];
    let currentSurahIndex = -1;
    let favorites = JSON.parse(localStorage.getItem('quran_favorites')) || [];
    let isPlaying = false;
    let sleepTimer = null;

    // --- initialization ---
    init();

    async function init() {
        renderReciters();
        await fetchSurahs();
        setupEventListeners();
        applyTheme();
        updateFavoritesUI();

        // Set initial player info
        if (currentReciter) {
            playerReciter.textContent = currentReciter.name;
            playerImg.src = currentReciter.img;
        }
    }

    // --- Data Fetching ---
    async function fetchSurahs() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            allSurahs = data.data;
            renderSurahs(allSurahs);
        } catch (error) {
            console.error('Error fetching surahs:', error);
            surahListEl.innerHTML = '<p class="error">حدث خطأ في تحميل السور. يرجى المحاولة لاحقاً.</p>';
        }
    }

    async function fetchSurahText(number) {
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
            const data = await response.json();
            return data.data.ayahs;
        } catch (error) {
            console.error('Error fetching surah text:', error);
            return null;
        }
    }

    // --- Rendering ---
    function renderReciters() {
        recitersGridEl.innerHTML = recitersData.map(reciter => `
            <div class="reciter-card ${reciter.id === currentReciter.id ? 'active' : ''}" data-id="${reciter.id}">
                <img src="${reciter.img}" alt="${reciter.name}">
                <p>${reciter.name}</p>
            </div>
        `).join('');

        document.querySelectorAll('.reciter-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                currentReciter = recitersData.find(r => r.id === id);
                document.querySelectorAll('.reciter-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                if (currentSurahIndex !== -1) {
                    playSurah(allSurahs[currentSurahIndex]);
                }
            });
        });
    }

    function renderSurahs(surahs) {
        if (surahs.length === 0) {
            surahListEl.innerHTML = '<p class="no-results">لا توجد نتائج مطابقة</p>';
            return;
        }
        surahListEl.innerHTML = surahs.map((surah, index) => `
            <div class="surah-card" data-index="${allSurahs.indexOf(surah)}">
                <div class="number">${surah.number}</div>
                <div class="surah-info">
                    <h3>${surah.name}</h3>
                    <p>${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} - ${surah.numberOfAyahs} آية</p>
                </div>
                <i class="fas fa-play-circle" style="font-size: 1.5rem; opacity: 0.5;"></i>
            </div>
        `).join('');

        document.querySelectorAll('.surah-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                playSurah(allSurahs[index], index);
            });
        });
    }

    // --- Audio Logic ---
    function playSurah(surah, index = -1) {
        if (index !== -1) currentSurahIndex = index;

        // Format surah number to 001, 002...
        const formattedNumber = String(surah.number).padStart(3, '0');
        const audioUrl = `${currentReciter.server}${formattedNumber}.mp3`;

        playerAudio.src = audioUrl;
        playerSurah.textContent = surah.name;
        playerReciter.textContent = currentReciter.name;
        playerImg.src = currentReciter.img;

        // Check if favorite
        const isFav = favorites.includes(surah.number);
        favBtn.classList.toggle('active', isFav);
        favBtn.querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';

        playerAudio.play();
        isPlaying = true;
        updatePlayBtn();
    }

    function togglePlay() {
        if (currentSurahIndex === -1) {
            // Pick first surah if nothing selected
            playSurah(allSurahs[0], 0);
            return;
        }
        if (isPlaying) {
            playerAudio.pause();
        } else {
            playerAudio.play();
        }
        isPlaying = !isPlaying;
        updatePlayBtn();
    }

    function updatePlayBtn() {
        playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }

    function playNext() {
        if (currentSurahIndex < allSurahs.length - 1) {
            playSurah(allSurahs[currentSurahIndex + 1], currentSurahIndex + 1);
        }
    }

    function playPrev() {
        if (currentSurahIndex > 0) {
            playSurah(allSurahs[currentSurahIndex - 1], currentSurahIndex - 1);
        }
    }

    // --- Search & Filters ---
    function normalizeArabic(text) {
        if (!text) return "";
        return text
            .replace(/[\u064B-\u0652]/g, "") // Remove Tashkeel (diacritics)
            .replace(/[أإآ]/g, "ا")         // Normalize Alef
            .replace(/ة/g, "ه")             // Normalize Teh Marbuta
            .replace(/ى/g, "ي");            // Normalize Alef Maksura
    }

    function handleSearch(query) {
        const normalizedQuery = normalizeArabic(query.trim().toLowerCase());
        const filtered = allSurahs.filter(s =>
            normalizeArabic(s.name).includes(normalizedQuery) ||
            s.englishName.toLowerCase().includes(normalizedQuery)
        );
        renderSurahs(filtered);
    }

    // --- Theme & Extras ---
    function applyTheme() {
        const isDark = localStorage.getItem('theme') === 'dark';
        themeSwitch.checked = isDark;
        document.body.className = isDark ? 'dark-mode' : 'light-mode';
    }

    function updateFavoritesUI() {
        // This would be called when switching to "Favorites" tab
        const activeTab = document.querySelector('.nav-item.active').dataset.target;
        if (activeTab === 'favorites') {
            const favSurahs = allSurahs.filter(s => favorites.includes(s.number));
            renderSurahs(favSurahs);
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        playBtn.addEventListener('click', togglePlay);
        nextBtn.addEventListener('click', playNext);
        prevBtn.addEventListener('click', playPrev);

        // Progress update
        playerAudio.addEventListener('timeupdate', (e) => {
            const { currentTime, duration } = e.target;
            const progressPercent = (currentTime / duration) * 100;
            progressFilled.style.width = `${progressPercent}%`;

            currentTimeEl.textContent = formatTime(currentTime);
            if (duration) durationEl.textContent = formatTime(duration);
        });

        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const duration = playerAudio.duration;
            if (duration) {
                playerAudio.currentTime = (clickX / width) * duration;
            }
        });

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        themeSwitch.addEventListener('change', () => {
            const isDark = themeSwitch.checked;
            document.body.className = isDark ? 'dark-mode' : 'light-mode';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });

        // Navigation
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const target = item.dataset.target;

                if (target === 'home') {
                    renderSurahs(allSurahs);
                    document.getElementById('current-category').textContent = 'السور';
                } else if (target === 'favorites') {
                    const favSurahs = allSurahs.filter(s => favorites.includes(s.number));
                    renderSurahs(favSurahs);
                    document.getElementById('current-category').textContent = 'المفضلة';
                }
            });
        });

        // Favorites
        favBtn.addEventListener('click', () => {
            if (currentSurahIndex === -1) return;
            const surahNumber = allSurahs[currentSurahIndex].number;
            if (favorites.includes(surahNumber)) {
                favorites = favorites.filter(id => id !== surahNumber);
            } else {
                favorites.push(surahNumber);
            }
            localStorage.setItem('quran_favorites', JSON.stringify(favorites));

            const isFav = favorites.includes(surahNumber);
            favBtn.classList.toggle('active', isFav);
            favBtn.querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';

            updateFavoritesUI();
        });

        // Quran Text
        showTextBtn.addEventListener('click', async () => {
            if (currentSurahIndex === -1) return;
            const surah = allSurahs[currentSurahIndex];
            viewerTitle.textContent = surah.name;
            ayahContent.innerHTML = '<div class="loader">جاري تحميل الآيات...</div>';
            ayahViewer.classList.add('active');

            const ayahs = await fetchSurahText(surah.number);
            if (ayahs) {
                ayahContent.innerHTML = ayahs.map(a => `
                    <span class="ayah-txt">${a.text} <span class="ayah-num">(${a.numberInSurah})</span></span>
                `).join(' ');
            }
        });

        closeViewer.addEventListener('click', () => {
            ayahViewer.classList.remove('active');
        });

        // Sleep Timer
        sleepTimerBtn.addEventListener('click', () => {
            timerModal.style.display = 'flex';
        });

        closeTimer.addEventListener('click', () => {
            timerModal.style.display = 'none';
        });

        document.querySelectorAll('.timer-options button').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.time);
                if (sleepTimer) clearTimeout(sleepTimer);

                if (minutes > 0) {
                    sleepTimer = setTimeout(() => {
                        playerAudio.pause();
                        isPlaying = false;
                        updatePlayBtn();
                        alert('انتهى مؤقت النوم، تم إيقاف المذياع.');
                    }, minutes * 60 * 1000);
                    sleepTimerBtn.classList.add('active');
                    sleepTimerBtn.style.color = 'var(--primary-color)';
                } else {
                    sleepTimerBtn.classList.remove('active');
                    sleepTimerBtn.style.color = 'inherit';
                }
                timerModal.style.display = 'none';
            });
        });

        // Handle audio end
        playerAudio.addEventListener('ended', playNext);
    }

    // --- Utils ---
    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
});
