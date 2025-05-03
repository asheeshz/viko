// --- Globals ---
const mainWidget = document.getElementById('main-widget');
const categoryButtonsContainer = document.querySelector('.category-buttons');
const categoryBanner = document.getElementById('category-banner'); // Get banner element
const allSearchContainers = document.querySelectorAll('.search-category-container');
// Get references to the templates for video sections BEFORE removing them
const videoSliderContainerTemplate = document.getElementById('video-slider-container');
const videoDisplayTemplate = document.getElementById('video-display');
// These will hold the currently attached elements
let currentVideoSliderContainer = null;
let currentVideoDisplay = null;

const messageBox = document.getElementById('messageBox');
// Get references to elements within the templates
const videoSlider = videoSliderContainerTemplate.querySelector('#video-slider');
const videoSliderNav = videoSliderContainerTemplate.querySelector('#video-slider-nav');
const youtubeIframe = videoDisplayTemplate.querySelector('#youtube-iframe');

const messageTexts = document.getElementById('message-texts'); // Container for message texts

let currentVideoItems = [];
let videoSlideIndex = 0;
let itemsPerPage = 4; // Default value
let activeSearchContainerId = null; // Track the currently open search box

// --- Initialization ---
window.onload = () => {
    // Remove templates from initial DOM
    if (videoSliderContainerTemplate) videoSliderContainerTemplate.remove();
    if (videoDisplayTemplate) videoDisplayTemplate.remove();

    showBanner(); // Ensure banner is visible initially
    itemsPerPage = calculateItemsPerPage(); // Calculate initial items per page
    setupCategoryButtons();
    setupOutsideClickListener();
};

// --- Banner Helper Functions ---
function showBanner() {
    if(categoryBanner) categoryBanner.style.display = 'block';
}
function hideBanner() {
     if(categoryBanner) categoryBanner.style.display = 'none';
}

// --- Helper function to get text from hidden message elements ---
function getTextById(id) {
    const element = messageTexts.querySelector(`#${id}`);
    if (element) { return element.textContent; }
    else { console.error(`Msg ID "${id}" not found.`); return `[${id}]`; }
}

// --- Category Button Logic ---
function setupCategoryButtons() {
    const buttons = categoryButtonsContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            toggleCategory(targetId);
        });
    });
}

// Function to detach video sections from their current parent
function detachVideoSections() {
    if (currentVideoSliderContainer && currentVideoSliderContainer.parentNode) {
        currentVideoSliderContainer.remove();
    }
    if (currentVideoDisplay && currentVideoDisplay.parentNode) {
        currentVideoDisplay.remove();
    }
    currentVideoSliderContainer = null;
    currentVideoDisplay = null;
}


function closeCurrentlyActiveCategory() {
    if (activeSearchContainerId) {
        const currentActiveContainer = document.getElementById(activeSearchContainerId);
        if (currentActiveContainer) {
            currentActiveContainer.classList.remove('active-search-box');
            detachVideoSections(); // Detach video sections when closing
        }
        activeSearchContainerId = null;
        showBanner(); // Show banner when the active category closes
    }
}


function toggleCategory(containerIdToShow) {
    const containerToShow = document.getElementById(containerIdToShow);
    if (!containerToShow) return;

    const isAlreadyActive = containerIdToShow === activeSearchContainerId;
    closeCurrentlyActiveCategory(); // Close previous (will show banner if this was the last one)

    if (!isAlreadyActive) { // Open the new one
        containerToShow.classList.add('active-search-box');
        activeSearchContainerId = containerIdToShow;

        // *** Clone and Append video sections to the newly active container ***
        // Clone from the original templates to ensure fresh state
        currentVideoSliderContainer = videoSliderContainerTemplate.cloneNode(true);
        currentVideoDisplay = videoDisplayTemplate.cloneNode(true);
        // Append the clones
        containerToShow.appendChild(currentVideoSliderContainer);
        containerToShow.appendChild(currentVideoDisplay);

        // ** IMPORTANT: Re-assign global JS variables to the new cloned elements **
        // Otherwise, JS will still reference the detached templates
        videoSlider = currentVideoSliderContainer.querySelector('#video-slider');
        videoSliderNav = currentVideoSliderContainer.querySelector('#video-slider-nav');
        youtubeIframe = currentVideoDisplay.querySelector('#youtube-iframe');

        clearVideoResults(); // Clear visuals (works on new elements)
        hideVideoSections(); // Start hidden (works on new elements)
        hideBanner(); // Hide banner when a category is opened
    }
    // If it was the same one (isAlreadyActive), it's now closed by closeCurrentlyActiveCategory,
    // and the banner was shown by that function.
    hideMessage(); // Hide any info message
}

// --- Click Outside Logic ---
function setupOutsideClickListener() {
    document.addEventListener('click', (event) => {
        if (!activeSearchContainerId) return; // Nothing active, ignore
        const activeContainer = document.getElementById(activeSearchContainerId);
        if (!activeContainer) { activeSearchContainerId = null; return; } // Safety check

        // Ignore clicks on category buttons or the banner itself
        if (event.target.closest('.category-buttons button') || event.target.closest('#category-banner')) return;

        // Close if click is outside the active container
        if (!activeContainer.contains(event.target)) {
            closeCurrentlyActiveCategory(); // This will also show the banner
        }
    });
}


// --- YouTube API Interaction ---
async function fetchYouTubeData(searchTerm = '') {
    const apiKey = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; // WARNING: Exposed API Key!
    if (apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 30) {
         console.error("API Key invalid");
         showMessage(getTextById('msgApiKeyError'), 5000);
         hideVideoSections();
         return;
    }
    const apiHost = 'youtube.googleapis.com';
    const maxResults = 30;
    let apiUrl = `https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;
    apiUrl += `&q=${encodeURIComponent(searchTerm || 'शैक्षणिक वीडियो हिंदी')}`;

    showMessage(getTextById('msgSearchingVideos'), 2500);
    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            let errorId = 'msgApiGenericErrorPrefix'; let errorDetails = `(${response.status})`;
            if (errorData.error?.message) {
                errorDetails += `: ${errorData.error.message}`;
                if (errorData.error.errors?.[0]?.reason === 'quotaExceeded') { errorId = 'msgApiQuotaError'; errorDetails = ''; }
                else if (errorData.error.errors?.[0]?.reason === 'keyInvalid') { errorId = 'msgApiKeyInvalid'; errorDetails = ''; }
            }
            throw new Error(getTextById(errorId) + errorDetails);
        }
        const data = await response.json();
        if (!data?.items || data.items.length === 0) {
            showMessage(getTextById('msgNoVideosFound'), 4000);
            hideVideoSections(); clearVideoResults(); currentVideoItems = []; return;
        }
        currentVideoItems = data.items;
        displayVideos(currentVideoItems);
        showVideoSections();
    } catch (error) {
        console.error('Fetch Error:', error);
        let displayError = error.message;
        if (!displayError.startsWith(getTextById('msgApiGenericErrorPrefix').substring(0,5)) && !displayError.startsWith(getTextById('msgApiKeyError').substring(0,5))) {
            displayError = `${getTextById('msgVideoLoadErrorPrefix')}: ${error.message}`;
        }
        showMessage(displayError, 6000);
        hideVideoSections(); clearVideoResults(); currentVideoItems = [];
    }
}

// --- Video Display ---
function displayVideos(videos) {
    // Ensure videoSlider is referencing the current DOM element
    if (!videoSlider) videoSlider = document.getElementById('video-slider');
    if (!videoSlider) { console.error("Video slider element not found!"); return; } // Added safety check

    videoSlider.innerHTML = ''; videoSlideIndex = 0;

    if (!videos || videos.length === 0) {
        videoSlider.innerHTML = `<p style="color:#ccc; padding: 20px;">${getTextById('msgNoVideosFound')}</p>`;
        if(videoSliderNav) videoSliderNav.style.display = 'none';
        if(youtubeIframe) youtubeIframe.src = '';
        if(currentVideoDisplay) currentVideoDisplay.style.display = 'none'; // Use current reference
        return;
    }

    videos.forEach((video, index) => {
        if (!video.id?.videoId || !video.snippet) return;
        const videoId = video.id.videoId; const videoTitle = video.snippet.title || 'Untitled Video';
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        const videoItem = document.createElement('div'); videoItem.classList.add('video-item'); videoItem.setAttribute('data-index', index);
        const thumbnail = document.createElement('img'); thumbnail.src = thumbnailUrl; thumbnail.alt = videoTitle;
        thumbnail.onerror = function() { this.onerror=null; this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; console.warn(`Thumb fail: ${thumbnailUrl}`); };
        const title = document.createElement('p'); const tempEl = document.createElement('textarea'); tempEl.innerHTML = videoTitle; title.textContent = tempEl.value;
        videoItem.appendChild(thumbnail); videoItem.appendChild(title);
        videoItem.addEventListener('click', () => {
            displayEmbeddedVideo(videoId);
            if (currentVideoDisplay) currentVideoDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        videoSlider.appendChild(videoItem);
    });

    if (videos.length > 0 && videos[0].id?.videoId) { displayEmbeddedVideo(videos[0].id.videoId); }
    else { if(youtubeIframe) youtubeIframe.src = ''; if(currentVideoDisplay) currentVideoDisplay.style.display = 'none'; }

    itemsPerPage = calculateItemsPerPage(); updateVideoSlider();
    if(videoSliderNav) videoSliderNav.style.display = currentVideoItems.length > itemsPerPage ? 'flex' : 'none';
}

function displayEmbeddedVideo(videoId) {
     // Ensure youtubeIframe references the current DOM element
    if (!youtubeIframe) youtubeIframe = document.getElementById('youtube-iframe');
    if (!youtubeIframe) { console.error("YouTube iframe not found!"); return; } // Added safety check

    if (!videoId) { youtubeIframe.src = ''; if(currentVideoDisplay) currentVideoDisplay.style.display = 'none'; return; }
    youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    if(currentVideoDisplay) currentVideoDisplay.style.display = 'block'; // Show player
    youtubeIframe.onerror = () => { console.error('iFrame fail:', videoId); showMessage(getTextById('msgVideoLoadFailed'), 3000); };
}

function clearVideoResults() {
    // Ensure references are to current DOM elements
    if (!videoSlider) videoSlider = document.getElementById('video-slider');
    if (!youtubeIframe) youtubeIframe = document.getElementById('youtube-iframe');

    if(videoSlider) videoSlider.innerHTML = '';
    if(youtubeIframe) youtubeIframe.src = '';
    currentVideoItems = []; videoSlideIndex = 0;
    // Keep video sections attached, just hide them
     hideVideoSections();
}

// --- Video Slider Navigation ---
function calculateItemsPerPage() {
    // Use the current reference if it exists, otherwise default
    const sliderContainerElement = currentVideoSliderContainer || document.getElementById('video-slider-container');
    if (!sliderContainerElement || sliderContainerElement.offsetWidth <= 0) { return 4; }
    const containerWidth = sliderContainerElement.offsetWidth - 20;
    const itemTotalWidth = 150 + 12;
    const calculatedItems = Math.max(1, Math.floor(containerWidth / itemTotalWidth));
    return calculatedItems;
}

function slideVideo(direction) {
    const numVideoItems = currentVideoItems.length;
    itemsPerPage = calculateItemsPerPage();
    if (numVideoItems <= itemsPerPage) return;
    const maxIndex = numVideoItems - itemsPerPage;
    videoSlideIndex = Math.max(0, Math.min(maxIndex, videoSlideIndex + direction));
    updateVideoSlider();
}

function updateVideoSlider() {
     // Ensure videoSlider references the current DOM element
    if (!videoSlider) videoSlider = document.getElementById('video-slider');
    if (!videoSlider) return; // Exit if not found

     if (currentVideoItems.length === 0) { videoSlider.style.transform = `translateX(0px)`; return; };
    const itemWidth = 150; const itemMargin = 12;
    const slideAmount = -videoSlideIndex * (itemWidth + itemMargin);
    videoSlider.style.transform = `translateX(${slideAmount}px)`;
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Use the current reference
        const sliderContainerElement = currentVideoSliderContainer;
         if (sliderContainerElement && document.body.contains(sliderContainerElement)) {
            itemsPerPage = calculateItemsPerPage();
            const maxIndex = Math.max(0, currentVideoItems.length - itemsPerPage);
            videoSlideIndex = Math.min(videoSlideIndex, maxIndex);
            updateVideoSlider();
             // Ensure videoSliderNav references the current DOM element
            if (!videoSliderNav) videoSliderNav = currentVideoSliderContainer.querySelector('#video-slider-nav');
            if (videoSliderNav) videoSliderNav.style.display = currentVideoItems.length > itemsPerPage ? 'flex' : 'none';
        }
    }, 250);
});

// --- Search Logic ---
function performSearch(searchBoxId) {
    const searchBox = document.getElementById(searchBoxId);
    if (!searchBox) { console.error("Search box not found:", searchBoxId); return; }
    let finalSearchTerm = ''; let dropdownSelectionMade = false; let dropdownSearchTerm = '';
    const selects = searchBox.querySelectorAll('select');
    selects.forEach(select => { if (select.value?.trim()) { dropdownSearchTerm += select.value.trim() + ' '; dropdownSelectionMade = true; } });
    const textInput = searchBox.querySelector('.custom-search-input');
    const textValue = textInput ? textInput.value.trim() : '';
    if (textValue) { finalSearchTerm = (dropdownSearchTerm + textValue).trim(); }
    else if (dropdownSelectionMade) { finalSearchTerm = dropdownSearchTerm.trim(); }
    else { showMessage(getTextById('msgValidationError'), 4000); return; }
    hideMessage();
    fetchYouTubeData(finalSearchTerm);
}

// --- UI Helper Functions ---
function showVideoSections() {
    // Use current references
    if (!currentVideoSliderContainer) currentVideoSliderContainer = document.getElementById('video-slider-container');
    if (!currentVideoDisplay) currentVideoDisplay = document.getElementById('video-display');
    if (!videoSliderNav) videoSliderNav = currentVideoSliderContainer?.querySelector('#video-slider-nav'); // Optional chaining
    if (!youtubeIframe) youtubeIframe = currentVideoDisplay?.querySelector('#youtube-iframe');

    if (currentVideoItems.length > 0) {
        if(currentVideoSliderContainer) currentVideoSliderContainer.style.display = 'block';
         if (youtubeIframe && youtubeIframe.src && youtubeIframe.src !== 'about:blank') {
             if (currentVideoDisplay) currentVideoDisplay.style.display = 'block';
         } else {
             if (currentVideoDisplay) currentVideoDisplay.style.display = 'none';
         }
        itemsPerPage = calculateItemsPerPage(); // Recalculate items per page
        if(videoSliderNav) videoSliderNav.style.display = currentVideoItems.length > itemsPerPage ? 'flex' : 'none';
    } else { hideVideoSections(); }
}

function hideVideoSections() {
    // Use current references
    if (!currentVideoSliderContainer) currentVideoSliderContainer = document.getElementById('video-slider-container');
    if (!currentVideoDisplay) currentVideoDisplay = document.getElementById('video-display');
    if (!videoSliderNav && currentVideoSliderContainer) videoSliderNav = currentVideoSliderContainer.querySelector('#video-slider-nav'); // Try to find if exists

    if(currentVideoSliderContainer) currentVideoSliderContainer.style.display = 'none';
    if(currentVideoDisplay) currentVideoDisplay.style.display = 'none';
    if(videoSliderNav) videoSliderNav.style.display = 'none';
}

let messageTimeout;
function showMessage(messageText, duration = 3000) {
    clearTimeout(messageTimeout);
    if (messageText) {
        messageBox.textContent = messageText;
        messageBox.style.display = 'block';
        messageTimeout = setTimeout(hideMessage, duration);
    } else {
        console.error("showMessage called with invalid text.");
        messageBox.textContent = getTextById('msgInternalError');
        messageBox.style.display = 'block';
        messageTimeout = setTimeout(hideMessage, duration);
    }
}

function hideMessage() {
    clearTimeout(messageTimeout);
    messageBox.style.display = 'none';
}
