import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import puppeteer from 'puppeteer';

// ES module equivalent of __dirname
const url = import.meta.url;
const __filename = fileURLToPath(url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the React app build directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Enable CORS for all routes
app.use(cors());

// app.get("/", (req, res) => res.send("Express on Vercel"));


app.get('/api/spotify/track/:trackId', async (req, res) => {
  const { trackId } = req.params;
  const spotifyWebUrl = `https://open.spotify.com/track/${trackId}`;
  
  console.log(`Fetching Spotify web page for track ID: ${trackId}`);
  
  let browser = null;
  
  console.log("Launching headless.. ");
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Open new page
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(30000);
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the Spotify page
    await page.goto(spotifyWebUrl, { waitUntil: 'networkidle2' });
    
    // Wait for content to load - this selector should be something that appears when the page is fully loaded
    await page.waitForSelector('body', { visible: true });
    
    // Optional: Wait additional time for JavaScript to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Checking play counts... ");

    // Get play count data
    const playCountData = await page.evaluate(() => {
      // Look for elements with play counts
      console.log("About to fetch all play counts");
      const playCountElements = Array.from(document.querySelectorAll('[data-testid="playcount"]'));
      console.log(playCountElements);
      const playCountsData = [];
      
      // Attempt to find play count for the current track
      for (const el of playCountElements) {
        // Check if this element has a number with commas that looks like a play count
        if (el.textContent && /^[0-9,]+$/.test(el.textContent.trim())) {
          const count = el.textContent.trim();
          playCountsData.push({
            count,
            element: el.outerHTML
          });
        }
      }
      
      // If we can't find the exact play count, get popular tracks with their counts
      const popularTracks = [];
      const trackElements = document.querySelectorAll('[data-testid="track-row"]');
      
      trackElements.forEach(track => {
        const nameElement = track.querySelector('[data-testid="internal-track-link"]');
        const countElement = track.querySelector('span:not([data-testid])');
        
        if (nameElement && countElement) {
          const name = nameElement.textContent;
          const count = countElement.textContent;
          if (/^[0-9,]+$/.test(count.trim())) {
            popularTracks.push({ name, count: count.trim() });
          }
        }
      });
      
      // Get track name from title
      const title = document.title;
      const trackName = title.split(' - ')[0];
      
      return {
        trackName,
        playCounts: playCountsData,
        popularTracks
      };
    });

    console.log(playCountData);
    
    // Calculate revenue based on play count
    const REVENUE_PER_STREAM = 0.00238; // Spotify revenue per stream in USD
    let estimatedRevenue = null;
    let playCountValue = null;
    
    // Try to get play count from primary source
    if (playCountData.playCounts && playCountData.playCounts.length > 0) {
      playCountValue = parseInt(playCountData.playCounts[0].count.replace(/,/g, ''), 10);
    } 
    // Fall back to popular tracks if primary source is not available
    else if (playCountData.popularTracks && playCountData.popularTracks.length > 0) {
      // Find track that matches our current track
      const matchingTrack = playCountData.popularTracks.find(
        track => playCountData.trackName && track.name && 
                track.name.toLowerCase().includes(playCountData.trackName.toLowerCase())
      );
      
      if (matchingTrack) {
        playCountValue = parseInt(matchingTrack.count.replace(/,/g, ''), 10);
      } else if (playCountData.popularTracks[0]) {
        // Fallback to first popular track if no match
        playCountValue = parseInt(playCountData.popularTracks[0].count.replace(/,/g, ''), 10);
      }
    }
    
    // Calculate revenue if we have a play count
    if (playCountValue && !isNaN(playCountValue)) {
      estimatedRevenue = playCountValue * REVENUE_PER_STREAM;
    }
    
    // Add revenue data to response
    const responseData = {
      ...playCountData,
      revenue: {
        perStream: REVENUE_PER_STREAM,
        total: estimatedRevenue,
        currency: 'USD'
      }
    };
    
    // Return the scraped data with revenue information
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching Spotify play count:', error.message);
    res.status(500).json({ error: 'Failed to fetch Spotify data', details: error.message });
  } finally {
    // Make sure to close the browser
    if (browser) {
      await browser.close();
    }
  }
});


// Default route to serve the React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} 

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;