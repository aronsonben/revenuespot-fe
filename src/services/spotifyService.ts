import { SpotifyTrack, SpotifyError } from '../types/spotify';

// Spotify client credentials from environment variables
// const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
// const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Helper to get track ID from Spotify URI
// URI format: spotify:track:1234567890abcdef
const extractTrackId = (uri: string): string | null => {
  const match = uri.match(/spotify:track:([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

// Helper to get track ID from Spotify URL
// URL format: https://open.spotify.com/track/4nlH5jTAEsKrWYYVfUouRX?si=f0ab2778e40746cc&nd=1&dlsi=81ce812a29174eaa
const extractTrackIdFromUrl = (url: string): string | null => {
  // More robust pattern that handles all query parameter variations
  const match = url.match(/https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(\?|$)/);
  return match ? match[1] : null;
};

// Helper to get track ID from either URI or URL format
const getTrackIdFromInput = (input: string): string | null => {
  if (input.startsWith('spotify:track:')) {
    return extractTrackId(input);
  } else if (input.startsWith('https://open.spotify.com/track/')) {
    return extractTrackIdFromUrl(input);
  }
  return null;
};

// [DEPRECATED] Get access token using Client Credentials flow
// Deprecated to only fetch access tokens in backend
/* 
const getAccessToken = async (): Promise<string> => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Spotify API credentials not found in environment variables');
  }
  
  try {
    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get access token');
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};
*/ 

const getAccessToken = async (): Promise<string> => {
  try {
    const response = await fetch('/api/spotify/token');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get access token');
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Get track information by URI or URL
export const getTrackByURI = async (input: string): Promise<SpotifyTrack> => {
  const trackId = getTrackIdFromInput(input);
  
  if (!trackId) {
    throw new Error('Invalid Spotify track URI or URL format');
  }

  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as SpotifyError;
      throw new Error(errorData.error?.message || 'Failed to fetch track data');
    }

    return data as SpotifyTrack;
  } catch (error) {
    console.error('Error fetching track:', error);
    throw error;
  }
};

// Get track play count by scraping the Spotify web page using our Puppeteer-powered backend
export const getTrackPlayCount = async (input: string): Promise<{ 
  count: number | null; 
  trackName: string | null;
  revenue: { 
    perStream: number; 
    total: number | null; 
    currency: string;
  } 
}> => {
  const trackId = getTrackIdFromInput(input);
  
  if (!trackId) {
    throw new Error('Invalid Spotify track URI or URL format');
  }

  try {
    // Use our backend proxy server with Puppeteer
    const proxyUrl = `/api/spotify/track/${trackId}`;
    
    // Fetch the data from our proxy
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    // Parse the JSON response from our Puppeteer-powered backend
    const data = await response.json();
    
    // Extract the track name
    const trackName = data.trackName || null;
    let count = null;
    
    // First, check if we have direct play counts
    if (data.playCounts && data.playCounts.length > 0) {
      // Use the first play count found
      count = parseInt(data.playCounts[0].count.replace(/,/g, ''), 10);
    }
    
    // If no direct play count, check popular tracks for a match
    else if (data.popularTracks && data.popularTracks.length > 0) {
      // Check if any of the popular tracks match our track name
      const matchingTrack = data.popularTracks.find(
        (track: { name: string; }) => trackName && track.name && track.name.toLowerCase().includes(trackName.toLowerCase())
      );
      
      if (matchingTrack) {
        count = parseInt(matchingTrack.count.replace(/,/g, ''), 10);
      } else if (data.popularTracks[0]) {
        // If no match, return the first popular track count as a fallback
        count = parseInt(data.popularTracks[0].count.replace(/,/g, ''), 10);
      }
    }
    
    // Get revenue data from the response or use default values
    const revenue = data.revenue || {
      perStream: 0.00238,
      total: count ? count * 0.00238 : null,
      currency: 'USD'
    };
    
    return { 
      count, 
      trackName, 
      revenue 
    };
  } catch (error) {
    console.error('Error fetching track play count:', error);
    return { 
      count: null, 
      trackName: null, 
      revenue: { 
        perStream: 0.00238, 
        total: null, 
        currency: 'USD' 
      } 
    };
  }
};