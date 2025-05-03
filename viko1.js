// ================================= //
//  Search Widget Script v1.0.0.1    //
// ================================= //
const searchWidget = (function() {
    'use strict';

    // --- Configuration ---
    const WIDGET_SELECTOR = '.sw-container'; // Matched HTML root class
    const API_KEY = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; // <<< DEMO API KEY (REPLACE!)
    const MAX_RESULTS = 30;
    const API_HOST = 'www.googleapis.com';
    const REGION_CODE = 'IN';
    const DEBOUNCE_DELAY = 250; // ms

    // --- DOM Element Cache ---
    let elements = {};

    // --- State Variables ---
    let currentVideoItems = [];
    let videoSlideIndex = 0;
    let itemsPerPage = 1;
    let messageTimeout = null;
    let resizeTimeout = null;
    let isFetching = false;

    // --- Initialization ---
    function cacheElements() {
        elements.widgetRoot = document.querySelector(WIDGET_SELECTOR);
        if (!elements.widgetRoot) return false; // Stop if root is missing

        elements.videoResultsSection = elements.widgetRoot.querySelector('.sw-video-results-section');
        if (elements.videoResultsSection) {
            elements.videoSliderContainer = elements.videoResultsSection.querySelector('#sw-video-slider-container');
            elements.videoDisplay = elements.videoResultsSection.querySelector('#sw-video-display');
            elements.videoSliderNav = elements.videoResultsSection.querySelector('#sw-video-slider-nav');
            elements.messageBox = elements.videoResultsSection.querySelector('#sw-message-box');
             if (!elements.messageBox) elements.messageBox = elements.widgetRoot.querySelector('#sw-message-box'); // Fallback check
            elements.videoSlider = elements.videoResultsSection.querySelector('#sw-video-slider');
            elements.youtubeIframe = elements.videoResultsSection.querySelector('#sw-youtube-iframe');
        }

        // Check if all essential elements are found
        const essentialElements = [elements.widgetRoot, elements.videoResultsSection, elements.videoSliderContainer, elements.videoDisplay, elements.videoSliderNav, elements.messageBox, elements.videoSlider, elements.youtubeIframe];
        if (essentialElements.some(el => !el)) {
            console.error("Search Widget Error: Could not find all necessary HTML elements. Check structure and IDs/classes starting with 'sw-'.", elements);
            // Optionally display an error within the widget
            // const header = elements.widgetRoot.querySelector('.sw-header-container');
            // if (header) header.innerHTML += "<p style='color:#ff4d4d;text-align:center;padding:10px;'>Error: Widget cannot load correctly.</p>";
            return false;
        }
        return true;
    }

    function init() {
        if (!cacheElements()) return; // Stop if elements not found

        hideVideoSections();
        elements.widgetRoot.querySelectorAll('.sw-search-category-container').forEach(container => {
            container.style.display = 'none';
        });

        window.addEventListener('load', () => {
             itemsPerPage = calculateItemsPerPage(); // Calculate after load
             updateNavButtonVisibility(); // Initial visibility check
        });
        window.addEventListener('resize', handleResize);

        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') { // Use actual placeholder check
             console.warn("Search Widget Warning: YouTube API Key is missing or is a placeholder in script.js.");
             // Show a persistent message if needed
             // showMessage("चेतावनी: API कुंजी सेटअप नहीं है।", 10000);
        }
        console.log("Search widget initialized successfully.");
    }

    // --- Category Visibility ---
    function showCategory(containerIdToShow) {
        if (!elements.widgetRoot) return;
        let currentlyVisibleId = null;
        const allContainers = elements.widgetRoot.querySelectorAll('.sw-search-category-container');
        const containerToShow = elements.widgetRoot.querySelector(`#${containerIdToShow}`);

        if (!containerToShow) {
            console.error(`Container not found: #${containerIdToShow}`);
            return;
        }

        allContainers.forEach(container => {
            if (container.style.display === 'block') currentlyVisibleId = container.id;
            if (container.id !== containerIdToShow) container.style.display = 'none';
        });

        const wasVisible = currentlyVisibleId === containerIdToShow;
        containerToShow.style.display = wasVisible ? 'none' : 'block'; // Toggle display

        if (containerToShow.style.display === 'block') {
             // Scroll into view only if opening a new one or reopening
             setTimeout(() => containerToShow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
             // Always hide results when opening/switching category forms
             hideVideoSections();
             clearVideoResults();
        } else if (wasVisible) {
            // If it was toggled off, also hide results
             hideVideoSections();
             clearVideoResults();
        }

        hideMessage();
    }

    // --- YouTube API Interaction ---
    async function fetchYouTubeData(searchTerm = '') {
        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') { // Re-check placeholder
            showMessage("त्रुटि: API कुंजी सेटअप नहीं है।", 6000); return;
        }
        if (!elements.videoResultsSection || !elements.videoSliderContainer) {
            showMessage("त्रुटि: परिणाम तत्व नहीं मिले।", 5000); return;
        }
        if (isFetching) return; // Prevent overlapping requests

        const safeSearchTerm = searchTerm || 'नवीनतम भारत शैक्षणिक वीडियो'; // Safer fallback
        let apiUrl = `https://${API_HOST}/youtube/v3/search?part=snippet&type=video&maxResults=${MAX_RESULTS}&key=${API_KEY}®ionCode=${REGION_CODE}&safeSearch=moderate&q=${encodeURIComponent(safeSearchTerm)}`;

        console.log('API Request:', apiUrl);
        showMessage("वीडियो खोजे जा रहे हैं...", 4000); // Longer display time
        setSearchButtonsState(true);
        isFetching = true;

        try {
            const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (!response.ok) {
                let errorData = { error: { message: `HTTP त्रुटि ${response.status}`}};
                try { errorData = await response.json(); } catch (e) {}
                console.error('API Error:', errorData);
                throw new Error(parseApiErrorMessage(errorData, response.status));
            }

            const data = await response.json();
            // Filter more strictly: ensure necessary fields exist
            currentVideoItems = (data.items || []).filter(item =>
                item.id?.videoId &&
                item.snippet?.title &&
                item.snippet.thumbnails?.medium?.url
            );

            if (currentVideoItems.length === 0) {
                showMessage("इस खोज के लिए कोई वीडियो नहीं मिला। कृपया पुनः प्रयास करें।", 4000);
                hideVideoSections();
                clearVideoResults();
            } else {
                displayVideos(currentVideoItems); // Pass filtered items
                showVideoSections(); // Show section only if we have valid results
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            showMessage(`वीडियो लोड करने में त्रुटि: ${error.message}`, 7000); // Show error longer
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
         // Check for common, user-understandable errors first
         if (message.includes('keyInvalid')) return "API कुंजी अमान्य है।";
         if (message.includes('quotaExceeded')) return "API सीमा समाप्त। बाद में प्रयास करें।";
         if (message.includes('accessNotConfigured') || message.includes('disabled')) return "API सक्षम नहीं है।";
         // Fallback to generic or first part of message
         if (message) return `${baseMessage}: ${message.split(/[\.\(]/)[0]}`;
         return baseMessage;
    }

    // --- Video Display ---
    function displayVideos(videos) {
        if (!elements.videoSlider) return;
        elements.videoSlider.innerHTML = ''; // Clear previous thumbnails
        videoSlideIndex = 0;

        if (!videos || videos.length === 0) { // Should not happen if called correctly, but safeguard
             hideVideoSections();
             return;
        }

        videos.forEach(video => {
            const videoId = video.id.videoId;
            const videoTitle = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.medium.url;

            const videoItem = document.createElement('div');
            videoItem.className = 'sw-video-item';

            const thumbnail = document.createElement('img');
            thumbnail.src = thumbnailUrl;
            thumbnail.alt = ''; // Decorative
            thumbnail.loading = 'lazy';
            thumbnail.setAttribute('aria-hidden', 'true');
            // Simple hide on error is better than placeholder sometimes
            thumbnail.onerror = () => { videoItem.style.display = 'none'; console.warn(`Thumbnail failed: ${videoId}`); };

            const infoDiv = document.createElement('div'); // Container for text
            infoDiv.className = 'sw-video-info';

            const title = document.createElement('p');
            const tempElem = document.createElement('textarea');
            tempElem.innerHTML = videoTitle;
            title.textContent = tempElem.value;

            infoDiv.appendChild(title); // Add title to info div
            videoItem.appendChild(thumbnail);
            videoItem.appendChild(infoDiv); // Add info div below image

            videoItem.addEventListener('click', () => {
                displayEmbeddedVideo(videoId);
                elements.videoDisplay?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            elements.videoSlider.appendChild(videoItem);
        });

        if (videos.length > 0) displayEmbeddedVideo(videos[0].id.videoId);
        else if(elements.youtubeIframe) elements.youtubeIframe.src = '';

        // Recalculate and update slider/nav
        requestAnimationFrame(() => { // Ensure layout is calculated
            itemsPerPage = calculateItemsPerPage();
            updateVideoSlider();
            updateNavButtonVisibility();
        });
    }

    function displayEmbeddedVideo(videoId) {
        if (!elements.youtubeIframe || !videoId) {
             console.warn("Cannot display video: Iframe or Video ID missing.");
             if(elements.youtubeIframe) elements.youtubeIframe.src = ''; // Clear iframe if ID missing
             return;
        }
        elements.youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&iv_load_policy=3`; // Added iv_load_policy
        console.log(`Loading video: ${videoId}`);
    }

    function clearVideoResults() {
        if (elements.videoSlider) elements.videoSlider.innerHTML = '';
        if (elements.youtubeIframe) elements.youtubeIframe.src = '';
        currentVideoItems = [];
        videoSlideIndex = 0; // Reset index too
        updateNavButtonVisibility(); // Hide nav when cleared
    }

    // --- Video Slider Navigation ---
    function calculateItemsPerPage() {
        if (!elements.videoSliderContainer || !elements.videoSlider) return 1;
        const containerWidth = elements.videoSliderContainer.clientWidth - 100; // Effective width
        const firstItem = elements.videoSlider.querySelector('.sw-video-item');
        // Use offsetWidth for actual rendered width including padding/border
        const itemOuterWidth = firstItem ? firstItem.offsetWidth + (parseInt(getComputedStyle(firstItem).marginRight || '0') * 2) : 166; // Default guess
        if (containerWidth <= 0 || itemOuterWidth <= 0) return 1;
        return Math.max(1, Math.floor(containerWidth / itemOuterWidth));
    }

    function slideVideo(direction) {
         // Prevent sliding if unnecessary or during fetch? (Optional)
         if (currentVideoItems.length <= itemsPerPage || isFetching) return;

         const firstItem = elements.videoSlider.querySelector('.sw-video-item');
         const itemOuterWidth = firstItem ? firstItem.offsetWidth + (parseInt(getComputedStyle(firstItem).marginRight || '0') * 2) : 166;

         const newIndex = videoSlideIndex + direction * itemsPerPage;
         // Clamp index correctly
         videoSlideIndex = Math.max(0, Math.min(newIndex, currentVideoItems.length - itemsPerPage));
         updateVideoSlider(itemOuterWidth);
    }

    function updateVideoSlider(itemWidth = null) {
        if (!elements.videoSlider || currentVideoItems.length === 0) return;
         if (!itemWidth) { // Recalculate if not passed
             const firstItem = elements.videoSlider.querySelector('.sw-video-item');
             itemWidth = firstItem ? firstItem.offsetWidth + (parseInt(getComputedStyle(firstItem).marginRight || '0') * 2) : 166;
         }
         if (itemWidth <=0) return; // Avoid division by zero or invalid transform

        const slideAmount = -videoSlideIndex * itemWidth;
        elements.videoSlider.style.transform = `translateX(${slideAmount}px)`;
    }

     function updateNavButtonVisibility() {
         if (!elements.videoSliderNav) return;
         // Check if there are more items than can fit
         const shouldShowNav = currentVideoItems.length > itemsPerPage;
         elements.videoSliderNav.style.display = shouldShowNav ? 'flex' : 'none';
     }

    // --- Search Logic ---
    function performSearch(searchBoxId) {
        const searchBox = elements.widgetRoot?.querySelector(`#${searchBoxId}`);
        if (!searchBox) { console.error("Search box not found:", searchBoxId); return; }

        let finalSearchTerm = '', dropdownSelectionMade = false, dropdownSearchTerm = '';
        searchBox.querySelectorAll('select').forEach(select => {
            if (select.value?.trim()) {
                dropdownSearchTerm += select.value.trim() + ' ';
                dropdownSelectionMade = true;
            }
        });

        const textInput = searchBox.querySelector('.sw-custom-search-input');
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
        fetchYouTubeData(finalSearchTerm); // Call the async function
    }

     function setSearchButtonsState(disabled) {
         elements.widgetRoot?.querySelectorAll('.sw-search-button').forEach(button => {
             button.disabled = disabled;
             // CSS will handle visual state using :disabled pseudo-class
         });
     }

    // --- UI Helper Functions ---
    function showVideoSections() {
        if(elements.videoResultsSection) {
            elements.videoResultsSection.style.display = 'block';
            // Use requestAnimationFrame to ensure display:block is applied before calculations
            requestAnimationFrame(() => {
                 itemsPerPage = calculateItemsPerPage();
                 updateNavButtonVisibility();
                 updateVideoSlider();
                // Scroll results into view
                setTimeout(() => elements.videoResultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); // Shorter delay
            });
        }
    }

    function hideVideoSections() {
        if (elements.videoResultsSection) elements.videoResultsSection.style.display = 'none';
    }

    function showMessage(message, duration = 4000) { // Increased default duration
        if (!elements.messageBox) return;
        clearTimeout(messageTimeout);
        elements.messageBox.textContent = message;
        elements.messageBox.style.display = 'block';
        // Force animation restart
        elements.messageBox.style.animation = 'none';
        void elements.messageBox.offsetWidth; // Trigger reflow
        elements.messageBox.style.animation = 'messageFadeInSlideUp 0.5s ease-out forwards';
        messageTimeout = setTimeout(hideMessage, duration);
    }

    function hideMessage() {
        if (elements.messageBox) elements.messageBox.style.display = 'none';
    }

    // Debounced resize handler
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (elements.videoResultsSection?.style.display === 'block') { // Only if visible
                const oldItemsPerPage = itemsPerPage;
                itemsPerPage = calculateItemsPerPage();
                // Only update slider if itemsPerPage changed to avoid unnecessary shifts
                if (oldItemsPerPage !== itemsPerPage) {
                    // Adjust slideIndex if necessary after resize? Maybe not needed if clamping works.
                    updateVideoSlider();
                    updateNavButtonVisibility();
                }
            }
        }, DEBOUNCE_DELAY);
    }

    // --- Initialize the Widget ---
    // Use DOMContentLoaded to ensure HTML is parsed before JS runs
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // DOM is already ready
    }

    // --- Publicly Exposed Functions ---
    // Return the object with functions needed by HTML onclick handlers
    return {
        showCategory: showCategory,
        performSearch: performSearch,
        slideVideo: slideVideo
    };

})(); // End of searchWidget IIFE
