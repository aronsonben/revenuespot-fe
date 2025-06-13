import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const LogoImg = styled('img')({
  height: 32,
  width: 32,
  marginRight: 12,
  verticalAlign: 'middle',
});

export default function NavBar() {
  return (
    <AppBar position="static" elevation={1} sx={{ background: "hsl(40, 30%, 96%)", mb: 2 }}>
      <Toolbar sx={{ minHeight: 48, px: 2 }}>
        <LogoImg src="/spotify.png" alt="Logo" />
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'hsl(20,10%,12%)' }}>
          RevenueSpot
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
