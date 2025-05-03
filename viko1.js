// --- Globals (Prefixed) ---
const vsw_mainWidget = document.getElementById('vsw-main-widget');
const vsw_categoryButtonsContainer = vsw_mainWidget ? vsw_mainWidget.querySelector('.vsw-category-buttons') : null; // Scope to widget
const vsw_categoryBanner = vsw_mainWidget ? vsw_mainWidget.querySelector('#vsw-category-banner') : null; // Scope to widget
const vsw_allSearchContainers = vsw_mainWidget ? vsw_mainWidget.querySelectorAll('.vsw-search-category-container') : []; // Scope to widget
// These are dynamically added/removed, find them when needed or assume they are children of vsw_mainWidget if present
let vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
let vsw_videoDisplay = document.getElementById('vsw-video-display');
let vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');
let vsw_videoSlider = document.getElementById('vsw-video-slider');
let vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
// These are outside the main widget but needed globally
const vsw_messageBox = document.getElementById('vsw-messageBox');
const vsw_messageTexts = document.getElementById('vsw-message-texts'); // Container for hidden texts

let vsw_currentVideoItems = [];
let vsw_videoSlideIndex = 0;
let vsw_itemsPerPage = 4; // Default, calculated later
let vsw_activeSearchContainerId = null;
let vsw_messageTimeout;
let vsw_resizeTimeout;

// --- Initialization ---
// Run logic after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get references again after DOM load, especially for dynamic elements if they were in initial HTML
    vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
    vsw_videoDisplay = document.getElementById('vsw-video-display');
    vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');
    vsw_videoSlider = document.getElementById('vsw-video-slider');
    vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');


    // Check if elements exist before manipulating them
    // Remove video sections if they exist in the initial HTML (they shouldn't be)
    if (vsw_videoSliderContainer && vsw_videoSliderContainer.parentNode) {
        vsw_videoSliderContainer.parentNode.removeChild(vsw_videoSliderContainer);
    }
    if (vsw_videoDisplay && vsw_videoDisplay.parentNode) {
        vsw_videoDisplay.parentNode.removeChild(vsw_videoDisplay);
    }
     if (vsw_messageTexts) {
         vsw_messageTexts.style.display = 'none'; // Ensure it's hidden
     } else {
         // console.error("vsw-message-texts container not found!"); // Optional: Keep error for debugging
     }


    // Initial setup if main widget exists
    if (vsw_mainWidget) {
        vsw_showBanner(); // Show banner initially
        vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Calculate initial items per page
        vsw_setupCategoryButtons(); // Set up button listeners
        vsw_setupOutsideClickListener(); // Set up listener to close category when clicking outside
    } else {
        // console.error("Main widget (#vsw-main-widget) not found!"); // Optional: Keep error for debugging
    }
});


// --- Banner Helper Functions (Prefixed) ---
function vsw_showBanner() {
    // Find banner inside the widget context if possible
    const banner = document.getElementById('vsw-category-banner');
    if (banner) banner.style.display = 'block';
}
function vsw_hideBanner() {
     const banner = document.getElementById('vsw-category-banner');
     if (banner) banner.style.display = 'none';
}

// --- Helper function to get text from hidden message elements (Prefixed) ---
function vsw_getTextById(id) {
    // Ensure the container exists
    const messageTextsContainer = document.getElementById('vsw-message-texts');
    if (!messageTextsContainer) {
        // console.error("vsw-message-texts container is missing."); // Optional
        return `[Error: Missing Text Container]`;
    }
    const element = messageTextsContainer.querySelector(`#${id}`);
    if (element) {
        return element.textContent || `[Empty: ${id}]`; // Return text or indicator if empty
    } else {
        // console.error(`Msg ID "${id}" not found within #vsw-message-texts.`); // Optional
        return `[Missing ID: ${id}]`; // Return indicator if ID is missing
    }
}


// --- Category Button Logic (Prefixed) ---
function vsw_setupCategoryButtons() {
    // Ensure container exists
    const buttonsContainer = vsw_mainWidget ? vsw_mainWidget.querySelector('.vsw-category-buttons') : null;
    if (!buttonsContainer) return;

    const buttons = buttonsContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (targetId) {
                vsw_toggleCategory(targetId);
            } else {
                // console.error("Button missing data-target attribute:", button); // Optional
            }
        });
    });
}

function vsw_closeCurrentlyActiveCategory() {
    if (vsw_activeSearchContainerId) {
        const currentActiveContainer = document.getElementById(vsw_activeSearchContainerId);
        if (currentActiveContainer) {
            currentActiveContainer.classList.remove('vsw-active-search-box');

             // Refresh references before removing
             vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
             vsw_videoDisplay = document.getElementById('vsw-video-display');

            // Remove video sections only if they are direct children of the active container
            if (vsw_videoSliderContainer && vsw_videoSliderContainer.parentNode === currentActiveContainer) {
                 currentActiveContainer.removeChild(vsw_videoSliderContainer);
            } else if (vsw_videoSliderContainer) {
                 vsw_videoSliderContainer.style.display = 'none'; // Hide if not direct child but exists
            }

            if (vsw_videoDisplay && vsw_videoDisplay.parentNode === currentActiveContainer) {
                 currentActiveContainer.removeChild(vsw_videoDisplay);
            } else if (vsw_videoDisplay) {
                 vsw_videoDisplay.style.display = 'none'; // Hide if not direct child but exists
            }
        }
        vsw_activeSearchContainerId = null;
        vsw_showBanner(); // Show banner when closing a category
    }
}


function vsw_toggleCategory(containerIdToShow) {
    const containerToShow = document.getElementById(containerIdToShow);
    if (!containerToShow || !vsw_mainWidget) {
        // console.error("Target container or main widget not found:", containerIdToShow); // Optional
        return;
    }

    const isAlreadyActive = containerIdToShow === vsw_activeSearchContainerId;
    const previouslyActiveId = vsw_activeSearchContainerId; // Store previous ID before closing

    vsw_closeCurrentlyActiveCategory(); // Always close previous first

    if (!isAlreadyActive) {
        // Re-create or get references to video sections
        // These elements might not exist if they were removed, so we might need to recreate them or have templates
        // For simplicity, let's assume the sections exist in the original HTML but are removed/added.
        // We need the *actual* elements to append. Let's get them by ID again.
         vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
         vsw_videoDisplay = document.getElementById('vsw-video-display');

         // If they don't exist, maybe create them? Or rely on initial HTML structure in gadget.
         // Assuming they exist (from gadget HTML or template) but are detached.

        if (!vsw_videoSliderContainer || !vsw_videoDisplay) {
            console.error("Video container sections not found in the DOM.");
            // If these elements are crucial, consider creating them dynamically here if they don't exist.
            // Example: if (!vsw_videoSliderContainer) { vsw_videoSliderContainer = document.createElement('section'); /* add id, class, etc. */ }
            return; // Stop if sections are missing
        }


        containerToShow.classList.add('vsw-active-search-box');
        vsw_activeSearchContainerId = containerIdToShow;

        // Append video sections into the newly active container
        // Ensure they are not already children of this container (unlikely after close, but safe check)
        if (!containerToShow.contains(vsw_videoSliderContainer)) {
             containerToShow.appendChild(vsw_videoSliderContainer);
        }
        if (!containerToShow.contains(vsw_videoDisplay)) {
             containerToShow.appendChild(vsw_videoDisplay);
        }

        // Refresh slider/iframe references inside the sections AFTER appending
        vsw_videoSlider = vsw_videoSliderContainer.querySelector('#vsw-video-slider');
        vsw_videoSliderNav = vsw_videoSliderContainer.querySelector('#vsw-video-slider-nav');
        vsw_youtubeIframe = vsw_videoDisplay.querySelector('#vsw-youtube-iframe');

        if (!vsw_videoSlider || !vsw_videoSliderNav || !vsw_youtubeIframe) {
             console.error("Internal elements of video sections not found after append.");
             // Handle error - perhaps the structure inside the sections is missing
        }


        vsw_clearVideoResults(); // Clear previous results from UI
        vsw_hideVideoSections(); // Ensure they are hidden initially
        vsw_hideBanner();       // Hide banner when a category is open
    }
    // If it was already active, closeCurrentlyActiveCategory handled it, so it's now closed.
     vsw_hideMessage(); // Hide any lingering messages
}

// --- Click Outside Logic (Prefixed) ---
function vsw_setupOutsideClickListener() {
     // Ensure main widget exists for context
     if (!vsw_mainWidget) return;

    document.addEventListener('click', (event) => {
        if (!vsw_activeSearchContainerId) return; // No active category, do nothing

        const activeContainer = document.getElementById(vsw_activeSearchContainerId);
        // Get message box reference freshly
        const messageBoxElement = document.getElementById('vsw-messageBox');

        // Check if the click is outside the main widget entirely
        const clickedInsideMainWidget = vsw_mainWidget.contains(event.target);

        // Check specific non-closing elements
        const clickedOnCategoryButton = event.target.closest('.vsw-category-buttons button');
        const clickedOnBanner = event.target.closest('#vsw-category-banner');
        const clickedInsideActiveContainer = activeContainer && activeContainer.contains(event.target);
        const clickedInsideMessageBox = messageBoxElement && messageBoxElement.contains(event.target);

        // Close only if click is outside the active container AND outside buttons/banner/messagebox
        // AND potentially only if inside the main widget boundary (optional)
        if (!clickedInsideActiveContainer && !clickedOnCategoryButton && !clickedOnBanner && !clickedInsideMessageBox) {
             // Option 1: Close if clicked anywhere outside the specific elements (even outside widget)
              vsw_closeCurrentlyActiveCategory();

             // Option 2: Close ONLY if clicked inside the widget boundary but outside the specific elements
             /*
             if (clickedInsideMainWidget) {
                 vsw_closeCurrentlyActiveCategory();
             }
             */
        }
    });
}


// --- YouTube API Interaction (Prefixed) ---
async function vsw_fetchYouTubeData(searchTerm = '') {
    // WARNING: Storing API keys directly in client-side JavaScript is insecure.
    const apiKey = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; // Replace if testing, use proxy for production.

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 30) {
         console.error("API Key is missing or invalid.");
         vsw_showMessage(vsw_getTextById('vsw-msgApiKeyError'), 5000);
         vsw_hideVideoSections();
         return;
    }

    const apiHost = 'youtube.googleapis.com';
    const maxResults = 30;
    let apiUrl = `https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;
    const query = searchTerm.trim() || 'शैक्षणिक वीडियो हिंदी';
    apiUrl += `&q=${encodeURIComponent(query)}`;

    vsw_showMessage(vsw_getTextById('vsw-msgSearchingVideos'), 2500);
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            let errorData = {}; // Initialize empty object
            try {
                errorData = await response.json();
            } catch (e) {
                console.error("Failed to parse API error response:", e);
                // Use status text if JSON parsing fails
                throw new Error(`HTTP error ${response.status}: ${response.statusText || 'Unknown API Error'}`);
            }

            console.error('YouTube API Error:', errorData);
            let errorId = 'vsw-msgApiGenericErrorPrefix';
            let errorDetails = ` (${response.status})`;

            if (errorData.error && errorData.error.message) {
                 errorDetails += `: ${errorData.error.message}`;
                 if (errorData.error.errors && errorData.error.errors.length > 0) {
                    const reason = errorData.error.errors[0].reason;
                    if (reason === 'quotaExceeded') errorId = 'vsw-msgApiQuotaError', errorDetails = '';
                    else if (reason === 'keyInvalid') errorId = 'vsw-msgApiKeyInvalid', errorDetails = '';
                 }
            }
            throw new Error(vsw_getTextById(errorId) + errorDetails);
        }

        const data = await response.json();

        if (!data || !data.items || data.items.length === 0) {
            vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound'), 4000);
            vsw_hideVideoSections();
            vsw_clearVideoResults();
            vsw_currentVideoItems = [];
            return;
        }

        vsw_currentVideoItems = data.items.filter(item => item.id?.videoId && item.snippet);

        if (vsw_currentVideoItems.length === 0) {
             vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound'), 4000);
             vsw_hideVideoSections();
             vsw_clearVideoResults();
             return;
        }

        vsw_displayVideos(vsw_currentVideoItems);
        vsw_showVideoSections();
        vsw_hideMessage();

    } catch (error) {
        console.error('Fetch or Processing Error:', error);
        let displayError = error.message || vsw_getTextById('vsw-msgInternalError');
        const apiErrorPrefix = vsw_getTextById('vsw-msgApiGenericErrorPrefix').substring(0, 5);
        const apiKeyErrorPrefix = vsw_getTextById('vsw-msgApiKeyError').substring(0, 5);

        if (!displayError.startsWith(apiErrorPrefix) && !displayError.startsWith(apiKeyErrorPrefix)) {
            displayError = `${vsw_getTextById('vsw-msgVideoLoadErrorPrefix')}: ${displayError}`;
        }

        vsw_showMessage(displayError, 6000);
        vsw_hideVideoSections();
        vsw_clearVideoResults();
        vsw_currentVideoItems = [];
    }
}


// --- Video Display (Prefixed) ---
function vsw_displayVideos(videos) {
    // Refresh references, slider might have been moved
    vsw_videoSlider = document.getElementById('vsw-video-slider');
    vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');
    vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
    vsw_videoDisplay = document.getElementById('vsw-video-display');

    if (!vsw_videoSlider) { console.error("Video slider element not found"); return; }

    vsw_videoSlider.innerHTML = '';
    vsw_videoSlideIndex = 0;

    if (!videos || videos.length === 0) {
        vsw_videoSlider.innerHTML = `<p style="color:#ccc; padding: 20px; text-align: center;">${vsw_getTextById('vsw-msgNoVideosFound')}</p>`;
        if (vsw_videoSliderNav) vsw_videoSliderNav.style.display = 'none';
        if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
        if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
        return;
    }

    videos.forEach((video, index) => {
        if (!video.id?.videoId || !video.snippet) return;

        const videoId = video.id.videoId;
        const videoTitle = video.snippet.title || 'Untitled Video';
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url ||
                           video.snippet.thumbnails?.default?.url ||
                           'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        const videoItem = document.createElement('div');
        videoItem.className = 'vsw-video-item'; // Use className for simplicity
        videoItem.setAttribute('data-index', index);

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = videoTitle;
        thumbnail.onerror = function() {
            this.onerror = null;
            this.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            console.warn(`Thumbnail failed: ${thumbnailUrl}`);
        };

        const titleElement = document.createElement('p');
        const tempTextArea = document.createElement('textarea');
        tempTextArea.innerHTML = videoTitle;
        titleElement.textContent = tempTextArea.value;

        videoItem.appendChild(thumbnail);
        videoItem.appendChild(titleElement);

        videoItem.addEventListener('click', () => {
             // Ensure iframe exists before trying to set src
             vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
             if (vsw_youtubeIframe) {
                 vsw_displayEmbeddedVideo(videoId);
                 // Scroll player into view
                 vsw_videoDisplay = document.getElementById('vsw-video-display');
                 if (vsw_videoDisplay) {
                     vsw_videoDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                 }
             } else {
                  console.error("YouTube iframe element not found on click.");
             }
        });

        vsw_videoSlider.appendChild(videoItem);
    });

    if (videos.length > 0 && videos[0].id?.videoId) {
        vsw_displayEmbeddedVideo(videos[0].id.videoId);
    } else {
        if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
        if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
    }

    vsw_itemsPerPage = vsw_calculateItemsPerPage();
    vsw_updateVideoSlider();
    if (vsw_videoSliderNav) {
        vsw_videoSliderNav.style.display = videos.length > vsw_itemsPerPage ? 'flex' : 'none';
    } else {
         console.warn("Video slider nav not found after displayVideos.");
    }
}


function vsw_displayEmbeddedVideo(videoId) {
    // Refresh iframe reference
    vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
    vsw_videoDisplay = document.getElementById('vsw-video-display');

    if (!vsw_youtubeIframe || !vsw_videoDisplay) {
         console.error("Cannot display video, player elements missing.");
         return;
    }

    if (!videoId) {
        vsw_youtubeIframe.src = '';
        vsw_videoDisplay.style.display = 'none';
        return;
    }
    vsw_youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    vsw_videoDisplay.style.display = 'block';

    vsw_youtubeIframe.onerror = () => {
        console.error('Iframe failed to load for video ID:', videoId);
        vsw_showMessage(vsw_getTextById('vsw-msgVideoLoadFailed'), 3000);
        vsw_videoDisplay.style.display = 'none';
    };
}

function vsw_clearVideoResults() {
     // Refresh references as elements might have been moved/removed
    vsw_videoSlider = document.getElementById('vsw-video-slider');
    vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');

    if (vsw_videoSlider) vsw_videoSlider.innerHTML = '';
    if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
    vsw_currentVideoItems = [];
    vsw_videoSlideIndex = 0;
     vsw_hideVideoSections();
}

// --- Video Slider Navigation (Prefixed) ---
function vsw_calculateItemsPerPage() {
    // Find the slider container *within the active category* if possible
    const currentActiveContainer = vsw_activeSearchContainerId ? document.getElementById(vsw_activeSearchContainerId) : null;
    // Important: Get the slider container *reference* again, it might have moved
    const sliderContainerElement = currentActiveContainer ? currentActiveContainer.querySelector('#vsw-video-slider-container') : document.getElementById('vsw-video-slider-container'); // Fallback

    if (!sliderContainerElement || sliderContainerElement.offsetWidth <= 0) {
        if (window.innerWidth < 480) return 2;
        if (window.innerWidth < 768) return 3;
        return 4;
    }

    const containerWidth = sliderContainerElement.offsetWidth - 20; // padding
    const itemWidth = 150;
    const itemMargin = 12;
    const itemTotalWidth = itemWidth + itemMargin;
    const calculatedItems = Math.max(1, Math.floor(containerWidth / itemTotalWidth));
    return calculatedItems;
}


function vsw_slideVideo(direction) {
    const numVideoItems = vsw_currentVideoItems.length;
    if (!numVideoItems) return;

    vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Recalculate

    if (numVideoItems <= vsw_itemsPerPage) return;

    const maxIndex = numVideoItems - vsw_itemsPerPage;
    vsw_videoSlideIndex = Math.max(0, Math.min(maxIndex, vsw_videoSlideIndex + direction));

    vsw_updateVideoSlider();
}

function vsw_updateVideoSlider() {
    // Refresh slider reference
    vsw_videoSlider = document.getElementById('vsw-video-slider');
     if (!vsw_videoSlider || vsw_currentVideoItems.length === 0) {
        if (vsw_videoSlider) vsw_videoSlider.style.transform = `translateX(0px)`;
        return;
     };

    const itemWidth = 150;
    const itemMargin = 12;
    const itemTotalWidth = itemWidth + itemMargin;
    const slideAmount = -vsw_videoSlideIndex * itemTotalWidth;
    vsw_videoSlider.style.transform = `translateX(${slideAmount}px)`;
}

// --- Resize Listener (Prefixed) ---
window.addEventListener('resize', () => {
    clearTimeout(vsw_resizeTimeout);
    vsw_resizeTimeout = setTimeout(() => {
        // Check if there's an active category and slider is visible
        const currentActiveContainer = vsw_activeSearchContainerId ? document.getElementById(vsw_activeSearchContainerId) : null;
        // Refresh slider container reference
        const sliderContainerElement = currentActiveContainer ? currentActiveContainer.querySelector('#vsw-video-slider-container') : document.getElementById('vsw-video-slider-container');
        // Refresh nav reference
         vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');


         if (sliderContainerElement && sliderContainerElement.style.display !== 'none') {
             const oldItemsPerPage = vsw_itemsPerPage;
             vsw_itemsPerPage = vsw_calculateItemsPerPage();

             if (oldItemsPerPage !== vsw_itemsPerPage) {
                 const numVideoItems = vsw_currentVideoItems.length;
                 if (numVideoItems > vsw_itemsPerPage) {
                    const maxIndex = Math.max(0, numVideoItems - vsw_itemsPerPage);
                    vsw_videoSlideIndex = Math.min(vsw_videoSlideIndex, maxIndex);
                 } else {
                     vsw_videoSlideIndex = 0;
                 }
             }
            vsw_updateVideoSlider();

            if (vsw_videoSliderNav) {
                vsw_videoSliderNav.style.display = vsw_currentVideoItems.length > vsw_itemsPerPage ? 'flex' : 'none';
            }
        }
    }, 250);
});

// --- Search Logic (Prefixed) ---
function vsw_performSearch(searchBoxId) {
    const searchBox = document.getElementById(searchBoxId);
    if (!searchBox) {
        console.error("Search box not found:", searchBoxId);
        vsw_showMessage(vsw_getTextById('vsw-msgInternalError'), 4000);
        return;
    }

    let finalSearchTerm = '';
    let dropdownSelectionMade = false;
    let dropdownSearchTerm = '';

    const selects = searchBox.querySelectorAll('select');
    selects.forEach(select => {
        if (select.value?.trim()) {
            dropdownSearchTerm += select.value.trim() + ' ';
            dropdownSelectionMade = true;
        }
    });

    const textInput = searchBox.querySelector('input[type="text"].vsw-custom-search-input');
    const textValue = textInput ? textInput.value.trim() : '';

    if (textValue) {
        finalSearchTerm = (dropdownSearchTerm + textValue).trim();
    } else if (dropdownSelectionMade) {
        finalSearchTerm = dropdownSearchTerm.trim();
    } else {
        vsw_showMessage(vsw_getTextById('vsw-msgValidationError'), 4000);
        return;
    }

    vsw_hideMessage();
    vsw_fetchYouTubeData(finalSearchTerm);
}


// --- UI Helper Functions (Prefixed) ---
function vsw_showVideoSections() {
    // Refresh references as elements might have been moved
    vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
    vsw_videoDisplay = document.getElementById('vsw-video-display');
    vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
    vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');


    if (vsw_currentVideoItems && vsw_currentVideoItems.length > 0) {
        if (vsw_videoSliderContainer) vsw_videoSliderContainer.style.display = 'block';

        if (vsw_videoDisplay && vsw_youtubeIframe && vsw_youtubeIframe.src && vsw_youtubeIframe.src !== 'about:blank') {
            vsw_videoDisplay.style.display = 'block';
        } else if (vsw_videoDisplay) {
            vsw_videoDisplay.style.display = 'none';
        }

        if (vsw_videoSliderNav) {
             vsw_itemsPerPage = vsw_calculateItemsPerPage();
             vsw_videoSliderNav.style.display = vsw_currentVideoItems.length > vsw_itemsPerPage ? 'flex' : 'none';
        }
    } else {
        vsw_hideVideoSections();
    }
}


function vsw_hideVideoSections() {
     // Refresh references before hiding
    vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
    vsw_videoDisplay = document.getElementById('vsw-video-display');
    vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');

    if (vsw_videoSliderContainer) vsw_videoSliderContainer.style.display = 'none';
    if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
    if (vsw_videoSliderNav) vsw_videoSliderNav.style.display = 'none';
}

// Prefixed showMessage
function vsw_showMessage(messageText, duration = 3000) {
    // Ensure message box exists
    const msgBox = document.getElementById('vsw-messageBox');
    if (!msgBox) return;

    clearTimeout(vsw_messageTimeout);

    const textToShow = messageText || vsw_getTextById('vsw-msgInternalError');

    if (textToShow) {
        msgBox.textContent = textToShow;
        msgBox.style.display = 'block';
        vsw_messageTimeout = setTimeout(vsw_hideMessage, duration);
    } else {
        msgBox.style.display = 'none';
    }
}


// Prefixed hideMessage
function vsw_hideMessage() {
     const msgBox = document.getElementById('vsw-messageBox');
     if (!msgBox) return;
    clearTimeout(vsw_messageTimeout);
    msgBox.style.display = 'none';
}
