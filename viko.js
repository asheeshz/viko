// --- Globals ---
const videoSliderContainer = document.getElementById('video-slider-container');
const videoDisplay = document.getElementById('video-display');
const videoSliderNav = document.getElementById('video-slider-nav');
const messageBox = document.getElementById('messageBox');
const videoSlider = document.getElementById('video-slider');
const youtubeIframe = document.getElementById('youtube-iframe');

let currentVideoItems = []; // To keep track of fetched videos for slider nav
let videoSlideIndex = 0;
const itemsPerPage = calculateItemsPerPage(); // Calculate how many items fit

// --- Initialization ---
window.onload = () => {
    hideVideoSections(); // Hide video parts initially
    // Hide all search category containers initially
    const allSearchContainers = document.querySelectorAll('.search-category-container');
    allSearchContainers.forEach(container => {
        container.style.display = 'none';
    });
    showMessage("कृपया ऊपर दी गई श्रेणियों में से एक चुनें।", 5000); // Show initial prompt
};

// --- Category Visibility ---
function showCategory(containerIdToShow) {
    // Hide all category containers first
    const allContainers = document.querySelectorAll('.search-category-container');
    allContainers.forEach(container => {
        container.style.display = 'none';
    });

    // Show the selected one
    const containerToShow = document.getElementById(containerIdToShow);
    if (containerToShow) {
        containerToShow.style.display = 'block';
         // Scroll to the container smoothly (optional)
        // containerToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Hide video sections and clear previous results when category changes
    hideVideoSections();
    clearVideoResults();
    hideMessage(); // Hide any existing messages
}

// --- YouTube API Interaction ---
async function fetchYouTubeData(searchTerm = '') {
    // IMPORTANT: Replace with your actual YouTube API Key
    // It's strongly recommended to keep API keys server-side or use OAuth 2.0
    // Exposing it directly in client-side code is insecure.
    const apiKey = 'YOUR_API_KEY_HERE'; // <<<<<<<<<<<<<<< REPLACE THIS
    // Ensure API Key is replaced before deployment
    if (apiKey === 'YOUR_API_KEY_HERE') {
         console.error("API Key not replaced in script.js!");
         showMessage("त्रुटि: API कुंजी कॉन्फ़िगर नहीं है।", 5000);
         return; // Stop execution if key is missing
    }

    const apiHost = 'youtube.googleapis.com';
    const maxResults = 30; // Fetch more results for better slider experience

    // Construct API URL
    let apiUrl = `https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;
    if (searchTerm) {
        apiUrl += `&q=${encodeURIComponent(searchTerm)}`;
    } else {
        // Default search if no term provided (e.g., trending, educational)
        // Using a generic term like 'educational videos hindi' as a fallback
        apiUrl += `&q=${encodeURIComponent('शैक्षणिक वीडियो हिंदी')}`;
    }

    console.log('API URL:', apiUrl);
    showMessage("वीडियो खोजे जा रहे हैं...", 2000); // Show loading message

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json' // Standard header
            }
        });

        // Check for HTTP errors
        if (!response.ok) {
            const errorData = await response.json(); // Try to get error details from YouTube
            console.error('API Error Response:', errorData);
            let errorMessage = `API त्रुटि (${response.status})`;
             if (errorData.error && errorData.error.message) {
                errorMessage += `: ${errorData.error.message}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('API Response Data:', data);

        // Check if items exist
        if (!data || !data.items || data.items.length === 0) {
            console.warn('No items found in API response.');
            showMessage("इस खोज के लिए कोई वीडियो नहीं मिला।", 4000);
            hideVideoSections();
            clearVideoResults();
            currentVideoItems = []; // Clear video items
            return;
        }

        // Success - display videos
        currentVideoItems = data.items; // Store fetched items
        displayVideos(currentVideoItems);
        showVideoSections(); // Make video sections visible


    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        showMessage(`वीडियो लोड करने में त्रुटि: ${error.message}`, 5000);
        hideVideoSections();
        clearVideoResults();
        currentVideoItems = []; // Clear video items
    }
}

// --- Video Display ---
function displayVideos(videos) {
    videoSlider.innerHTML = ''; // Clear previous thumbnails
    videoSlideIndex = 0; // Reset slider index

    if (!videos || videos.length === 0) {
        // This case should be handled by the message in fetchYouTubeData,
        // but added as a safeguard.
        videoSlider.innerHTML = '<p style="color:#555; padding: 20px;">कोई वीडियो उपलब्ध नहीं है।</p>';
        return;
    }

    videos.forEach((video, index) => {
        if (!video.id || !video.id.videoId || !video.snippet) return; // Skip malformed items

        const videoId = video.id.videoId;
        const videoTitle = video.snippet.title || 'Untitled Video';
        // Use high quality thumbnail if available, otherwise medium
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url || 'placeholder.png'; // Add a placeholder image URL

        const videoItem = document.createElement('div');
        videoItem.classList.add('video-item');
        videoItem.setAttribute('data-index', index); // Store index for slider navigation

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = videoTitle;
        thumbnail.onerror = function() { this.src='placeholder.png'; } // Handle broken thumbnails

        const title = document.createElement('p');
        title.textContent = videoTitle;
        // Decode HTML entities that might appear in titles
        title.innerHTML = title.innerHTML;

        videoItem.appendChild(thumbnail);
        videoItem.appendChild(title);

        // Add click listener to load video in the player
        videoItem.addEventListener('click', () => {
            displayEmbeddedVideo(videoId);
             // Optional: Scroll to the player when a thumbnail is clicked
            videoDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        videoSlider.appendChild(videoItem);
    });

    // Load the first video by default if videos exist
    if (videos.length > 0 && videos[0].id && videos[0].id.videoId) {
        displayEmbeddedVideo(videos[0].id.videoId);
    }

    updateVideoSlider(); // Position slider correctly
}

function displayEmbeddedVideo(videoId) {
    if (!videoId) {
        console.warn("Attempted to display video with invalid ID.");
        return;
    }
    console.log('Loading video ID:', videoId);
    youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`; // Added parameters
    youtubeIframe.onload = () => {
        console.log('iFrame loaded successfully for video ID:', videoId);
    };
     youtubeIframe.onerror = () => {
         console.error('iFrame failed to load for video ID:', videoId);
         showMessage("चयनित वीडियो लोड करने में विफल।", 3000);
     };
}

function clearVideoResults() {
    videoSlider.innerHTML = '';
    youtubeIframe.src = ''; // Clear the iframe
    currentVideoItems = [];
}

// --- Video Slider Navigation ---

// Calculate how many items fit based on container and item width
function calculateItemsPerPage() {
    const containerWidth = videoSliderContainer.offsetWidth;
    // Get item width + margin (approx 150px width + 12px margin)
    const itemWidth = 162;
    return Math.max(1, Math.floor(containerWidth / itemWidth));
}

function slideVideo(direction) {
    const numVideoItems = currentVideoItems.length;
    if (numVideoItems === 0) return; // No items to slide

    // Calculate new index based on pages/groups of visible items
    videoSlideIndex += direction * itemsPerPage;

    // Clamp the index within bounds
    if (videoSlideIndex < 0) {
        videoSlideIndex = 0; // Stop at the beginning
    } else if (videoSlideIndex >= numVideoItems) {
        // Go back to ensure the last page is fully visible
        videoSlideIndex = Math.max(0, numVideoItems - itemsPerPage);
    }

    console.log(`Sliding: direction=${direction}, newIndex=${videoSlideIndex}, itemsPerPage=${itemsPerPage}`);
    updateVideoSlider();
}

function updateVideoSlider() {
     if (currentVideoItems.length === 0) return;

    // Calculate the amount to translate based on index and item width + margin
    const itemWidth = 150; // Base width from CSS
    const itemMargin = 12; // Total horizontal margin (6px left + 6px right)
    const slideAmount = -videoSlideIndex * (itemWidth + itemMargin);

    videoSlider.style.transform = `translateX(${slideAmount}px)`;
    console.log(`Slider updated: translateX(${slideAmount}px)`);
}

// Recalculate slider on window resize
window.addEventListener('resize', () => {
    // Recalculate itemsPerPage based on new width
     // itemsPerPage = calculateItemsPerPage(); // This might cause issues if called directly
    // Simply reposition slider based on current index
    updateVideoSlider();
});


// --- Search Logic ---
function performSearch(searchBoxId) {
    const searchBox = document.getElementById(searchBoxId);
    if (!searchBox) {
        console.error("Search box not found:", searchBoxId);
        return;
    }

    let finalSearchTerm = '';
    let dropdownSelectionMade = false;
    let dropdownSearchTerm = '';

    // Get dropdown selections
    const selects = searchBox.querySelectorAll('select');
    selects.forEach(select => {
        if (select.value && select.value.trim() !== '') {
            dropdownSearchTerm += select.value.trim() + ' ';
            dropdownSelectionMade = true;
        }
    });

    // Get text input value
    const textInput = searchBox.querySelector('.custom-search-input');
    const textValue = textInput ? textInput.value.trim() : '';

    // --- Validation Logic ---
    if (textValue !== '') {
        // If text input is used, at least one dropdown must also be selected
        if (!dropdownSelectionMade) {
            showMessage("टेक्स्ट खोज का उपयोग करते समय, कृपया कम से कम एक ड्रॉपडाउन विकल्प भी चुनें।", 4000);
            return; // Stop the search
        } else {
            // Combine dropdowns and text input
            finalSearchTerm = (dropdownSearchTerm + textValue).trim();
        }
    } else {
        // If text input is empty, at least one dropdown must be selected
        if (!dropdownSelectionMade) {
            showMessage("कृपया खोज करने के लिए कम से कम एक ड्रॉपडाउन विकल्प चुनें या टेक्स्ट बॉक्स में टाइप करें।", 4000);
            return; // Stop the search
        } else {
            // Use only dropdown selections
            finalSearchTerm = dropdownSearchTerm.trim();
        }
    }

    // If validation passed, proceed with the search
    hideMessage(); // Hide any previous messages
    console.log('Performing search for:', finalSearchTerm);

    // Fetch data using the combined search term
    fetchYouTubeData(finalSearchTerm);
}


// --- UI Helper Functions ---
function showVideoSections() {
    videoSliderContainer.style.display = 'block';
    videoDisplay.style.display = 'block';
    // Only show nav buttons if there are enough videos to scroll
    if (currentVideoItems.length > itemsPerPage) {
       videoSliderNav.style.display = 'flex';
    } else {
       videoSliderNav.style.display = 'none';
    }
}

function hideVideoSections() {
    videoSliderContainer.style.display = 'none';
    videoDisplay.style.display = 'none';
    videoSliderNav.style.display = 'none';
}

function showMessage(message, duration = 3000) {
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    // Automatically hide after duration
    setTimeout(() => {
        hideMessage();
    }, duration);
}

function hideMessage() {
    messageBox.style.display = 'none';
}
