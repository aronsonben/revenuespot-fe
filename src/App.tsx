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
import NavBar from './components/NavBar';
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
    <>
      <NavBar />
      <div id="sunset-notification" style={{ display: "flex", justifyContent: "center", alignItems: "center", maxWidth: "50vw", backgroundColor: "#fffae6", padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <p><b>DEV NOTE:</b> hello! I have shut down this Spotify Revenue Estimator for cost-saving purposes. 
        You can read more about the project <a href="https://concourse.codes/projects/revenuespot.html" target="_blank" style={{ textDecoration: 'underline' }}>here.</a></p>
      </div>
      <div className="flex flex-column justify-start h-full py-8 px-4" style={{ padding: "2rem" }}>
        <Container maxWidth="xl" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 4, width: "100%"}}>
            <Typography variant="h4" component="h4" sx={{ fontStyle: "bold" }}>
              Spotify Revenue Estimator
            </Typography>
            <Typography variant="subtitle1" sx={{ fontSize: "0.75rem", fontStyle: "italic", color: "gray" }} className="text-gray-600 mt-2">
              Enter a Spotify track URL taken from the&nbsp;
              <Link href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
              Spotify Web Player page
              </Link>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", flexDirection: "column", gap: 1, textAlign: 'center', mb: 4, width: "100%"}}>
            <Typography variant="body1" component="p" sx={{ fontStyle: "bold" }}>
              Example URIs:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontSize: "0.75rem", fontStyle: "italic", color: "gray" }} className="text-gray-600 mt-2">
              Click to populate the input field.
            </Typography>
            <Link
              component="button"
              onClick={() => setTrackUri("https://open.spotify.com/track/4nlH5jTAEsKrWYYVfUouRX?si=ca8b4c07e2824921")}
              sx={{ fontSize: "0.75rem", textAlign: 'left', justifyContent: 'flex-start', width: 'fit-content' }}
            >
              https://open.spotify.com/track/4nlH5jTAEsKrWYYVfUouRX?si=ca8b4c07e2824921
            </Link>
            <Link
              component="button"
              onClick={() => setTrackUri("https://open.spotify.com/track/4ihBJSo0FLvZyVTrdjfd5s?si=89dd176d14704a8a")}
              sx={{ fontSize: "0.75rem", textAlign: 'left', justifyContent: 'flex-start', width: 'fit-content' }}
            >
              https://open.spotify.com/track/4ihBJSo0FLvZyVTrdjfd5s?si=89dd176d14704a8a
            </Link>
            <Link
              component="button"
              onClick={() => setTrackUri("https://open.spotify.com/album/0QPXpZi8S4iZRqS5LVyy55?si=n9gDe9xoSJa9CnJNrU8IEA")}
              sx={{ fontSize: "0.75rem", textAlign: 'left', justifyContent: 'flex-start', width: 'fit-content' }}
            >
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
      <footer id="footer" style={{ width: "100vw", fontSize: "0.75rem", borderTop: "1px solid black", backgroundColor: "hsl(40, 30%, 96%)", padding: "1rem 0" }}>
        <p style={{ margin: "0 auto", padding: "0", textAlign: "center" }}>
          another{" "}
          <a
            href="https://concourse.codes"
            target="_blank"
            className="font-bold hover:underline"
            rel="noreferrer"
            style={{ fontSize: "0.75rem", fontWeight: "bold" }}
          >
            bo rice brainblast
          </a>
        </p>
      </footer>
    </>
  );
}

export default App;
