// --- Globals ---
// Ensure selectors target elements within the specific widget if multiple widgets exist
const widgetRoot = document.querySelector('.search-widget-container'); // Use the main container class
const stylishHeaderContainer = widgetRoot; // Alias for clarity
const videoSliderContainer = widgetRoot.nextElementSibling?.querySelector('#video-slider-container'); // Find NEXT sibling section
const videoDisplay = widgetRoot.nextElementSibling?.querySelector('#video-display');
const videoSliderNav = widgetRoot.nextElementSibling?.querySelector('#video-slider-nav');
const messageBox = widgetRoot.nextElementSibling?.querySelector('#messageBox');
const videoSlider = widgetRoot.nextElementSibling?.querySelector('#video-slider');
const youtubeIframe = widgetRoot.nextElementSibling?.querySelector('#youtube-iframe');

let currentVideoItems = [];
let videoSlideIndex = 0;
let itemsPerPage = 1; // Default, will be calculated
let messageTimeout;
let resizeTimeout;

// --- Initialization ---
function initWidget() {
    // Ensure all necessary elements were found
     if (!widgetRoot || !videoSliderContainer || !videoDisplay || !videoSliderNav || !messageBox || !videoSlider || !youtubeIframe) {
        console.error("Search Widget Error: Could not find all necessary HTML elements. Check HTML structure and IDs/classes.");
        // Optionally display an error message to the user within the widget root
         // widgetRoot.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Widget initialization failed. Contact site admin.</p>";
        return; // Stop initialization
    }

    hideVideoSections();
    // Hide all search category containers initially within this widget
    const allSearchContainers = widgetRoot.querySelectorAll('.search-category-container');
    allSearchContainers.forEach(container => {
        container.style.display = 'none';
    });
    itemsPerPage = calculateItemsPerPage(); // Calculate initial items per page

    // Add event listeners (delegated if possible, but direct is fine for this scope)
     window.addEventListener('resize', handleResize);

     console.log("Search widget initialized.");
}

// --- Category Visibility ---
function showCategory(containerIdToShow) {
     if (!widgetRoot) return; // Check if widget root exists

    let currentlyVisible = null;
    const allContainers = widgetRoot.querySelectorAll('.search-category-container');
    const containerToShow = widgetRoot.querySelector(`#${containerIdToShow}`); // Find within widget

     if (!containerToShow) {
         console.error(`Search category container not found: #${containerIdToShow}`);
         return;
     }

    allContainers.forEach(container => {
        if (container.style.display === 'block') {
            currentlyVisible = container.id;
        }
        if(container.id !== containerIdToShow) { // Don't hide the one we might show
            container.style.display = 'none';
        }
    });

    if (currentlyVisible === containerIdToShow) {
        containerToShow.style.display = 'none'; // Toggle off
        hideVideoSections(); // Hide results when form is closed
        clearVideoResults();
    } else {
        containerToShow.style.display = 'block'; // Show
        // Scroll the main container to show the opened form, useful on mobile
        setTimeout(() => {
             containerToShow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
         }, 100);
        // Hide previous results when switching categories
        hideVideoSections();
        clearVideoResults();
    }
    hideMessage();
}


// --- YouTube API Interaction ---
async function fetchYouTubeData(searchTerm = '') {
    // ======================================================================
    // !! IMPORTANT !! REPLACE 'YOUR_API_KEY_HERE' WITH YOUR ACTUAL API KEY
    // ======================================================================
    const apiKey = 'AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q';
    // ======================================================================

    if (apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
         console.error("YOUTUBE API KEY is missing in script.js!");
         showMessage("त्रुटि: API कुंजी कॉन्फ़िगर नहीं है। वीडियो नहीं खोजे जा सकते।", 6000);
         hideVideoSections();
         return;
    }

    // Ensure video sections exist before proceeding
     if (!videoSliderContainer || !videoDisplay || !videoSliderNav) {
         console.error("Video result sections not found. Cannot display results.");
         return;
     }


    const apiHost = 'www.googleapis.com';
    const maxResults = 30; // Fetch more for better slider
    let apiUrl = `https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;
    apiUrl += '®ionCode=IN'; // Geobias results

    if (searchTerm) {
        apiUrl += `&q=${encodeURIComponent(searchTerm)}`;
    } else {
        apiUrl += `&q=${encodeURIComponent('भारत नवीनतम शैक्षणिक वीडियो')}`; // Fallback
    }

    console.log('API Request URL:', apiUrl); // Log for debugging
    showMessage("वीडियो खोजे जा रहे हैं...", 3000);
    // Disable search button temporarily? (Optional)

    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

        if (!response.ok) {
            let errorData;
            try {
                 errorData = await response.json();
                 console.error('API Error Response:', errorData);
            } catch(e) {
                // If response is not JSON (e.g., network error, CORS)
                 console.error('API Error: Could not parse error response.');
                 throw new Error(`API HTTP त्रुटि (${response.status})`);
            }

            let errorMessage = `API त्रुटि (${response.status})`;
            if (errorData && errorData.error && errorData.error.message) {
                const reasonMatch = errorData.error.message.match(/reason=([a-zA-Z_]+)/);
                if (reasonMatch) {
                    if (reasonMatch[1] === 'keyInvalid') errorMessage = "API त्रुटि: कुंजी अमान्य है।";
                    else if (reasonMatch[1] === 'quotaExceeded') errorMessage = "API त्रुटि: दैनिक कोटा समाप्त।";
                    else errorMessage += `: ${reasonMatch[1]}`;
                } else {
                    errorMessage += `: ${errorData.error.message.substring(0, 100)}`; // Limit length
                }
            }
             throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data || !data.items || data.items.length === 0) {
            showMessage("इस खोज के लिए कोई वीडियो नहीं मिला। कृपया पुनः प्रयास करें।", 4000);
            hideVideoSections();
            clearVideoResults();
            currentVideoItems = [];
            return;
        }

        // Filter for valid items FIRST
        currentVideoItems = data.items.filter(item => item.id?.videoId && item.snippet?.thumbnails?.medium?.url && item.snippet?.title);

        if (currentVideoItems.length === 0) {
             showMessage("कोई प्रासंगिक वीडियो नहीं मिला।", 4000);
            hideVideoSections();
            clearVideoResults();
            return;
        }

        displayVideos(currentVideoItems); // Display valid items
        showVideoSections(); // Show sections AFTER successful fetch & filtering

    } catch (error) {
        console.error('Fetch Error:', error);
        showMessage(`वीडियो लोड करने में त्रुटि: ${error.message}`, 6000);
        hideVideoSections();
        clearVideoResults();
        currentVideoItems = [];
    } finally {
        // Re-enable search button
