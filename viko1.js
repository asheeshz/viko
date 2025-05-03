// Wrap everything in an object to avoid global scope pollution
// and make functions accessible via this object in HTML onclick
const searchWidget = (function() {
    'use strict';

    // --- Globals / Configuration ---
    const WIDGET_SELECTOR = '.search-widget-container';
    const API_KEY = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; // <<< YOUR API KEY HERE (Or keep demo)
    const MAX_RESULTS = 30;
    const API_HOST = 'www.googleapis.com';
    const REGION_CODE = 'IN';
    const DEBOUNCE_DELAY = 250; // ms for resize events

    // --- DOM Element References ---
    let widgetRoot = null;
    let videoResultsSection = null;
    let videoSliderContainer = null;
    let videoDisplay = null;
    let videoSliderNav = null;
    let messageBox = null;
    let videoSlider = null;
    let youtubeIframe = null;

    // --- State Variables ---
    let currentVideoItems = [];
    let videoSlideIndex = 0;
    let itemsPerPage = 1;
    let messageTimeout = null;
    let resizeTimeout = null;
    let isFetching = false; // Prevent multiple simultaneous fetches

    // --- Initialization ---
    function init() {
        widgetRoot = document.querySelector(WIDGET_SELECTOR);
        if (!widgetRoot) {
            console.error(`Search Widget Error: Root container '${WIDGET_SELECTOR}' not found.`);
            return;
        }

        // Find elements relative to the widget root
        videoResultsSection = widgetRoot.querySelector('.video-results-section');
        if (videoResultsSection) {
            videoSliderContainer = videoResultsSection.querySelector('#video-slider-container');
            videoDisplay = videoResultsSection.querySelector('#video-display');
            videoSliderNav = videoResultsSection.querySelector('#video-slider-nav');
            messageBox = videoResultsSection.querySelector('#messageBox'); // Often outside results, check root too?
             if (!messageBox) messageBox = widgetRoot.querySelector('#messageBox'); // Fallback check
            videoSlider = videoResultsSection.querySelector('#video-slider');
            youtubeIframe = videoResultsSection.querySelector('#youtube-iframe');
        }

        if (!videoResultsSection || !videoSliderContainer || !videoDisplay || !videoSliderNav || !messageBox || !videoSlider || !youtubeIframe) {
            console.error("Search Widget Error: Could not find all necessary video result elements. Check HTML structure.");
            // Optionally display an error message within the widget
            // const header = widgetRoot.querySelector('.stylish-header-container');
            // if (header) header.innerHTML += "<p style='color:#ff4d4d;text-align:center;padding:10px;'>Error: Video results cannot load.</p>";
            return;
        }

        hideVideoSections(); // Hide video section initially
        // Hide all search category containers initially
        const allSearchContainers = widgetRoot.querySelectorAll('.search-category-container');
        allSearchContainers.forEach(container => container.style.display = 'none');

        // Calculate initial itemsPerPage after layout settles
        window.addEventListener('load', () => {
            itemsPerPage = calculateItemsPerPage();
        });
        // Add resize listener
        window.addEventListener('resize', handleResize);

        // Basic API Key check on init
        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
             console.warn("Search Widget Warning: YouTube API Key is missing or is a placeholder.");
             // Optionally show a persistent warning if needed, but messages handle runtime errors
        }

        console.log("Search widget initialized.");
    }

    // --- Category Visibility ---
    function showCategory(containerIdToShow) {
        if (!widgetRoot) return;
        let currentlyVisible = null;
        const allContainers = widgetRoot.querySelectorAll('.search-category-container');
        const containerToShow = widgetRoot.querySelector(`#${containerIdToShow}`);

        if (!containerToShow) {
            console.error(`Container not found: #${containerIdToShow}`);
            return;
        }

        allContainers.forEach(container => {
            if (container.style.display === 'block') currentlyVisible = container.id;
            if (container.id !== containerIdToShow) container.style.display = 'none';
        });

        if (currentlyVisible === containerIdToShow) {
            containerToShow.style.display = 'none'; // Toggle off
            hideVideoSections();
            clearVideoResults();
        } else {
            containerToShow.style.display = 'block'; // Show
            setTimeout(() => containerToShow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            hideVideoSections();
            clearVideoResults();
        }
        hideMessage();
    }

    // --- YouTube API Interaction ---
    async function fetchYouTubeData(searchTerm = '') {
        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
            showMessage("त्रुटि: API कुंजी सेटअप नहीं है।", 6000);
            return;
        }
        if (!videoResultsSection || !videoSliderContainer) {
            showMessage("त्रुटि: परिणाम दिखाने के लिए तत्व नहीं मिले।", 5000);
            return;
        }
        if (isFetching) {
            console.warn("Fetch already in progress. Ignoring new request.");
            return; // Prevent multiple fetches
        }

        let apiUrl = `https://${API_HOST}/youtube/v3/search?part=snippet&type=video&maxResults=${MAX_RESULTS}&key=${API_KEY}®ionCode=${REGION_CODE}`;
        apiUrl += `&q=${encodeURIComponent(searchTerm || 'भारत नवीनतम शैक्षणिक वीडियो')}`;

        console.log('API Request:', apiUrl);
        showMessage("वीडियो खोजे जा रहे हैं...", 3000);
        setSearchButtonsState(true);
        isFetching = true;

        try {
            const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (!response.ok) {
                let errorData = { error: { message: `HTTP Error ${response.status}`}};
                try { errorData = await response.json(); } catch (e) {}
                console.error('API Error:', errorData);
                throw new Error(parseApiErrorMessage(errorData, response.status)); // Throw parsed error
            }

            const data = await response.json();
            currentVideoItems = (data.items || []).filter(item => item.id?.videoId && item.snippet?.thumbnails?.medium?.url && item.snippet?.title);

            if (currentVideoItems.length === 0) {
                showMessage("इस खोज के लिए कोई वीडियो नहीं मिला। कृपया पुनः प्रयास करें।", 4000);
                hideVideoSections();
                clearVideoResults();
            } else {
                displayVideos(currentVideoItems);
                showVideoSections();
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            showMessage(`वीडियो लोड करने में त्रुटि: ${error.message}`, 6000);
            hideVideoSections();
            clearVideoResults();
        } finally {
            setSearchButtonsState(false);
            isFetching = false;
        }
    }

    function parseApiErrorMessage(errorData, status) {
         let baseMessage = `API त्रुटि (${status})`;
         const message = errorData?.error?.message || '';
         if (message.includes('keyInvalid')) return "API त्रुटि: कुंजी अमान्य है।";
         if (message.includes('quotaExceeded')) return "API त्रुटि: दैनिक कोटा समाप्त।";
         if (message.includes('accessNotConfigured')) return "API त्रुटि: API सक्षम नहीं है।";
         if (message) return `${baseMessage}: ${message.split(/[\.\(]/)[0]}`; // Get first part
         return baseMessage;
    }


    // --- Video Display ---
    function displayVideos(videos) {
        if (!videoSlider) return;
        videoSlider.innerHTML = '';
        videoSlideIndex = 0;

        if (!videos || videos.length === 0) {
             // This case should be handled before calling displayVideos, but as fallback:
             videoSlider.innerHTML = '<p style="color:#555; padding: 20px; text-align: center;">कोई वीडियो उपलब्ध नहीं है।</p>';
             updateNavButtonVisibility(); // Ensure nav is hidden
             return;
        }

        videos.forEach(video => {
            const videoId = video.id.videoId;
            const videoTitle = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.medium.url;

            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';

            const thumbnail = document.createElement('img');
            thumbnail.src = thumbnailUrl;
            thumbnail.alt = ''; // Alt text can be redundant with title below
            thumbnail.loading = 'lazy';
            thumbnail.setAttribute('aria-hidden', 'true'); // Decorative image
            thumbnail.onerror = () => { thumbnail.style.display='none'; }; // Hide broken images

            const title = document.createElement('p');
            const tempElem = document.createElement('textarea');
            tempElem.innerHTML = videoTitle; // Decode entities
            title.textContent = tempElem.value;

            videoItem.appendChild(thumbnail);
            videoItem.appendChild(title);

            videoItem.addEventListener('click', () => {
                displayEmbeddedVideo(videoId);
                videoDisplay?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            videoSlider.appendChild(videoItem);
        });

        if (videos.length > 0) displayEmbeddedVideo(videos[0].id.videoId);
        else if(youtubeIframe) youtubeIframe.src = '';

        itemsPerPage = calculateItemsPerPage(); // Recalculate after adding items
        updateVideoSlider();
        updateNavButtonVisibility();
    }

    function displayEmbeddedVideo(videoId) {
        if (!youtubeIframe || !videoId) return;
        // Use -nocookie domain for privacy
        youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    }

    function clearVideoResults() {
        if (videoSlider) videoSlider.innerHTML = '';
        if (youtubeIframe) youtubeIframe.src = '';
        currentVideoItems = [];
         // Ensure nav buttons are hidden when results cleared
        updateNavButtonVisibility();
    }

    // --- Video Slider Navigation ---
    function calculateItemsPerPage() {
        if (!videoSliderContainer || !videoSlider) return 1;
        // Calculate based on container's clientWidth and item's offsetWidth
        const containerWidth = videoSliderContainer.clientWidth - 110; // Approx padding/nav space
        const firstItem = videoSlider.querySelector('.video-item');
        const itemOuterWidth = firstItem ? firstItem.offsetWidth + (parseInt(getComputedStyle(firstItem).marginRight) * 2) : 174; // Width + Margin L+R
        if (containerWidth <= 0 || itemOuterWidth <= 0) return 1;
        return Math.max(1, Math.floor(containerWidth / itemOuterWidth));
    }

    function slideVideo(direction) {
         if (currentVideoItems.length <= itemsPerPage) return; // Don't slide if not needed
         const firstItem = videoSlider.querySelector('.video-item');
         const itemOuterWidth = firstItem ? firstItem.offsetWidth + (parseInt(getComputedStyle(firstItem).marginRight) * 2) : 174;

         const newIndex = videoSlideIndex + direction * itemsPerPage;
         // Clamp index
         videoSlideIndex = Math.max(0, Math.min(newIndex, currentVideoItems.length - itemsPerPage));
         updateVideoSlider(itemOuterWidth); // Pass width for efficiency
    }

    function updateVideoSlider(itemWidth = null) {
        if (!videoSlider || currentVideoItems.length === 0) return;
         if (!itemWidth) {
             const firstItem = videoSlider.querySelector('.video-item');
             itemWidth = firstItem ? firstItem.offsetWidth + (parseInt(getComputedStyle(firstItem).marginRight) * 2) : 174;
         }
        const slideAmount = -videoSlideIndex * itemWidth;
        videoSlider.style.transform = `translateX(${slideAmount}px)`;
    }

     function updateNavButtonVisibility() {
         if (!videoSliderNav) return;
         // Show nav only if there are more items than fit on one page
         videoSliderNav.style.display = (currentVideoItems.length > itemsPerPage) ? 'flex' : 'none';
     }

    // --- Search Logic ---
    function performSearch(searchBoxId) {
        const searchBox = widgetRoot.querySelector(`#${searchBoxId}`);
        if (!searchBox) { console.error("Search box not found:", searchBoxId); return; }

        let finalSearchTerm = '', dropdownSelectionMade = false, dropdownSearchTerm = '';
        const selects = searchBox.querySelectorAll('select');
        selects.forEach(select => {
            if (select.value?.trim()) {
                dropdownSearchTerm += select.value.trim() + ' ';
                dropdownSelectionMade = true;
            }
        });

        const textInput = searchBox.querySelector('.custom-search-input');
        const textValue = textInput?.value.trim() || '';

        if (textValue) {
            if (!dropdownSelectionMade) {
                showMessage("टेक्स्ट खोज के साथ, कम से कम एक ड्रॉपडाउन भी चुनें।", 4000); return;
            }
            finalSearchTerm = (dropdownSearchTerm + textValue).trim();
        } else {
            if (!dropdownSelectionMade) {
                showMessage("कृपया कम से कम एक ड्रॉपडाउन चुनें या टाइप करें।", 4000); return;
            }
            finalSearchTerm = dropdownSearchTerm.trim();
        }

        hideMessage();
        console.log('Performing search for:', finalSearchTerm);
        fetchYouTubeData(finalSearchTerm);
    }

     function setSearchButtonsState(disabled) {
         widgetRoot.querySelectorAll('.search-button').forEach(button => {
             button.disabled = disabled;
             // button.style.opacity = disabled ? 0.6 : 1; // Style handled in CSS now
             // button.style.cursor = disabled ? 'not-allowed' : 'pointer';
         });
     }

    // --- UI Helper Functions ---
    function showVideoSections() {
        if (videoResultsSection) videoResultsSection.style.display = 'block';
         // Wait for display block to apply, then calculate/update
        requestAnimationFrame(() => {
             itemsPerPage = calculateItemsPerPage();
             updateNavButtonVisibility();
             updateVideoSlider();
            // Scroll results into view
            setTimeout(() => videoResultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        });
    }

    function hideVideoSections() {
        if (videoResultsSection) videoResultsSection.style.display = 'none';
    }

    function showMessage(message, duration = 3500) { // Default longer duration
        if (!messageBox) return;
        clearTimeout(messageTimeout);
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        messageBox.style.animation = 'none'; // Reset for replay
        void messageBox.offsetWidth; // Trigger reflow
        messageBox.style.animation = 'messageSlideUp 0.6s ease-out forwards';
        messageTimeout = setTimeout(hideMessage, duration);
    }

    function hideMessage() {
        if (messageBox) messageBox.style.display = 'none';
    }

    // Debounced resize handler
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (videoResultsSection?.style.display === 'block') {
                itemsPerPage = calculateItemsPerPage();
                updateVideoSlider();
                updateNavButtonVisibility();
            }
        }, DEBOUNCE_DELAY);
    }

    // --- Initialize the Widget ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // DOM is already ready
    }

    // --- Publicly Exposed Functions ---
    // Make functions needed by HTML onclick handlers available
    return {
        showCategory: showCategory,
        performSearch: performSearch,
        slideVideo: slideVideo
    };

})(); // End of IIFE / searchWidget object definition
