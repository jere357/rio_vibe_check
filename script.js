// Define achievement levels with corresponding scores
const achievementLevels = {
    'explorer': 1,
    'challenger': 2,
    'conqueror': 3,
    'master': 4,
    'hero': 5
};

// Define maximum achievement level per expansion
const maxAchievementLevels = {
    'Legion': 4,           // Up to 'master'
    'Battle for Azeroth': 4,
    'Shadowlands': 4,
    'Dragonflight': 5,     // Up to 'hero'
    'The War Within': 5
};

// List of expansions and their seasons
const expansions = {
    'Legion': ['Season One', 'Season Two', 'Season Three', 'Season Four'],
    'Battle for Azeroth': ['Season One', 'Season Two', 'Season Three', 'Season Four'],
    'Shadowlands': ['Season One', 'Season Two', 'Season Three', 'Season Four'],
    'Dragonflight': ['Season One', 'Season Two', 'Season Three', 'Season Four'],
    'The War Within': ['Season One', 'Season Two', 'Season Three', 'Season Four']
};

const clientId = 'b5cd1599880345b7a5a17f454340b58a';
const clientSecret = 'pa4FmLOF14dFMOsfgZMEwyjPfRuVUdR3';

// Function to fetch and display achievements
async function fetchAndDisplayAchievements(region, realm, characterName) {
    try {
        // Step 1: Obtain OAuth 2.0 Access Token
        const token = await getAccessToken();

        // Step 2: Fetch achievements data
        const achievementsData = await fetchAchievementsData(region, token, realm, characterName);

        // Step 3: Parse and display achievements
        parseAndDisplayAchievements(achievementsData);

    } catch (error) {
        console.error('Error fetching achievements:', error);
        document.getElementById('result').textContent = 'Error fetching achievements. Please try again later.';
    }
}

// Function to get OAuth 2.0 Access Token
async function getAccessToken() {
    const tokenUrl = 'https://oauth.battle.net/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const data = await response.json();
    if (data.access_token) {
        return data.access_token;
    } else {
        throw new Error('Failed to obtain access token');
    }
}

// Function to fetch achievements data using corsproxy.io
async function fetchAchievementsData(region, token, realm, characterName) {
    // Construct the API URL
    const namespace = `profile-${region}`;
    const localeMap = {
        'us': 'en_US',
        'eu': 'en_GB',
        'kr': 'ko_KR',
        'tw': 'zh_TW',
        'cn': 'zh_CN'
    };
    const locale = localeMap[region] || 'en_US';
    const apiUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realm}/${characterName}/achievements?namespace=${namespace}&locale=${locale}&access_token=${token}`;

    // Use corsproxy.io to bypass CORS restrictions
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    // Make the fetch request
    const response = await fetch(proxyUrl);

    // Parse the response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${data.detail || data.message}`);
    }

    // Return the data
    if (data.achievements) {
        return data;
    } else {
        throw new Error('Failed to fetch achievements data');
    }
}
// Function to display the player's progress
// Define achievement levels with corresponding scores
// Existing code...

// Function to display the player's progress
function displayPlayerProgress(playerProgress) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Clear previous results
    const achievementLevels = {
        'none': 0,
        'explorer': 1,
        'challenger': 2,
        'conqueror': 3,
        'master': 4,
        'hero': 5
    };
        
    // Create a container for all expansions
    const expansionsGrid = document.createElement('div');
    expansionsGrid.className = 'expansions-grid';

    // Iterate over each expansion
    for (const expansion in expansions) {
        // Create expansion container
        const expansionContainer = document.createElement('div');
        expansionContainer.className = 'expansion-container';

        // Create expansion header
        const expansionHeader = document.createElement('h2');
        expansionHeader.textContent = expansion;
        expansionContainer.appendChild(expansionHeader);

        // Create a container for seasons
        const seasonsContainer = document.createElement('div');
        seasonsContainer.className = 'seasons-container';

        // Iterate over each season
        expansions[expansion].forEach(season => {
            // Get the player's achievement level for this season
            const level = playerProgress[expansion]?.[season] || 'none';

            // Create season element
            const seasonElement = document.createElement('div');
            seasonElement.className = 'season';

            // Create season title
            const seasonTitle = document.createElement('h3');
            seasonTitle.textContent = season;
            seasonElement.appendChild(seasonTitle);

            // Create progress element
            const progressElement = document.createElement('div');
            progressElement.className = 'progress-circle';

            // Determine the level score
            const levelScore = achievementLevels[level];

            // Set data-level attribute for styling
            progressElement.setAttribute('data-level', levelScore);

            // Add label for the level
            const levelLabel = document.createElement('span');
            levelLabel.className = 'level-label';
            levelLabel.textContent = level !== 'none' ? level.charAt(0).toUpperCase() + level.slice(1) : 'None';

            progressElement.appendChild(levelLabel);
            seasonElement.appendChild(progressElement);

            // Append season element to seasons container
            seasonsContainer.appendChild(seasonElement);
        });

        // Append seasons container to expansion container
        expansionContainer.appendChild(seasonsContainer);

        // Append expansion container to expansions grid
        expansionsGrid.appendChild(expansionContainer);
    }

    // Append expansions grid to result div
    resultDiv.appendChild(expansionsGrid);
}// Function to parse and display achievements
function parseAndDisplayAchievements(data) {
    const achievements = data.achievements;

    // Initialize data structure to store highest achievements per expansion and season
    const playerProgress = {};

    // Iterate over the player's achievements
    achievements.forEach(ach => {
        const achievementName = ach.achievement.name;
        const match = achievementName.match(/^(.*?) Keystone (.*?): (Season \w+)/);

        if (match) {
            const expansion = match[1].trim();
            const level = match[2].trim().toLowerCase(); // 'explorer', 'conqueror', etc.
            const season = match[3].trim();

            // Ensure the expansion is one we're interested in
            if (expansions.hasOwnProperty(expansion)) {
                // Initialize expansion data if not already present
                if (!playerProgress[expansion]) {
                    playerProgress[expansion] = {};
                }

                // Get the current highest level for this season
                const currentLevel = playerProgress[expansion][season];

                // Update if this achievement is higher
                if (!currentLevel || achievementLevels[level] > achievementLevels[currentLevel]) {
                    playerProgress[expansion][season] = level;
                }
            }
        }
    });

    // Display the achievements
    displayPlayerProgress(playerProgress);
}
// Function to display achievements on the page
function displayAchievements(achievements, category) {
    const resultDiv = document.getElementById('result');

    // Create category header
    const categoryHeader = document.createElement('h2');
    categoryHeader.textContent = category;
    resultDiv.appendChild(categoryHeader);

    if (achievements.length === 0) {
        const noAchievements = document.createElement('p');
        noAchievements.textContent = `No achievements found for ${category}.`;
        resultDiv.appendChild(noAchievements);
        return;
    }

    // Create list of achievements
    const list = document.createElement('ul');

    achievements.forEach(ach => {
        const listItem = document.createElement('li');
        listItem.textContent = `${ach.achievement.name}`;
        list.appendChild(listItem);
    });

    resultDiv.appendChild(list);
}

// Update the event listener
document.getElementById('check-button').addEventListener('click', function() {
    // Clear previous results
    document.getElementById('result').innerHTML = '';

    const raiderioUrl = document.getElementById('raiderio-url').value;
    const wowUrl = convertUrl(raiderioUrl);

    if (wowUrl) {
        // Extract region, realm, and character name
        const urlParts = new URL(wowUrl);
        const pathSegments = urlParts.pathname.split('/').filter(segment => segment !== '');
        const region = pathSegments[2];          // 'us', 'eu', etc.
        const realm = pathSegments[3];           // Realm name
        const characterName = pathSegments[4];   // Character name

        // Decode realm and character names
        const decodedRealm = decodeURIComponent(realm);
        const decodedCharacterName = decodeURIComponent(characterName);

        // Create slugs for realm and character
        const realmSlug = slugify(decodedRealm);
        const characterSlug = slugify(decodedCharacterName);
        console.log(characterSlug)
        console.log(decodedCharacterName)
        // Fetch and display achievements
        fetchAndDisplayAchievements(region, realmSlug, characterSlug);
    } else {
        document.getElementById('result').textContent = 'Invalid raider.io URL';
    }
});

// Helper function to slugify realm and character names
function slugify(text) {
    return text.toLowerCase()
        .replace(/['’]/g, '')            // Remove apostrophes
        .replace(/\s+/g, '-')            // Replace spaces with hyphens
        //.replace(/[^a-z0-9-]/g, '')      // Remove invalid characters
        .trim();
}

// Your existing convertUrl function remains the same
function convertUrl(raiderioUrl) {
    try {
        var url = new URL(raiderioUrl);
        if (url.hostname !== 'raider.io') {
            return null;
        }
        var pathParts = url.pathname.split('/').filter(part => part !== '');
        // Expected format: /characters/{region}/{realm}/{character}
        if (pathParts.length >= 4 && pathParts[0] === 'characters') {
            var region = pathParts[1];
            var realm = pathParts[2];
            var character = pathParts[3];

            // Decode realm and character names in case they are URL-encoded
            realm = decodeURIComponent(realm);
            character = decodeURIComponent(character);
            console.log(character)

            // Determine the locale based on the region (optional)
            var locale;
            if (region.toLowerCase() === 'us') {
                locale = 'en-us';
            } else if (region.toLowerCase() === 'eu') {
                locale = 'en-gb';
            } else {
                // Default to 'en-us' if region is not 'us' or 'eu'
                locale = 'en-us';
            }

            var wowDomain = 'worldofwarcraft.blizzard.com';
            // Re-encode realm and character names to ensure proper URL encoding
            var encodedRealm = encodeURIComponent(realm);
            var encodedCharacter = encodeURIComponent(character);

            var wowUrl = 'https://' + wowDomain + '/' + locale + '/character/' + region + '/' + encodedRealm + '/' + encodedCharacter;

            return wowUrl;
        } else {
            return null;
        }
    } catch (e) {
        return null;
    }
}
