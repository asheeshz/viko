<script>
// --- Globals (Prefixed) ---
const vsw_mainWidget = document.getElementById('vsw-main-widget');
const vsw_categoryButtonsContainer = document.querySelector('.vsw-category-buttons');
const vsw_categoryBanner = document.getElementById('vsw-category-banner');
const vsw_allSearchContainers = document.querySelectorAll('.vsw-search-category-container');
const vsw_videoSliderContainer = document.getElementById('vsw-video-slider-container');
const vsw_videoDisplay = document.getElementById('vsw-video-display');
const vsw_videoSliderNav = document.getElementById('vsw-video-slider-nav');
const vsw_messageBox = document.getElementById('vsw-messageBox');
const vsw_videoSlider = document.getElementById('vsw-video-slider');
const vsw_youtubeIframe = document.getElementById('vsw-youtube-iframe');
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
    // Check if elements exist before manipulating them
    if (vsw_videoSliderContainer && vsw_videoSliderContainer.parentNode) {
        vsw_videoSliderContainer.parentNode.removeChild(vsw_videoSliderContainer);
    }
    if (vsw_videoDisplay && vsw_videoDisplay.parentNode) {
        vsw_videoDisplay.parentNode.removeChild(vsw_videoDisplay);
    }
    if (vsw_messageTexts) {
        vsw_messageTexts.style.display = 'none'; // Ensure it's hidden
    } else {
        console.error("vsw-message-texts container not found!");
    }

    vsw_showBanner(); // Show banner initially
    vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Calculate initial items per page
    vsw_setupCategoryButtons(); // Set up button listeners
    vsw_setupOutsideClickListener(); // Set up listener to close category when clicking outside
});


// --- Banner Helper Functions (Prefixed) ---
function vsw_showBanner() {
    if (vsw_categoryBanner) vsw_categoryBanner.style.display = 'block';
}
function vsw_hideBanner() {
     if (vsw_categoryBanner) vsw_categoryBanner.style.display = 'none';
}

// --- Helper function to get text from hidden message elements (Prefixed) ---
function vsw_getTextById(id) {
    if (!vsw_messageTexts) {
        console.error("vsw-message-texts container is missing.");
        return `[Error: Missing Text Container]`;
    }
    const element = vsw_messageTexts.querySelector(`#${id}`);
    if (element) {
        return element.textContent || `[Empty: ${id}]`; // Return text or indicator if empty
    } else {
        console.error(`Msg ID "${id}" not found within #vsw-message-texts.`);
        return `[Missing ID: ${id}]`; // Return indicator if ID is missing
    }
}


// --- Category Button Logic (Prefixed) ---
function vsw_setupCategoryButtons() {
    if (!vsw_categoryButtonsContainer) return;
    const buttons = vsw_categoryButtonsContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (targetId) {
                vsw_toggleCategory(targetId);
            } else {
                console.error("Button missing data-target attribute:", button);
            }
        });
    });
}

function vsw_closeCurrentlyActiveCategory() {
    if (vsw_activeSearchContainerId) {
        const currentActiveContainer = document.getElementById(vsw_activeSearchContainerId);
        if (currentActiveContainer) {
            currentActiveContainer.classList.remove('vsw-active-search-box');
            // Remove video sections only if they are direct children
            if (vsw_videoSliderContainer && currentActiveContainer.contains(vsw_videoSliderContainer)) {
                 if (vsw_videoSliderContainer.parentNode === currentActiveContainer) {
                    currentActiveContainer.removeChild(vsw_videoSliderContainer);
                 }
                 vsw_videoSliderContainer.style.display = 'none'; // Hide regardless
            }
            if (vsw_videoDisplay && currentActiveContainer.contains(vsw_videoDisplay)) {
                 if (vsw_videoDisplay.parentNode === currentActiveContainer) {
                    currentActiveContainer.removeChild(vsw_videoDisplay);
                 }
                 vsw_videoDisplay.style.display = 'none'; // Hide regardless
            }
        }
        vsw_activeSearchContainerId = null;
        vsw_showBanner(); // Show banner when closing a category
    }
}


function vsw_toggleCategory(containerIdToShow) {
    const containerToShow = document.getElementById(containerIdToShow);
    if (!containerToShow) {
        console.error("Target container not found:", containerIdToShow);
        return;
    }

    const isAlreadyActive = containerIdToShow === vsw_activeSearchContainerId;
    vsw_closeCurrentlyActiveCategory(); // Always close previous first

    if (!isAlreadyActive) {
        containerToShow.classList.add('vsw-active-search-box');
        vsw_activeSearchContainerId = containerIdToShow;

        // Ensure video sections are ready to be shown if needed
        // Append only if not already a child (safety check)
        if (vsw_videoSliderContainer && !containerToShow.contains(vsw_videoSliderContainer)) {
            containerToShow.appendChild(vsw_videoSliderContainer);
        }
         if (vsw_videoDisplay && !containerToShow.contains(vsw_videoDisplay)) {
            containerToShow.appendChild(vsw_videoDisplay);
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
    document.addEventListener('click', (event) => {
        if (!vsw_activeSearchContainerId) return; // No active category, do nothing

        const activeContainer = document.getElementById(vsw_activeSearchContainerId);
        const mainWidget = document.getElementById('vsw-main-widget');

        // Check if the click is outside the main widget entirely or specifically outside the active container
        // but not on a category button or the banner itself.
        const clickedOnCategoryButton = event.target.closest('.vsw-category-buttons button');
        const clickedOnBanner = event.target === vsw_categoryBanner; // Direct click on banner
        const clickedInsideActiveContainer = activeContainer && activeContainer.contains(event.target);
        const clickedInsideMessageBox = event.target.closest('.vsw-message-box'); // Don't close if clicking message

        if (!clickedInsideActiveContainer && !clickedOnCategoryButton && !clickedOnBanner && !clickedInsideMessageBox) {
             // Check if the click was inside the main widget but outside the active container
             const clickedInsideMainWidget = mainWidget && mainWidget.contains(event.target);
             if (clickedInsideMainWidget) {
                 vsw_closeCurrentlyActiveCategory();
             }
             // Optionally, close even if clicking outside the main widget:
             // vsw_closeCurrentlyActiveCategory();
        }
    });
}


// --- YouTube API Interaction (Prefixed) ---
async function vsw_fetchYouTubeData(searchTerm = '') {
    // WARNING: Storing API keys directly in client-side JavaScript is insecure
    // and exposes the key. For production, use a backend proxy.
    const apiKey = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; // Replace with your actual key if testing

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 30) {
         console.error("API Key is missing or invalid.");
         vsw_showMessage(vsw_getTextById('vsw-msgApiKeyError'), 5000);
         vsw_hideVideoSections();
         return; // Stop execution if key is invalid
    }

    const apiHost = 'youtube.googleapis.com';
    const maxResults = 30; // Fetch more results for better slider variety
    let apiUrl = `https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;

    // Use provided search term or a default if empty
    const query = searchTerm.trim() || 'शैक्षणिक वीडियो हिंदी'; // Default search term
    apiUrl += `&q=${encodeURIComponent(query)}`;

    vsw_showMessage(vsw_getTextById('vsw-msgSearchingVideos'), 2500); // Show "Searching..."
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            // Attempt to parse error response from YouTube API
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If response is not JSON or empty
                 throw new Error(`HTTP error ${response.status}`);
            }

            console.error('YouTube API Error:', errorData);
            let errorId = 'vsw-msgApiGenericErrorPrefix'; // Default error message ID
            let errorDetails = ` (${response.status})`; // Default details

            if (errorData.error && errorData.error.message) {
                 errorDetails += `: ${errorData.error.message}`;
                 // Check for specific error reasons
                 if (errorData.error.errors && errorData.error.errors.length > 0) {
                    const reason = errorData.error.errors[0].reason;
                    if (reason === 'quotaExceeded') {
                        errorId = 'vsw-msgApiQuotaError'; errorDetails = ''; // Use specific message
                    } else if (reason === 'keyInvalid') {
                        errorId = 'vsw-msgApiKeyInvalid'; errorDetails = ''; // Use specific message
                    }
                 }
            }
            // Throw an error using text fetched by ID
            throw new Error(vsw_getTextById(errorId) + errorDetails);
        }

        const data = await response.json();

        if (!data || !data.items || data.items.length === 0) {
            vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound'), 4000);
            vsw_hideVideoSections();
            vsw_clearVideoResults(); // Clear UI
            vsw_currentVideoItems = []; // Clear data
            return;
        }

        // Filter out items without necessary data (safer)
        vsw_currentVideoItems = data.items.filter(item => item.id && item.id.videoId && item.snippet);

        if (vsw_currentVideoItems.length === 0) {
             vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound'), 4000); // Message if filtering removed all
             vsw_hideVideoSections();
             vsw_clearVideoResults();
             return;
        }

        vsw_displayVideos(vsw_currentVideoItems); // Display the filtered videos
        vsw_showVideoSections(); // Make sections visible
        vsw_hideMessage(); // Hide "Searching..." message

    } catch (error) {
        console.error('Fetch or Processing Error:', error);
        // Determine the error message to display
        let displayError = error.message || vsw_getTextById('vsw-msgInternalError');

        // Check if it's one of our specific API errors or a generic fetch error
        const apiErrorPrefix = vsw_getTextById('vsw-msgApiGenericErrorPrefix').substring(0, 5);
        const apiKeyErrorPrefix = vsw_getTextById('vsw-msgApiKeyError').substring(0, 5);

        // If it's not a recognized API error, prefix it as a general load error
        if (!displayError.startsWith(apiErrorPrefix) && !displayError.startsWith(apiKeyErrorPrefix)) {
            displayError = `${vsw_getTextById('vsw-msgVideoLoadErrorPrefix')}: ${displayError}`;
        }

        vsw_showMessage(displayError, 6000); // Show the determined error message
        vsw_hideVideoSections();
        vsw_clearVideoResults(); // Clear UI
        vsw_currentVideoItems = []; // Clear data
    }
}


// --- Video Display (Prefixed) ---
function vsw_displayVideos(videos) {
    if (!vsw_videoSlider) return; // Ensure slider element exists
    vsw_videoSlider.innerHTML = ''; // Clear previous items
    vsw_videoSlideIndex = 0; // Reset slide index

    if (!videos || videos.length === 0) {
        vsw_videoSlider.innerHTML = `<p style="color:#ccc; padding: 20px; text-align: center;">${vsw_getTextById('vsw-msgNoVideosFound')}</p>`;
        if (vsw_videoSliderNav) vsw_videoSliderNav.style.display = 'none';
        if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
        if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
        return;
    }

    videos.forEach((video, index) => {
        // Skip if essential data is missing
        if (!video.id || !video.id.videoId || !video.snippet) {
            console.warn("Skipping video item due to missing data:", video);
            return;
        }

        const videoId = video.id.videoId;
        const videoTitle = video.snippet.title || 'Untitled Video';
        // Use medium thumbnail, fallback to default, then to a placeholder
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url ||
                           video.snippet.thumbnails?.default?.url ||
                           'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent pixel

        // Create video item elements
        const videoItem = document.createElement('div');
        videoItem.classList.add('vsw-video-item');
        videoItem.setAttribute('data-index', index); // Store index for potential future use

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = videoTitle; // Use decoded title for alt text
        // Add error handler for broken thumbnails
        thumbnail.onerror = function() {
            this.onerror = null; // Prevent infinite loop if placeholder also fails
            this.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            console.warn(`Thumbnail failed to load: ${thumbnailUrl}`);
        };

        const titleElement = document.createElement('p');
        // Decode HTML entities from title (e.g., & -> &)
        const tempTextArea = document.createElement('textarea');
        tempTextArea.innerHTML = videoTitle;
        titleElement.textContent = tempTextArea.value;

        videoItem.appendChild(thumbnail);
        videoItem.appendChild(titleElement);

        // Add click listener to load video in player
        videoItem.addEventListener('click', () => {
            vsw_displayEmbeddedVideo(videoId);
            // Scroll the main player into view smoothly
            if (vsw_videoDisplay) {
                vsw_videoDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        vsw_videoSlider.appendChild(videoItem);
    });

    // Automatically load the first video if available
    if (videos.length > 0 && videos[0].id && videos[0].id.videoId) {
        vsw_displayEmbeddedVideo(videos[0].id.videoId);
    } else {
        // If no valid first video, hide the player
        if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
        if (vsw_videoDisplay) vsw_videoDisplay.style.display = 'none';
    }

    // Update slider navigation based on item count and container size
    vsw_itemsPerPage = vsw_calculateItemsPerPage();
    vsw_updateVideoSlider(); // Position slider correctly
    if (vsw_videoSliderNav) {
        vsw_videoSliderNav.style.display = videos.length > vsw_itemsPerPage ? 'flex' : 'none';
    }
}


function vsw_displayEmbeddedVideo(videoId) {
    if (!vsw_youtubeIframe || !vsw_videoDisplay) return; // Ensure elements exist

    if (!videoId) {
        vsw_youtubeIframe.src = '';
        vsw_videoDisplay.style.display = 'none'; // Hide player if no video ID
        return;
    }
    // Construct YouTube embed URL with recommended parameters
    vsw_youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    vsw_videoDisplay.style.display = 'block'; // Show player

    // Add error handling for iframe loading (less common but possible)
    vsw_youtubeIframe.onerror = () => {
        console.error('Iframe failed to load for video ID:', videoId);
        vsw_showMessage(vsw_getTextById('vsw-msgVideoLoadFailed'), 3000);
        vsw_videoDisplay.style.display = 'none'; // Hide player on error
    };
}

function vsw_clearVideoResults() {
    if (vsw_videoSlider) vsw_videoSlider.innerHTML = '';
    if (vsw_youtubeIframe) vsw_youtubeIframe.src = '';
    vsw_currentVideoItems = []; // Clear data array
    vsw_videoSlideIndex = 0; // Reset index
     vsw_hideVideoSections(); // Hide the slider and player containers
}

// --- Video Slider Navigation (Prefixed) ---
function vsw_calculateItemsPerPage() {
    // Use the container element that is actually in the DOM when calculating
    const currentActiveContainer = vsw_activeSearchContainerId ? document.getElementById(vsw_activeSearchContainerId) : null;
    const sliderContainerElement = currentActiveContainer ? currentActiveContainer.querySelector('#vsw-video-slider-container') : null;


    if (!sliderContainerElement || sliderContainerElement.offsetWidth <= 0) {
        // Fallback if container isn't visible or found
        // Check screen width for a rough estimate
        if (window.innerWidth < 480) return 2;
        if (window.innerWidth < 768) return 3;
        return 4; // Default fallback
    }

    const containerWidth = sliderContainerElement.offsetWidth - 20; // Account for padding
    const itemWidth = 150; // Must match CSS .vsw-video-item width
    const itemMargin = 12; // Must match CSS .vsw-video-item margin (6px left + 6px right)
    const itemTotalWidth = itemWidth + itemMargin;

    const calculatedItems = Math.max(1, Math.floor(containerWidth / itemTotalWidth));
    // console.log("Calculated items per page:", calculatedItems);
    return calculatedItems;
}


function vsw_slideVideo(direction) {
    const numVideoItems = vsw_currentVideoItems.length;
    if (!numVideoItems) return; // No items, nothing to slide

    vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Recalculate in case of resize

    if (numVideoItems <= vsw_itemsPerPage) return; // Not enough items to slide

    const maxIndex = numVideoItems - vsw_itemsPerPage; // The last possible starting index

    // Calculate new index, clamped between 0 and maxIndex
    vsw_videoSlideIndex = Math.max(0, Math.min(maxIndex, vsw_videoSlideIndex + direction));

    vsw_updateVideoSlider(); // Apply the new position
}

function vsw_updateVideoSlider() {
     if (!vsw_videoSlider || vsw_currentVideoItems.length === 0) {
        if (vsw_videoSlider) vsw_videoSlider.style.transform = `translateX(0px)`;
        return; // No slider or no items
     };

    // Get item dimensions from CSS (or use known fixed values)
    const itemWidth = 150; // Should match CSS
    const itemMargin = 12; // Should match CSS margin (left + right)
    const itemTotalWidth = itemWidth + itemMargin;

    // Calculate the translation amount
    const slideAmount = -vsw_videoSlideIndex * itemTotalWidth;

    // Apply the transform
    vsw_videoSlider.style.transform = `translateX(${slideAmount}px)`;
}

// --- Resize Listener (Prefixed) ---
window.addEventListener('resize', () => {
    clearTimeout(vsw_resizeTimeout);
    vsw_resizeTimeout = setTimeout(() => {
        // Check if the active container and slider are still present
        const currentActiveContainer = vsw_activeSearchContainerId ? document.getElementById(vsw_activeSearchContainerId) : null;
        const sliderContainerElement = currentActiveContainer ? currentActiveContainer.querySelector('#vsw-video-slider-container') : null;

         if (sliderContainerElement && sliderContainerElement.style.display !== 'none') {
             const oldItemsPerPage = vsw_itemsPerPage;
             vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Recalculate

             // Adjust slide index if the number of visible items changed
             if (oldItemsPerPage !== vsw_itemsPerPage) {
                 const numVideoItems = vsw_currentVideoItems.length;
                 if (numVideoItems > vsw_itemsPerPage) {
                    const maxIndex = Math.max(0, numVideoItems - vsw_itemsPerPage);
                    vsw_videoSlideIndex = Math.min(vsw_videoSlideIndex, maxIndex); // Clamp index
                 } else {
                     vsw_videoSlideIndex = 0; // Reset if not enough items to scroll
                 }
             }

            vsw_updateVideoSlider(); // Update slider position

            // Update visibility of navigation buttons
            if (vsw_videoSliderNav) {
                vsw_videoSliderNav.style.display = vsw_currentVideoItems.length > vsw_itemsPerPage ? 'flex' : 'none';
            }
        }
    }, 250); // Debounce resize events
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

    // Collect values from all select dropdowns within the specific search box
    const selects = searchBox.querySelectorAll('select');
    selects.forEach(select => {
        if (select.value && select.value.trim() !== '') {
            dropdownSearchTerm += select.value.trim() + ' ';
            dropdownSelectionMade = true;
        }
    });

    // Get value from the text input within the specific search box
    const textInput = searchBox.querySelector('input[type="text"].vsw-custom-search-input');
    const textValue = textInput ? textInput.value.trim() : '';

    // Construct the final search term
    if (textValue) {
        // If text input has value, prioritize it but prepend dropdown terms
        finalSearchTerm = (dropdownSearchTerm + textValue).trim();
    } else if (dropdownSelectionMade) {
        // If no text input, use only dropdown terms
        finalSearchTerm = dropdownSearchTerm.trim();
    } else {
        // If neither text nor dropdown has value, show validation error
        vsw_showMessage(vsw_getTextById('vsw-msgValidationError'), 4000);
        return; // Stop the search
    }

    // If a valid search term is constructed, proceed
    vsw_hideMessage(); // Hide any previous messages (like validation error)
    vsw_fetchYouTubeData(finalSearchTerm); // Fetch data using the combined term
}


// --- UI Helper Functions (Prefixed) ---
function vsw_showVideoSections() {
    // Only show sections if there are videos to display
    if (vsw_currentVideoItems && vsw_currentVideoItems.length > 0) {
        // Show slider container
        if (vsw_videoSliderContainer) {
            vsw_videoSliderContainer.style.display = 'block';
        }
        // Show player only if an iframe source is set (i.e., a video was loaded)
        if (vsw_videoDisplay && vsw_youtubeIframe && vsw_youtubeIframe.src && vsw_youtubeIframe.src !== 'about:blank') {
            vsw_videoDisplay.style.display = 'block';
        } else if (vsw_videoDisplay) {
            vsw_videoDisplay.style.display = 'none'; // Ensure player is hidden if no src
        }

        // Update and show/hide navigation buttons
        if (vsw_videoSliderNav) {
             vsw_itemsPerPage = vsw_calculateItemsPerPage(); // Ensure calculation is up-to-date
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
    if (!vsw_messageBox) return; // Element doesn't exist
    clearTimeout(vsw_messageTimeout); // Clear any existing timer

    const textToShow = messageText || vsw_getTextById('vsw-msgInternalError'); // Fallback message

    if (textToShow) {
        vsw_messageBox.textContent = textToShow;
        vsw_messageBox.style.display = 'block';
        // Set a new timer to hide the message
        vsw_messageTimeout = setTimeout(vsw_hideMessage, duration);
    } else {
        // This case should ideally not be reached if vsw_getTextById has fallbacks
        console.error("showMessage called with null or empty text, and fallback failed.");
        vsw_messageBox.style.display = 'none'; // Ensure it's hidden
    }
}


// Prefixed hideMessage
function vsw_hideMessage() {
    if (!vsw_messageBox) return;
    clearTimeout(vsw_messageTimeout); // Clear timer if hiding manually
    vsw_messageBox.style.display = 'none';
}
</script>
