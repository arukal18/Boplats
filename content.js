// Clear sessionStorage on page reload
window.addEventListener('beforeunload', function() {
    sessionStorage.clear();
});
(async function() {
    // Set cache expiration time (in milliseconds)
    const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

    // Get all the apartment listings on the main page
    const listings = document.querySelectorAll('.search-result-item');

    // Iterate over each listing
    listings.forEach(async (listing, index) => {
        const linkElement = listing.querySelector('a.search-result-link');
        const apartmentUrl = linkElement.href;

        // Use the URL as a unique key to store the queue position
        const cacheKey = `queuePosition-${apartmentUrl}`;
        const cacheTimestampKey = `queuePositionTimestamp-${apartmentUrl}`;

        // Check if the queue position is already cached
        const cachedQueuePosition = sessionStorage.getItem(cacheKey);
        const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);

        // Check if cache exists and is still valid
        if (cachedQueuePosition && cacheTimestamp) {
            const now = Date.now();
            if (now - cacheTimestamp < CACHE_EXPIRATION_TIME) {
                console.log(`Using cached queue position for apartment ${index + 1}: ${cachedQueuePosition}`);
                // Display the cached result
                displayQueuePosition(listing, cachedQueuePosition);
                return;
            } else {
                // Cache expired, remove the old cache
                sessionStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheTimestampKey);
            }
        }

        try {
            // Log the URL to confirm we're fetching the right page
            console.log(`Fetching apartment ${index + 1} from URL: ${apartmentUrl}`);

            // Fetch the HTML of the apartment's individual page
            const response = await fetch(apartmentUrl);
            const apartmentHtml = await response.text();
            const parser = new DOMParser();
            const apartmentDoc = parser.parseFromString(apartmentHtml, 'text/html');

            // Target the #predicted-position element
            const predictedPositionElement = apartmentDoc.querySelector('#predicted-position');
            let queuePosition = "Not available";

            if (predictedPositionElement) {
                const predictedText = predictedPositionElement.textContent.trim();
                
                // Regex to match queue positions (X före dig or X before you) OR empty queue (0 sökande or 0 applicants)
                const matchQueue = predictedText.match(/\((\d+ (före dig|before you))/); // Match queue positions
                const matchEmptyQueue = predictedText.match(/(\d+ (sökande just nu|applicants right now))/); // Match empty queue

                if (matchQueue) {
                    queuePosition = matchQueue[1];  // Extract the "X före dig" or "X before you"
                    console.log(`Queue position for apartment ${index + 1}: ${queuePosition}`);
                } else if (matchEmptyQueue) {
                    // Extract "0 sökande" or "0 applicants"
                    queuePosition = matchEmptyQueue[1].replace("just nu", "").replace("right now", "").trim();
                    console.log(`Empty queue for apartment ${index + 1}: ${queuePosition}`);
                } else {
                    console.log(`Queue position not found in predicted position for apartment ${index + 1}.`);
                }
            }

            // Store the queue position and the timestamp in sessionStorage
            const now = Date.now();
            sessionStorage.setItem(cacheKey, queuePosition);
            sessionStorage.setItem(cacheTimestampKey, now);

            // Display the result
            displayQueuePosition(listing, queuePosition);
        } catch (error) {
            console.error(`Error fetching apartment ${index + 1}:`, error);
        }
    });

    // Helper function to display the queue position
    function displayQueuePosition(listing, queuePosition) {
        // Find the publ-date element on the main page and insert the queue position after it
        const publDateElement = listing.querySelector('.publ-date');
        
        // Check if publDateElement exists
        if (!publDateElement) {
            console.log(`No 'publ-date' element found for listing.`);
            return;
        }

        const queueInfo = document.createElement('div');
        queueInfo.textContent = `${queuePosition}`;
        queueInfo.classList.add('queue-info');  // Apply the CSS class

        // Insert the queue information into the DOM
        publDateElement.insertAdjacentElement('beforeend', queueInfo);
    }
})();