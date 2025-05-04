// --- Globals (Prefixed) ---
// नोट: ये वेरिएबल्स DOM लोड होने के बाद इनिशियलाइज़ होंगे,
// इसलिए स्क्रिप्ट को बॉडी के अंत में रखना या DOMContentLoaded का उपयोग करना महत्वपूर्ण है।
let vsw_mainWidget;
let vsw_categoryButtonsContainer;
let vsw_categoryBanner;
let vsw_allSearchContainers;
let vsw_videoSliderContainer;
let vsw_videoDisplay;
let vsw_videoSliderNav;
let vsw_messageBox;
let vsw_videoSlider;
let vsw_youtubeIframe;
let vsw_messageTexts;

let vsw_currentVideoItems = [];
let vsw_videoSlideIndex = 0;
let vsw_itemsPerPage = 4; // Default, will be recalculated
let vsw_activeSearchContainerId = null;
let vsw_messageTimeout;
let vsw_resizeTimeout;

// --- Initialization ---
// सुनिश्चित करें कि यह कोड DOM पूरी तरह से लोड होने के बाद ही चले।
// इसे <script> टैग को </body> के ठीक पहले रखकर या DOMContentLoaded इवेंट का उपयोग करके किया जा सकता है।
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements to global variables
    vsw_mainWidget = document.getElementById('vsw-main-widget');
    vsw_categoryButtonsContainer = document.querySelector('.vsw-category-buttons');
    vsw_categoryBanner = document.getElementById('vsw-category-banner');
    vsw_allSearchContainers = document.querySelectorAll('.vsw-search-category-container');
    vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
    vsw_videoDisplay = document.getElementById('vsw-video-display');
    vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');
    vsw_messageBox = document.getElementById('vsw-messageBox');
    vsw_videoSlider = document.getElementById('vsw-video-slider');
    vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
    vsw_messageTexts = document.getElementById('vsw-message-texts');

    // Initial setup only if elements exist
    if (vsw_mainWidget && vsw_categoryButtonsContainer && vsw_messageTexts && vsw_messageBox) {
        // Temporarily remove video sections from their initial placeholder location in HTML
        // They will be added dynamically to the active search container
        if (vsw_videoSliderContainer) vsw_videoSliderContainer.remove();
        if (vsw_videoDisplay) vsw_videoDisplay.remove();

        vsw_showBanner(); // Show banner initially
        vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Calculate initial items per page
        vsw_setupCategoryButtons(); // Set up category button listeners
        vsw_setupOutsideClickListener(); // Set up listener to close category on outside click
        window.addEventListener('resize', vsw_handleResize); // Add resize listener

        // Ensure initial state is correct
        vsw_hideVideoSections(); // Hide video sections initially
    } else {
        console.error("VSW Error: One or more essential widget elements not found in the DOM.");
    }
});


// --- Banner Helper Functions (Prefixed) ---
function vsw_showBanner() {
    if(vsw_categoryBanner) vsw_categoryBanner.style.display = 'block';
}
function vsw_hideBanner() {
     if(vsw_categoryBanner) vsw_categoryBanner.style.display = 'none';
}

// --- Helper function to get text from hidden message elements (Prefixed) ---
function vsw_getTextById(id) {
    if (!vsw_messageTexts) {
        console.error("VSW Error: Message text container not found.");
        return `[${id}]`; // Return ID as fallback
    }
    const element = vsw_messageTexts.querySelector(`#${id}`);
    if (element) {
        return element.textContent || `[${id}]`; // Ensure textContent is returned
    } else {
        console.warn(`VSW Warning: Message ID "${id}" not found.`);
        return `[${id}]`; // Return ID as fallback
    }
}


// --- Category Button Logic (Prefixed) ---
function vsw_setupCategoryButtons() {
    if (!vsw_categoryButtonsContainer) return;
    const buttons = vsw_categoryButtonsContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately triggering outside click listener
            const targetId = button.getAttribute('data-target');
            if (targetId) {
                vsw_toggleCategory(targetId);
            } else {
                 console.warn("VSW Warning: Button missing data-target attribute.");
            }
        });
    });
}

function vsw_closeCurrentlyActiveCategory() {
    if (vsw_activeSearchContainerId) {
        const currentActiveContainer = document.getElementById(vsw_activeSearchContainerId);
        if (currentActiveContainer) {
            currentActiveContainer.classList.remove('vsw-active-search-box'); // Use prefixed class
            // Remove video sections if they exist within this container
            if (currentActiveContainer.contains(vsw_videoSliderContainer)) vsw_videoSliderContainer.remove();
            if (currentActiveContainer.contains(vsw_videoDisplay)) vsw_videoDisplay.remove();
        } else {
             console.warn(`VSW Warning: Active container ID ${vsw_activeSearchContainerId} not found in DOM during close.`);
        }
        vsw_activeSearchContainerId = null;
        vsw_showBanner(); // Show banner when a category closes
    }
}


function vsw_toggleCategory(containerIdToShow) {
    const containerToShow = document.getElementById(containerIdToShow);
    if (!containerToShow) {
        console.error(`VSW Error: Target container ID ${containerIdToShow} not found.`);
        return;
    }

    const isAlreadyActive = (containerIdToShow === vsw_activeSearchContainerId);

    // Close any currently open category first
    vsw_closeCurrentlyActiveCategory();

    // If the clicked category wasn't the one already open, open it
    if (!isAlreadyActive) {
        containerToShow.classList.add('vsw-active-search-box'); // Use prefixed class
        vsw_activeSearchContainerId = containerIdToShow;

        // Append video sections into the newly opened container
        // Ensure they exist before appending
        if (vsw_videoSliderContainer) containerToShow.appendChild(vsw_videoSliderContainer);
        if (vsw_videoDisplay) containerToShow.appendChild(vsw_videoDisplay);

        vsw_clearVideoResults(); // Clear previous results
        vsw_hideVideoSections(); // Ensure video sections start hidden
        vsw_hideBanner();      // Hide banner when a category is open
        vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Recalculate for the new container context
        containerToShow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // Scroll to the opened container
    }
    // If it was already active, closing it was handled by vsw_closeCurrentlyActiveCategory()

    vsw_hideMessage(); // Hide any lingering messages
}

// --- Click Outside Logic (Prefixed) ---
function vsw_setupOutsideClickListener() {
    document.addEventListener('click', (event) => {
        // If no category is active, do nothing
        if (!vsw_activeSearchContainerId) return;

        const activeContainer = document.getElementById(vsw_activeSearchContainerId);
        const clickedButton = event.target.closest('.vsw-category-buttons button'); // Check if a category button was clicked
        const clickedBanner = event.target.closest('#vsw-category-banner'); // Check if banner was clicked

        // Do not close if:
        // 1. The click is inside the active container OR
        // 2. The click is on any category button OR
        // 3. The click is on the banner
        if ((activeContainer && activeContainer.contains(event.target)) || clickedButton || clickedBanner) {
            return;
        }

        // Otherwise, close the active category
        vsw_closeCurrentlyActiveCategory();
    });
}


// --- YouTube API Interaction (Prefixed) ---
async function vsw_fetchYouTubeData(searchTerm = '') {
    // IMPORTANT: Storing API keys directly in client-side JavaScript is insecure
    // and exposes your key. Use a backend proxy or serverless function for API calls in production.
    const apiKey = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; // WARNING: Exposed API Key!

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 30) {
         console.error("VSW Error: Invalid or missing API Key configuration.");
         vsw_showMessage(vsw_getTextById('vsw-msgApiKeyError'), 5000);
         vsw_hideVideoSections();
         return;
    }

    const apiHost = 'youtube.googleapis.com';
    const maxResults = 30; // Fetch more results for better slider experience
    const safeSearchTerm = searchTerm || 'शैक्षणिक वीडियो हिंदी'; // Default search term if empty
    let apiUrl = `https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;
    apiUrl += `&q=${encodeURIComponent(safeSearchTerm)}`;
    // Add relevance language if applicable, e.g., for Hindi searches
    if (safeSearchTerm.includes("हिंदी") || safeSearchTerm.match(/[\u0900-\u097F]/)) {
         apiUrl += `&relevanceLanguage=hi`;
    }

    vsw_showMessage(vsw_getTextById('vsw-msgSearchingVideos'), 2500);
    vsw_hideVideoSections(); // Hide sections while loading
    vsw_clearVideoResults(); // Clear old results immediately

    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const data = await response.json(); // Always try to parse JSON

        if (!response.ok) {
            console.error('VSW API Error Response:', data); // Log the full error response
            let errorId = 'vsw-msgApiGenericErrorPrefix';
            let errorDetails = `(${response.status})`;
            if (data.error?.message) {
                errorDetails += `: ${data.error.message}`;
                if (data.error.errors?.[0]?.reason === 'quotaExceeded') {
                    errorId = 'vsw-msgApiQuotaError'; errorDetails = '';
                } else if (data.error.errors?.[0]?.reason === 'keyInvalid') {
                    errorId = 'vsw-msgApiKeyInvalid'; errorDetails = '';
                }
            }
            // Throw an error object for better handling
            const apiError = new Error(vsw_getTextById(errorId) + errorDetails);
            apiError.statusCode = response.status;
            throw apiError;
        }

        if (!data?.items || data.items.length === 0) {
            vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound'), 4000);
            vsw_hideVideoSections();
            vsw_clearVideoResults();
            vsw_currentVideoItems = [];
            return;
        }

        // Filter out items without necessary data BEFORE storing
        vsw_currentVideoItems = data.items.filter(item => item.id?.videoId && item.snippet);
        if (vsw_currentVideoItems.length === 0) {
             vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound') + " (after filtering)", 4000);
             vsw_hideVideoSections();
             vsw_clearVideoResults();
             return;
        }

        vsw_displayVideos(vsw_currentVideoItems); // Display the filtered videos
        vsw_showVideoSections(); // Show sections now that we have content
        vsw_hideMessage(); // Clear "Searching..." message

    } catch (error) {
        console.error('VSW Fetch Error:', error);
        // Construct a user-friendly error message
        let displayError = vsw_getTextById('vsw-msgInternalError'); // Default internal error
        if (error.message) {
            // Check if it's a known API error type we constructed
             if (error.message.startsWith(vsw_getTextById('vsw-msgApiGenericErrorPrefix')) ||
                 error.message.startsWith(vsw_getTextById('vsw-msgApiQuotaError')) ||
                 error.message.startsWith(vsw_getTextById('vsw-msgApiKeyInvalid')) ||
                 error.message.startsWith(vsw_getTextById('vsw-msgApiKeyError')))
             {
                 displayError = error.message;
             } else {
                 // Otherwise, treat as a more general loading error
                 displayError = `${vsw_getTextById('vsw-msgVideoLoadErrorPrefix')}: ${error.message}`;
             }
        }

        vsw_showMessage(displayError, 6000);
        vsw_hideVideoSections();
        vsw_clearVideoResults();
        vsw_currentVideoItems = [];
    }
}


// --- Video Display (Prefixed) ---
function vsw_displayVideos(videos) {
    if (!vsw_videoSlider) return; // Ensure slider element exists

    vsw_videoSlider.innerHTML = ''; // Clear previous items
    vsw_videoSlideIndex = 0; // Reset slide index

    if (!videos || videos.length === 0) {
        vsw_videoSlider.innerHTML = `<p style="color:#ccc; padding: 20px; text-align: center; width: 100%;">${vsw_getTextById('vsw-msgNoVideosFound')}</p>`;
        if (vsw_videoSliderNav) vsw_videoSliderNav.style.display = 'none';
        if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
        if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
        return;
    }

    videos.forEach((video, index) => {
        // Double-check data integrity for each video
        if (!video.id?.videoId || !video.snippet) {
            console.warn("VSW Skipping invalid video item:", video);
            return;
        };

        const videoId = video.id.videoId;
        const videoTitle = video.snippet.title || 'Untitled Video';
        // Use medium thumbnail first, fallback to default, then to a placeholder
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent pixel

        const videoItem = document.createElement('div');
        videoItem.classList.add('vsw-video-item');
        videoItem.setAttribute('data-index', index); // Store index for potential future use
        videoItem.setAttribute('data-videoid', videoId); // Store video ID

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = videoTitle;
        // Add error handling for broken thumbnail images
        thumbnail.onerror = function() {
            this.onerror=null; // Prevent infinite loops if placeholder also fails
            this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Fallback to transparent pixel
            console.warn(`VSW Thumbnail failed to load: ${thumbnailUrl}`);
        };

        const title = document.createElement('p');
        // Decode HTML entities from title (e.g., & -> &)
        const tempEl = document.createElement('textarea');
        tempEl.innerHTML = videoTitle;
        title.textContent = tempEl.value;

        videoItem.appendChild(thumbnail);
        videoItem.appendChild(title);

        // Add click listener to load the video in the player
        videoItem.addEventListener('click', () => {
            vsw_displayEmbeddedVideo(videoId);
            // Scroll the main video player into view smoothly
            if (vsw_videoDisplay) {
                vsw_videoDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        vsw_videoSlider.appendChild(videoItem);
    });

    // Automatically load the first video if available
    if (videos.length > 0 && videos[0].id?.videoId) {
        vsw_displayEmbeddedVideo(videos[0].id.videoId);
    } else {
        // If no valid videos ended up being processed, hide player
        if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
        if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
    }

    // Recalculate slider parameters and update display
    vsw_itemsPerPage = vsw_calculateItemsPerPage();
    vsw_updateVideoSlider();
    if (vsw_videoSliderNav) {
        vsw_videoSliderNav.style.display = vsw_currentVideoItems.length > vsw_itemsPerPage ? 'flex' : 'none';
    }
}

function vsw_displayEmbeddedVideo(videoId) {
    if (!vsw_youtubeIframe || !vsw_videoDisplay) return; // Ensure elements exist

    if (!videoId) {
        vsw_youtubeIframe.src = '';
        vsw_videoDisplay.style.display = 'none';
        return;
    }

    // Construct YouTube embed URL with recommended parameters
    vsw_youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&hl=hi`; // Added hl=hi for Hindi interface hint

    vsw_videoDisplay.style.display = 'block'; // Show the player container

    // Optional: Add error handler for the iframe itself (less common)
    vsw_youtubeIframe.onerror = () => {
        console.error('VSW iFrame failed to load video ID:', videoId);
        vsw_showMessage(vsw_getTextById('vsw-msgVideoLoadFailed'), 3000);
        vsw_videoDisplay.style.display = 'none'; // Hide player on error
    };
}

function vsw_clearVideoResults() {
    if (vsw_videoSlider) vsw_videoSlider.innerHTML = '';
    if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
    vsw_currentVideoItems = [];
    vsw_videoSlideIndex = 0;
    // Do not hide sections here, let the calling function decide
}

// --- Video Slider Navigation (Prefixed) ---
function vsw_calculateItemsPerPage() {
    // Use the actual slider container, which should be appended inside the active search box
    if (!vsw_videoSliderContainer || !document.body.contains(vsw_videoSliderContainer)) {
        return 4; // Return default if container isn't in DOM or available
    }

    const containerWidth = vsw_videoSliderContainer.offsetWidth - 20; // Account for padding
    const itemWidth = 150; // Width defined in CSS for .vsw-video-item
    const itemMargin = 12; // Combined left/right margin (6px + 6px) from CSS
    const itemTotalWidth = itemWidth + itemMargin;

    if (containerWidth <= 0 || itemTotalWidth <= 0) {
         return 1; // Avoid division by zero or negative numbers
    }

    const calculatedItems = Math.max(1, Math.floor(containerWidth / itemTotalWidth));
    // console.log("Calculated items per page:", calculatedItems); // For debugging
    return calculatedItems;
}


function vsw_slideVideo(direction) {
    const numVideoItems = vsw_currentVideoItems.length;
    vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Recalculate on slide action

    if (numVideoItems <= vsw_itemsPerPage) return; // No sliding needed if all items fit

    const maxIndex = numVideoItems - vsw_itemsPerPage; // Maximum starting index for a full page
    let newIndex = vsw_videoSlideIndex + direction;

    // Clamp the index within valid bounds [0, maxIndex]
    vsw_videoSlideIndex = Math.max(0, Math.min(maxIndex, newIndex));

    vsw_updateVideoSlider();
}

function vsw_updateVideoSlider() {
     if (!vsw_videoSlider || vsw_currentVideoItems.length === 0) {
        if (vsw_videoSlider) vsw_videoSlider.style.transform = `translateX(0px)`;
        return;
     };

    const itemWidth = 150; // Must match CSS .vsw-video-item width
    const itemMargin = 12; // Must match CSS .vsw-video-item margin (left+right)
    const slideAmount = -vsw_videoSlideIndex * (itemWidth + itemMargin);

    vsw_videoSlider.style.transform = `translateX(${slideAmount}px)`;
}

// Prefixed resize handler
function vsw_handleResize() {
    clearTimeout(vsw_resizeTimeout);
    vsw_resizeTimeout = setTimeout(() => {
        // Only recalculate if the slider container is currently visible in the DOM
        if (vsw_videoSliderContainer && document.body.contains(vsw_videoSliderContainer)) {
            const oldItemsPerPage = vsw_itemsPerPage;
            vsw_itemsPerPage = vsw_calculateItemsPerPage();

            // If the number of items per page changed, adjust the slider
            if (oldItemsPerPage !== vsw_itemsPerPage) {
                const maxIndex = Math.max(0, vsw_currentVideoItems.length - vsw_itemsPerPage);
                // Ensure the current index isn't out of bounds after resize
                vsw_videoSlideIndex = Math.min(vsw_videoSlideIndex, maxIndex);
                vsw_updateVideoSlider();

                // Update visibility of navigation buttons
                if (vsw_videoSliderNav) {
                    vsw_videoSliderNav.style.display = vsw_currentVideoItems.length > vsw_itemsPerPage ? 'flex' : 'none';
                }
            }
        }
    }, 250); // Debounce resize event
}

// --- Search Logic (Prefixed) ---
function vsw_performSearch(searchBoxId) {
    const searchBox = document.getElementById(searchBoxId);
    if (!searchBox) {
        console.error("VSW Error: Search box not found:", searchBoxId);
        return;
    }

    let finalSearchTerm = '';
    let dropdownSelectionMade = false;
    let dropdownSearchTerm = '';
    const selects = searchBox.querySelectorAll('select');
    const textInput = searchBox.querySelector('.vsw-custom-search-input'); // Use prefixed class

    // Combine selected dropdown values
    selects.forEach(select => {
        if (select.value?.trim()) {
            dropdownSearchTerm += select.value.trim() + ' ';
            dropdownSelectionMade = true;
        }
    });
    dropdownSearchTerm = dropdownSearchTerm.trim(); // Trim trailing space

    const textValue = textInput ? textInput.value.trim() : '';

    // Prioritize text input if provided, otherwise use dropdowns
    if (textValue) {
        // Option 1: Combine text with dropdowns (adjust logic as needed)
        // finalSearchTerm = (dropdownSearchTerm + ' ' + textValue).trim();
        // Option 2: Use ONLY text input if filled
        finalSearchTerm = textValue;
    } else if (dropdownSelectionMade) {
        finalSearchTerm = dropdownSearchTerm;
    } else {
        // No dropdowns selected AND no text entered
        vsw_showMessage(vsw_getTextById('vsw-msgValidationError'), 4000);
        return;
    }

    // Perform the search
    vsw_hideMessage(); // Hide validation message if shown
    console.log(`VSW Performing search for: "${finalSearchTerm}"`); // Log search term
    vsw_fetchYouTubeData(finalSearchTerm);
}


// --- UI Helper Functions (Prefixed) ---
function vsw_showVideoSections() {
    // Only show sections if there are videos and the elements exist
    if (vsw_currentVideoItems.length > 0) {
        if (vsw_videoSliderContainer) vsw_videoSliderContainer.style.display = 'block';

        // Show player only if iframe has a valid source
        if (vsw_youtubeIframe && vsw_youtubeIframe.src && vsw_youtubeIframe.src !== 'about:blank' && vsw_videoDisplay) {
             vsw_videoDisplay.style.display = 'block';
        } else {
             if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
        }

        // Recalculate items per page and show/hide nav buttons
        vsw_itemsPerPage = vsw_calculateItemsPerPage();
        if (vsw_videoSliderNav) {
             vsw_videoSliderNav.style.display = vsw_currentVideoItems.length > vsw_itemsPerPage ? 'flex' : 'none';
        }
    } else {
        // If no videos, ensure sections are hidden
        vsw_hideVideoSections();
    }
}


function vsw_hideVideoSections() {
    if (vsw_videoSliderContainer) vsw_videoSliderContainer.style.display = 'none';
    if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
    if (vsw_videoSliderNav) vsw_videoSliderNav.style.display = 'none';
}

// Prefixed showMessage
function vsw_showMessage(messageText, duration = 3000) {
    if (!vsw_messageBox) return; // Exit if message box doesn't exist

    clearTimeout(vsw_messageTimeout); // Clear any previous timeout

    const textToShow = messageText || vsw_getTextById('vsw-msgInternalError'); // Fallback message

    vsw_messageBox.textContent = textToShow;
    vsw_messageBox.style.display = 'block';

    // Automatically hide the message after the duration
    vsw_messageTimeout = setTimeout(vsw_hideMessage, duration);
}

// Prefixed hideMessage
function vsw_hideMessage() {
    if (!vsw_messageBox) return;
    clearTimeout(vsw_messageTimeout); // Clear timeout if hidden manually
    vsw_messageBox.style.display = 'none';
}
