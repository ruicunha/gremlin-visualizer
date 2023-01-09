import React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { NetworkGraphComponent } from './components/NetworkGraph/NetworkGraphComponent';
import { HeaderComponent } from './components/Header/HeaderComponent';
import { DetailsComponent } from './components/Details/DetailsComponent';


export class App extends React.Component{
  render(){
    return (
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <HeaderComponent />
          <NetworkGraphComponent />
          <DetailsComponent />
        </Box>
      );
  }
}
