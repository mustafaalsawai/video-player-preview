// ===== DOM =====
const player = document.getElementById('player');
const video = document.getElementById('video');
const playPauseBtn = document.getElementById('playPauseBtn');
const rewardBtn = document.getElementById('rewardBtn');
const forwardBtn = document.getElementById('forwardBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volSlider = document.getElementById('volSlider');
const progressWrap = document.getElementById('progressWrap');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressBuffer = document.getElementById('progressBuffer');
const progressThumb = document.getElementById('progressThumb');
const progressTip = document.getElementById('progressTip');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');
const fsBtn = document.getElementById('fsBtn');
const pipBtn = document.getElementById('pipBtn');
const subtitleBtn = document.getElementById('subtitleBtn');
const centerPlay = document.getElementById('centerPlay');
const hint = document.getElementById('hint');

let isPlaying = false, isMuted = false, prevVol = 0.8;
let dragging = false, subsOn = false, hintTimer;

// ===== HELPERS =====
function fmt(s) {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60);
    return h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updProgress() {
    if (!video.duration) return;
    const p = (video.currentTime / video.duration) * 100;
    progressFill.style.width = p + '%';
    progressThumb.style.left = p + '%';
    timeCurrent.textContent = fmt(video.currentTime);
}

function showHint(t) {
    hint.textContent = t;
    hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove('show'), 800);
}

// ===== SIDE HINTS =====
const hintLeft = document.getElementById('hintLeft');
const hintRight = document.getElementById('hintRight');

function triggerSideHint(side) {
    const el = side === 'right' ? hintRight : hintLeft;
    el.classList.add('show');
    clearTimeout(el.timer);
    el.timer = setTimeout(() => {
        el.classList.remove('show');
    }, 500);
}

rewardBtn.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 15);
    triggerSideHint('left');
});

forwardBtn.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 15);
    triggerSideHint('right');
});

// ===== PLAY / PAUSE =====
function togglePlay() {
    if (video.paused) {
        video.play().catch(() => {});
    } else {
        video.pause();
    }
}
playPauseBtn.addEventListener('click', togglePlay);

let clickCount = 0, clickTimer = null;
document.querySelector('.video-layer').addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
        clickTimer = setTimeout(() => { togglePlay(); showControls(); clickCount = 0; }, 250);
    } else if (clickCount === 2) {
        clearTimeout(clickTimer); clickCount = 0; toggleFS();
    }
});

// ===== SEEK =====
rewardBtn.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 15); showHint('ترجيع ١٥ ثانية'); });
forwardBtn.addEventListener('click', () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 15); showHint('تقديم ١٥ ثانية'); });

// ===== VOLUME =====
function updateVolBg() {
    const v = volSlider.value * 100;
    volSlider.style.background = `linear-gradient(to right, #fff ${v}%, rgba(255,255,255,0.2) ${v}%)`;
}

function toggleMute() {
    isMuted = !isMuted;
    const on = volumeBtn.querySelector('.icon-vol-on'), off = volumeBtn.querySelector('.icon-vol-off');
    if (isMuted) { prevVol = parseFloat(volSlider.value); volSlider.value = 0; video.muted = true; on.style.display = 'none'; off.style.display = ''; }
    else { volSlider.value = prevVol; video.muted = false; on.style.display = ''; off.style.display = 'none'; }
    updateVolBg();
}

volumeBtn.addEventListener('click', toggleMute);
volSlider.addEventListener('input', () => {
    const v = parseFloat(volSlider.value); video.volume = v;
    const on = volumeBtn.querySelector('.icon-vol-on'), off = volumeBtn.querySelector('.icon-vol-off');
    if (v === 0) { on.style.display = 'none'; off.style.display = ''; isMuted = true; }
    else { on.style.display = ''; off.style.display = 'none'; isMuted = false; }
    updateVolBg();
});
updateVolBg();

// ===== PROGRESS =====
progressWrap.addEventListener('mousemove', e => {
    const r = progressTrack.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    progressTip.textContent = fmt(p * (video.duration || 0));
    progressTip.style.left = (p * 100) + '%';
});
progressWrap.addEventListener('mousedown', e => { dragging = true; progressWrap.classList.add('dragging'); seekTo(e); });
document.addEventListener('mousemove', e => { if (dragging) seekTo(e); });
document.addEventListener('mouseup', () => { if (dragging) { dragging = false; progressWrap.classList.remove('dragging'); } });

function seekTo(e) {
    const r = progressTrack.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    video.currentTime = p * (video.duration || 0);
    updProgress();
}

// ===== FULLSCREEN =====
function toggleFS() {
    if (!document.fullscreenElement) player.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
}
fsBtn.addEventListener('click', toggleFS);
document.addEventListener('fullscreenchange', () => {
    const en = fsBtn.querySelector('.icon-fs-enter'), ex = fsBtn.querySelector('.icon-fs-exit');
    if (document.fullscreenElement) { en.style.display = 'none'; ex.style.display = ''; }
    else { en.style.display = ''; ex.style.display = 'none'; }
});

// ===== PIP =====
pipBtn.addEventListener('click', async () => {
    try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
    } catch { showHint('غير مدعوم'); }
});

// ===== SUBTITLES =====
subtitleBtn.addEventListener('click', () => {
    subsOn = !subsOn; subtitleBtn.classList.toggle('sub-on', subsOn);
    showHint(subsOn ? 'تم تفعيل الترجمة' : 'تم إيقاف الترجمة');
});

// ===== POPOVER LOGIC =====
const qualityPopover = document.getElementById('qualityPopover');
//const audioPopover = document.getElementById('audioPopover');
const qualityAnchor = document.getElementById('qualityAnchor');
//const audioAnchor = document.getElementById('audioAnchor');
let qualityHideTimer = null;
let audioHideTimer = null;

// تحديث وظائف القوائم للتحكم في ظهور شريط التقدم
function showPopover(popover) {
   
    popover.classList.add('show');
    
    // إضافة الكلاس الذي يخفي شريط التقدم
    player.classList.add('popover-open');
}

function closePopover(popover, timer) {
    clearTimeout(timer);
    popover.classList.remove('show');
    
    // إذا أغلقت كل القوائم، نعيد شريط التقدم
    if (!qualityPopover.classList.contains('show')) {
        player.classList.remove('popover-open');
    }
}

// تعديل اختيار الجودة ليكون متوافقاً مع المحاذاة الجديدة
function selectQuality(el) {
    document.querySelectorAll('#qualityPopover .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    // اختياري: إغلاق القائمة بعد الاختيار
    // closePopover(qualityPopover, qualityHideTimer);
}
// Quality popover hover
qualityAnchor.addEventListener('mouseenter', () => { clearTimeout(qualityHideTimer); showPopover(qualityPopover); });
qualityAnchor.addEventListener('mouseleave', () => { qualityHideTimer = setTimeout(() => closePopover(qualityPopover, qualityHideTimer), 200); });
qualityPopover.addEventListener('mouseenter', () => { clearTimeout(qualityHideTimer); });
qualityPopover.addEventListener('mouseleave', () => { qualityHideTimer = setTimeout(() => closePopover(qualityPopover, qualityHideTimer), 200); });

// Audio popover hover
// audioAnchor.addEventListener('mouseenter', () => { clearTimeout(audioHideTimer); showPopover(audioPopover); });
audioAnchor.addEventListener('mouseleave', () => { audioHideTimer = setTimeout(() => closePopover(audioPopover, audioHideTimer), 200); });
// audioPopover.addEventListener('mouseenter', () => { clearTimeout(audioHideTimer); });
// audioPopover.addEventListener('mouseleave', () => { audioHideTimer = setTimeout(() => closePopover(audioPopover, audioHideTimer), 200); });

// Selection functions
function selectQuality(el) {
    document.querySelectorAll('#qualityPopover .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function selectAudio(el) {
    document.querySelectorAll('#audioPopover .popover-body .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// Close popovers on outside click
document.addEventListener('click', (e) => {
    if (!qualityAnchor.contains(e.target) && !qualityPopover.contains(e.target)) {
        closePopover(qualityPopover, qualityHideTimer);
    }
    if (!audioAnchor.contains(e.target) && !audioPopover.contains(e.target)) {
        closePopover(audioPopover, audioHideTimer);
    }
});

// ===== CONTROLS VISIBILITY =====
let hideTimer;

function showControls() {
    player.classList.remove('controls-hidden');
    if (!qualityPopover.classList.contains('show') && !audioPopover.classList.contains('show')) {
        player.classList.remove('hide-cursor');
    }
    clearTimeout(hideTimer);
    if (!video.paused) {
        hideTimer = setTimeout(() => {
            if (qualityPopover.classList.contains('show') || audioPopover.classList.contains('show')) return;
            player.classList.add('controls-hidden', 'hide-cursor');
        }, 3000);
    }
}

player.addEventListener('mousemove', showControls);
player.addEventListener('mousedown', showControls);
video.addEventListener('play', showControls);

video.addEventListener('pause', () => {
    clearTimeout(hideTimer);
    player.classList.remove('controls-hidden', 'hide-cursor');
});

player.addEventListener('mouseleave', () => { if (isPlaying) hideTimer = setTimeout(() => { player.classList.add('controls-hidden', 'hide-cursor'); }, 1000); });
document.getElementById('bottomControls').addEventListener('mouseenter', () => clearTimeout(hideTimer));
document.getElementById('topBar').addEventListener('mouseenter', () => clearTimeout(hideTimer));

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); showControls(); break;
        case 'arrowright': e.preventDefault(); forwardBtn.click(); showControls(); break;
        case 'arrowleft': e.preventDefault(); rewardBtn.click(); showControls(); break;
        case 'arrowup': e.preventDefault(); volSlider.value = Math.min(1, parseFloat(volSlider.value) + 0.05); volSlider.dispatchEvent(new Event('input')); showControls(); showHint(`الصوت ${Math.round(volSlider.value * 100)}%`); break;
        case 'arrowdown': e.preventDefault(); volSlider.value = Math.max(0, parseFloat(volSlider.value) - 0.05); volSlider.dispatchEvent(new Event('input')); showControls(); showHint(`الصوت ${Math.round(volSlider.value * 100)}%`); break;
        case 'f': e.preventDefault(); toggleFS(); break;
        case 'm': e.preventDefault(); toggleMute(); showControls(); showHint(isMuted ? 'كتم الصوت' : 'تشغيل الصوت'); break;
        case 'c': e.preventDefault(); subtitleBtn.click(); break;
        case 'p': e.preventDefault(); pipBtn.click(); break;
    }
});

// ===== VIDEO EVENTS =====
video.addEventListener('loadedmetadata', () => { timeTotal.textContent = fmt(video.duration); });
video.addEventListener('timeupdate', () => { if (!dragging) updProgress(); });
video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration)
        progressBuffer.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100 + '%';
});
video.addEventListener('waiting', () => document.getElementById('loader').classList.add('show'));
video.addEventListener('canplay', () => document.getElementById('loader').classList.remove('show'));
video.addEventListener('play', () => {
    isPlaying = true;
    playPauseBtn.querySelector('.icon-pause').style.display = '';
    playPauseBtn.querySelector('.icon-play').style.display = 'none';
    centerPlay.classList.remove('show');
});
video.addEventListener('pause', () => {
    isPlaying = false;
    playPauseBtn.querySelector('.icon-pause').style.display = 'none';
    playPauseBtn.querySelector('.icon-play').style.display = '';
    centerPlay.classList.add('show');
});
video.addEventListener('ended', () => { showControls(); });

// ===== INIT =====
centerPlay.classList.add('show');
playPauseBtn.querySelector('.icon-pause').style.display = 'none';
playPauseBtn.querySelector('.icon-play').style.display = '';

document.getElementById('closeBtn').addEventListener('click', () => showHint('إغلاق'));
document.getElementById('moreBtn').addEventListener('click', () => showHint('المزيد'));
document.getElementById('titleLink').addEventListener('click', () => showHint('صفحة الفيديو'));
