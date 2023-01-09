import React from 'react';
import { connect } from 'react-redux';
import { Button, TextField }  from '@mui/material';
import axios from 'axios';
import { ACTIONS, QUERY_ENDPOINT, COMMON_GREMLIN_ERROR } from '../../constants';
import { onFetchQuery } from '../../logics/actionHelper';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

class Header extends React.Component {
  clearGraph() {
    this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
    this.props.dispatch({ type: ACTIONS.CLEAR_QUERY_HISTORY });
  }

  sendQuery() {
    this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    axios.post(
      QUERY_ENDPOINT,
      { host: this.props.host, port: this.props.port, query: this.props.query, nodeLimit: this.props.nodeLimit },
      { headers: { 'Content-Type': 'application/json' } }
    ).then((response) => {
      onFetchQuery(response, this.props.query, this.props.nodeLabels, this.props.dispatch);
    }).catch((error) => {
      this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: COMMON_GREMLIN_ERROR });
    });
  }

  onHostChanged(host) {
    this.props.dispatch({ type: ACTIONS.SET_HOST, payload: host });
  }

  onPortChanged(port) {
    this.props.dispatch({ type: ACTIONS.SET_PORT, payload: port });
  }

  onQueryChanged(query) {
    this.props.dispatch({ type: ACTIONS.SET_QUERY, payload: query });
  }

  toggleDrawer() {
    this.props.dispatch({ type: ACTIONS.SET_TOGGLE_DRAWER });
  }

  render(){
    return (

      <AppBar position="fixed" open={this.props.toggleDrawer} >
      <Toolbar sx={{ flexGrow: 1, alignContent: 'center', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, alignContent: 'center', alignItems: 'center' }}>
          <form noValidate autoComplete="off" style={{padding:'10px', alignContent: 'center', alignItems: 'center'}}>
            <TextField variant="filled" value={this.props.host} onChange={(event => this.onHostChanged(event.target.value))} id="standard-basic" label="host" size='small' color='primary' style={{width:'280px', marginRight: '10px', backgroundColor: 'white'}}  />
            <TextField variant="filled" value={this.props.port} onChange={(event => this.onPortChanged(event.target.value))} id="standard-basic" label="port" size='small' color='primary' style={{width:'80px', marginRight: '10px', backgroundColor: 'white'}} />
            <TextField variant="filled" value={this.props.query} onChange={(event => this.onQueryChanged(event.target.value))} id="standard-basic" label="gremlin query" size='small' color='primary'  style={{width:'680px', marginRight: '10px', backgroundColor: 'white'}} />

              <Button variant="contained" color="primary" onClick={this.sendQuery.bind(this)} style={{width: '150px', marginRight: '20px', marginTop: '5px'}} >Execute</Button>
              <Button variant="contained" color="primary" onClick={this.clearGraph.bind(this)} style={{width: '150px', marginTop: '5px'}} >Clear Graph</Button>

          </form>
          <div style={{color: 'white'}}>{this.props.error}</div>
          </Box>
            <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={(event => this.toggleDrawer())}
                  
              >
                  <MenuIcon />
              </IconButton>

      </Toolbar>
    </AppBar>
    );
  }
}

export const HeaderComponent = connect((state)=>{
  return {
    host: state.gremlin.host,
    port: state.gremlin.port,
    query: state.gremlin.query,
    error: state.gremlin.error,
    nodes: state.graph.nodes,
    edges: state.graph.edges,
    nodeLabels: state.options.nodeLabels,
    nodeLimit: state.options.nodeLimit,
    toggleDrawer: state.options.toggleDrawer
  };
})(Header);