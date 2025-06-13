import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { useState, useEffect } from 'react';
import { SpotifyTrack } from '../types/spotify';
import { getTrackPlayCount } from '../services/spotifyService';

interface TrackInfoProps {
  track: SpotifyTrack | null;
  loading: boolean;
  error: string | null;
}

const TrackInfo = ({ track, loading, error }: TrackInfoProps) => {
  const [playCount, setPlayCount] = useState<number | null>(null);
  const [playCountLoading, setPlayCountLoading] = useState(false);
  const [revenue, setRevenue] = useState<{
    perStream: number;
    total: number | null;
    currency: string;
  } | null>(null);

  useEffect(() => {
    const fetchPlayCount = async () => {
      if (track && track.uri) {
        setPlayCountLoading(true);
        try {
          const result = await getTrackPlayCount(track.uri);
          setPlayCount(result.count);
          setRevenue(result.revenue);
        } catch (err) {
          console.error('Error fetching play count:', err);
        } finally {
          setPlayCountLoading(false);
        }
      }
    };

    fetchPlayCount();
  }, [track]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center p-8">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="mt-4">
        {error}
      </Alert>
    );
  }

  if (!track) {
    return null;
  }

  const durationInMinutes = Math.floor(track.duration_ms / 60000);
  const durationInSeconds = Math.floor((track.duration_ms % 60000) / 1000);
  const formattedDuration = 
    `${durationInMinutes}:${durationInSeconds.toString().padStart(2, '0')}`;

  // Format play count with commas for thousands
  const formattedPlayCount = playCount ? playCount.toLocaleString() : 'Not available';
  
  // Format revenue
  const formattedRevenue = revenue?.total 
    ? `$${revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : 'Not available';

  return (
    <Card id="track-info-root" elevation={3} sx={{ my: 2, width: '100%', mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Grid container columnSpacing={4} rowSpacing={2}>
          {/* Album Cover */}
          <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column",alignItems: "center", justifyContent: "center" }} >
            {track.album.images && track.album.images.length > 0 && (
              <img 
                src={track.album.images[0].url} 
                alt={`${track.album.name} cover`} 
                style={{ maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
              />
            )}
          </Grid>

          {/* Track Information */}
          <Grid item xs={12} md={8} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center"}}>
            <Typography variant="h4" component="h4" className="font-bold text-gray-800">
              {track.name}
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="body2" className="text-gray-700">
                <span style={{ fontWeight: "bold" }}>Artists:</span> {' '}
                {track.artists.map(artist => artist.name).join(', ')}
              </Typography>
              
              <Typography variant="body2" className="text-gray-700">
                <span style={{ fontWeight: "bold" }}>Album:</span> {' '}
                {track.album.name}
              </Typography>
              
              <Typography variant="body2" className="text-gray-700">
                <span style={{ fontWeight: "bold" }}>Release Date:</span> {' '}
                {track.album.release_date}
              </Typography>
              
              <Typography variant="body2" className="text-gray-700">
                <span style={{ fontWeight: "bold" }}>Duration:</span> {' '}
                {formattedDuration}
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2}} >
                <Typography variant="body2" className="text-gray-700">
                  <span style={{ fontWeight: "bold" }}>Popularity:</span> {' '}
                  {track.popularity}/100
                </Typography>
                
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={track.popularity} 
                    size={24} 
                    thickness={4} 
                    sx={{ color: '#1a90ff' }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      {track.popularity}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Play Count - New Addition */}
              <Typography variant="body2" className="text-gray-700">
                <span style={{ fontWeight: "bold" }}>Play Count:</span> {' '}
                {playCountLoading ? (
                  <CircularProgress size={16} thickness={4} />
                ) : (
                  formattedPlayCount
                )}
              </Typography>
              
              {/* Estimated Revenue - New Addition */}
              <Typography variant="body2" className="text-gray-700">
                <span style={{ fontWeight: "bold" }}>Estimated Revenue:</span> {' '}
                {playCountLoading ? (
                  <CircularProgress size={16} thickness={4} />
                ) : (
                  <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {formattedRevenue}
                  </Box>
                )}
                {revenue && !playCountLoading && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2 }}>
                    (based on ${revenue.perStream.toFixed(5)} per stream)
                  </Typography>
                )}
              </Typography>
              
              {track.explicit && (
                <Box mt={1}>
                  <Chip 
                    label="Explicit" 
                    size="small" 
                    color="default" 
                    className="bg-gray-200"
                  />
                </Box>
              )}
            </Box>
            
            <Divider className="my-4" />
            
            <Box className="mt-2">
              <Typography variant="caption" color="text.secondary">
                <span style={{ fontWeight: "bold" }}>Track URI:</span> {track.uri}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TrackInfo;