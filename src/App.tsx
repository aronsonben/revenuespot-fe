import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Box,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { getTrackByURI, getTrackPlayCount } from './services/spotifyService';
import { SpotifyTrack } from './types/spotify';
import TrackInfo from './components/TrackInfo';
import './App.css';

function App() {
  const [trackUri, setTrackUri] = useState<string>('');
  const [trackInfo, setTrackInfo] = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced states for play count and revenue features
  const [playCount, setPlayCount] = useState<number | null>(null);
  const [playCountLoading, setPlayCountLoading] = useState<boolean>(false);
  const [playCountError, setPlayCountError] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<{
    perStream: number;
    total: number | null;
    currency: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackUri.trim()) {
      setError("Please enter a Spotify track URI");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      // Clear play count info when fetching new track info
      setPlayCount(null);
      setPlayCountError(null);
      setTrackName(null);
      setRevenue(null);
      
      const track = await getTrackByURI(trackUri);
      setTrackInfo(track);
    } catch (err) {
      setTrackInfo(null);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for play count button with revenue calculation
  const handleFetchPlayCount = async () => {
    if (!trackUri.trim()) {
      setPlayCountError("Please enter a Spotify track URI");
      return;
    }
    
    try {
      setPlayCountError(null);
      setPlayCount(null);
      setTrackName(null);
      setRevenue(null);
      setPlayCountLoading(true);
      
      const result = await getTrackPlayCount(trackUri);
      setPlayCount(result.count);
      setTrackName(result.trackName);
      setRevenue(result.revenue);
      
      if (!result.count) {
        setPlayCountError("Could not find play count for this track");
      }
    } catch (err) {
      setPlayCount(null);
      setRevenue(null);
      setPlayCountError(err instanceof Error ? err.message : 'An unknown error occurred fetching play count');
    } finally {
      setPlayCountLoading(false);
    }
  };

  // Format revenue for display
  const formattedRevenue = revenue?.total 
    ? `$${revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : 'Not available';

  return (
    <div className="flex flex-column justify-start h-full py-8 px-4">
      <Container maxWidth="xl" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 4, width: "100%"}}>
          <Typography variant="h3" component="h1" sx={{ fontStyle: "bold" }}>
            Spotify Revenue Estimator
          </Typography>
          <Typography variant="subtitle1" sx={{ fontSize: "0.75rem", fontStyle: "italic", color: "gray" }} className="text-gray-600 mt-2">
            Enter a Spotify Track URI or URL (e.g., spotify:track:4iV5W9uYEdYUVa79Axb7Rh)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: 'center', mb: 4, width: "100%"}}>
          <Typography variant="body1" component="p" sx={{ fontStyle: "bold" }}>
            Copy & Paste Examples:
          </Typography>
          <Link href="https://open.spotify.com/track/4nlH5jTAEsKrWYYVfUouRX?si=ca8b4c07e2824921" sx={{ fontSize: "0.75rem"}}>
            https://open.spotify.com/track/4nlH5jTAEsKrWYYVfUouRX?si=ca8b4c07e2824921
          </Link>
          <Link href="https://open.spotify.com/track/4ihBJSo0FLvZyVTrdjfd5s?si=89dd176d14704a8a" sx={{ fontSize: "0.75rem"}}>
            https://open.spotify.com/track/4ihBJSo0FLvZyVTrdjfd5s?si=89dd176d14704a8a
          </Link>
          <Link href="https://open.spotify.com/album/0QPXpZi8S4iZRqS5LVyy55?si=n9gDe9xoSJa9CnJNrU8IEA" sx={{ fontSize: "0.75rem"}}>
            (fail) https://open.spotify.com/album/0QPXpZi8S4iZRqS5LVyy55?si=n9gDe9xoSJa9CnJNrU8IEA
          </Link>
        </Box>

        <Paper elevation={3} sx={{ p: 2, width: "100%" }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={trackUri}
                onChange={(e) => setTrackUri(e.target.value)}
                placeholder="spotify:track:4iV5W9uYEdYUVa79Axb7Rh or https://open.spotify.com/track/..."
                label="Spotify Track URI or URL"
                error={!!error || !!playCountError}
                helperText={error}
                className="flex-grow"
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, mt: 2}}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="h-14"
                  sx={{ px: 3 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Get Full Info'}
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={handleFetchPlayCount}
                  disabled={playCountLoading}
                  className="h-14"
                  sx={{ px: 3 }}
                >
                  {playCountLoading ? <CircularProgress size={24} color="inherit" /> : 'Get Play Count Only'}
                </Button>
              </Box>
            </Box>
            
            {/* Play count results with revenue */}
            {(playCount !== null || playCountError) && !loading && !trackInfo && (
              <Box sx={{ mt: 2, backgroundColor: "pink" }}>
                {playCountError ? (
                  <Alert severity="error">{playCountError}</Alert>
                ) : (
                  <>
                    <Alert severity="success">
                      {trackName ? (
                        <span><strong>{trackName}</strong> has <strong>{playCount?.toLocaleString()}</strong> plays on Spotify</span>
                      ) : (
                        <span>Play count: <strong>{playCount?.toLocaleString()}</strong></span>
                      )}
                    </Alert>
                    
                    {revenue && revenue.total && (
                      <Alert severity="info" icon={false}>
                        <Box className="flex flex-col">
                          <Typography variant="body1">
                            <span>Estimated Revenue: </span>
                            <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {formattedRevenue}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (based on ${revenue.perStream.toFixed(5)} per stream)
                          </Typography>
                        </Box>
                      </Alert>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        <TrackInfo track={trackInfo} loading={loading} error={error} />
      </Container>
    </div>
  );
}

export default App;
