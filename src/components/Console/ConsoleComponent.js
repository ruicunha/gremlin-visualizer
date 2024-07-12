import React, {  createRef } from 'react';
import { connect } from 'react-redux';

import { Box, Drawer, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SearchIcon from "@mui/icons-material/Search";
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { ACTIONS, eventEmitter } from '../../constants';
import { FitAddon } from '@xterm/addon-fit';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { SearchAddon } from 'xterm-addon-search';
import SuggestionManager from './SuggestionManager';
import Cursor from './Cursor';

class Console extends React.Component {
  visualizerConsole;
  eventEmitter;
  terminalLimits;
  fitAddon;
  searchAddon;
  buffer = "";
  shellPrompt = "gremlin-console$ ";
  suggestionManager;
  cursor

  history = {
    commands: [],
    currentIndex: 0
  }

  searchResults = {
    resultIndex: 0,
    resultCount: 0
  }

  state = {
    isResizing: false,
    isExpanded: true,
    lastClientY: 0,
    drawerHeight: '50%',
    consoleHeight: '100%',
    searchValue: ""
  }

  constructor(props) {
    super(props);
    this.visualizerConsole = new Terminal({ cursorBlink: true, cursorStyle: "underline", convertEol: true, allowProposedApi: true, scrollback: 50000});
    this.handleMouseMove.bind(this);
    this.eventEmitter = eventEmitter;
    this.fitAddon = new FitAddon();
    this.searchAddon = new SearchAddon();
    this.suggestionManager = new SuggestionManager();
    this.cursor = new Cursor(this.shellPrompt.length);
  }

  componentDidMount() {
    document.addEventListener('mousemove', e => this.handleMouseMove(e));
    document.addEventListener('mouseup', e => this.handleMouseUp(e));
    this.eventEmitter.on('gremlinData', this.handleGremlinData);
    this.eventEmitter.on('gremlinError', this.handleGremlinError);
    this.visualizerConsole.open(this.getTerminalHTML());
    
    const drawerHeight = document.getElementById("drawerPaper").offsetHeight;
    const consoleHeight = this.getTerminalHTML().offsetHeight;
    const minimumHeight = drawerHeight - consoleHeight;

    this.terminalLimits = {
      maxHeight: window.innerHeight,
      minHeight: minimumHeight,
    }

    this.visualizerConsole.loadAddon(this.fitAddon);
    this.visualizerConsole.loadAddon(this.searchAddon);
    
    this.fitAddon.fit();

    let observeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      if(observeTimeout){
        clearTimeout(observeTimeout);
      }
      observeTimeout=setTimeout(()=>{
        if(!this.fitAddon.proposeDimensions()){
          return;
        }
        this.fitAddon.fit();
      }, 10);
    });
    resizeObserver.observe(this.getTerminalHTML());

    this.visualizerConsole.onData((data) => {
      const keyCode = data.charCodeAt(0);
      if (keyCode === 13 && this.buffer.length) {
        this.handleSendCommand();
      } else if (keyCode === 9 && this.suggestionManager.hasSuggestion()) {
        this.autocomplete();
      } else if (keyCode === 127) {
        this.handleWrite();
      } else if (keyCode < 32) {
        return;
      } 
      else {
        this.handleWrite(data);
      }
    })

    this.visualizerConsole.onKey((event)=>{
      if(event.domEvent.code === "ArrowUp") {
        this.handleArrowUp();
      }
      else if (event.domEvent.code === "ArrowDown") {
        this.handleArrowDown();
      }
      else if (event.domEvent.code === "ArrowLeft") {
        this.handleArrowLeft();
      }
      else if (event.domEvent.code === "ArrowRight") {
        this.handleArrowRight();
      }
    })
    this.searchAddon.onDidChangeResults(({resultIndex, resultCount})=>{
      this.searchResults.resultIndex = resultIndex;
      this.searchResults.resultCount = resultCount;
    })

    this.visualizerConsole.write('\x1b[2K\r');
    this.visualizerConsole.write(this.shellPrompt);
  }

  handleArrowUp() {
    if (this.suggestionManager.hasSuggestion()){
      if (this.suggestionManager.isValidUpCycle()) {
        const suggestion = this.suggestionManager.cycleUp(this.buffer);
        this.visualizerConsole.write('\x1b[2K\r');
        this.visualizerConsole.write(`${this.shellPrompt}${this.buffer}${suggestion}`);
        this.visualizerConsole.write(`\x1b[${this.cursor.getEndPosition()}G`)
      }
      return;
    }
    if(this.history.commands.length < 1){
      return;
    }

    if((this.history.currentIndex > 0 && this.buffer.length > 0) || (this.history.currentIndex === this.history.commands.length && this.history.commands.length > 0)) {
      this.history.currentIndex -= 1;
    }
    
    this.buffer =this.history.commands[this.history.currentIndex];
    this.visualizerConsole.write('\x1b[2K\r'); //delete line, carriage feed
    this.visualizerConsole.write(`${this.shellPrompt}${this.buffer}`);
    this.cursor.setPosition(this.buffer.length);
  }

  handleArrowDown() {
    if (this.suggestionManager.hasSuggestion()){
      if (this.suggestionManager.isValidDownCycle()) {
        const suggestion = this.suggestionManager.cycleDown(this.buffer);
        this.visualizerConsole.write('\x1b[2K\r');
        this.visualizerConsole.write(`${this.shellPrompt}${this.buffer}${suggestion}`);
        this.visualizerConsole.write(`\x1b[${this.cursor.getEndPosition()}G`)
      }
    return;
    }
    if(this.history.commands.length < 1){
      return;
    }
    if(this.history.currentIndex < this.history.commands.length && this.buffer.length > 0) {
      this.history.currentIndex += 1;
    }

    this.buffer = this.history.currentIndex < this.history.commands.length ? this.history.commands[this.history.currentIndex] : "";
    this.visualizerConsole.write('\x1b[2K\r');
    this.visualizerConsole.write(`${this.shellPrompt}${this.buffer}`);
    this.cursor.setPosition(this.buffer.length);
  }

  handleArrowLeft() {
    if(this.buffer.length < 1 || !this.cursor.isValidMoveLeft()){
      return;
    }
    this.cursor.moveLeft(this.visualizerConsole);
  }

  handleArrowRight() {
    if(this.buffer.length < 1 || !this.cursor.isValidMoveRight(this.buffer)){
      return;
    }
    this.cursor.moveRight(this.visualizerConsole);
  }

  handleSendCommand() {
    this.buffer === "history" ? this.writeToConsole(this.history.commands) : this.sendQueryData(this.buffer);
   
    let elementIndex;
    const inArray = this.history.commands.some((cmd, idx) => {
      if(cmd === this.buffer){
        elementIndex = idx;
        return true;
      }
      return false;
    })

    if(!inArray){
      this.history.commands.push(this.buffer);
      this.history.currentIndex = this.history.commands.length - 1;
    }
    else{
      const command = this.history.commands.splice(elementIndex, 1)[0];
      this.history.commands.push(command);
    }
    this.buffer = "";
    this.cursor.reset();
    this.suggestionManager.reset();
  }

  handleWrite(data) {
    let suggestion = "";
    if(data){
      this.buffer = this.cursor.getCommand(this.buffer, data);
      this.cursor.inc();
      suggestion = this.suggestionManager.getSuggestion(data, this.buffer);
    }
    else{
      this.buffer = this.cursor.getCommand(this.buffer);
      this.cursor.dec();
      if (this.buffer.length > 0) {
        suggestion = this.suggestionManager.getSuggestion(this.buffer[this.buffer.length - 1], this.buffer);
      }
    }
    this.visualizerConsole.write('\x1b[2K\r');
    this.visualizerConsole.write(`${this.shellPrompt}${this.buffer}${suggestion}`);
    this.visualizerConsole.write(`\x1b[${this.cursor.getEndPosition()}G`); //move cursor to new position
  }

  handleGremlinData = (data) =>{
    if(data.error) {
      this.writeToConsole(data.error);
    }
    else if(data.result){
      this.writeToConsole(data.result);
    } 
    else {
      for (const dataItem of data) {
        this.writeToConsole(dataItem);
      }
    }
  }

  handleGremlinError = (data) => {
    this.writeToConsole(data);
  }

  writeToConsole(data) {
    const result = JSON.stringify(data, null, 2);
    try {
      const highlightedJson = Prism.highlight(result, Prism.languages.json, 'json');
      const highlightedText = highlightedJson.replace(/<span class="token function">/g, '\x1b[34m')
        .replace(/<span class="token punctuation">/g, '\x1b[97m') //bright white
        .replace(/<span class="token string">/g, '\x1b[92m') //bright green
        .replace(/<span class="token keyword">/g, '\x1b[36m') //cyan
        .replace(/<span class="token number">/g, '\x1b[96m') //bright cyan
        .replace(/<span class="token boolean">/g, '\x1b[96m') //bright cyan
        .replace(/<span class="token operator">/g, '\x1b[97m') //bright white
        .replace(/<span class="token property">/g, '\x1b[93m') //bright yellow
        .replace(/<\/span>/g, '\x1b[0m')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      this.visualizerConsole.writeln(`\r\n${highlightedText}`);
    } catch (error) {
      console.error(error);
      this.visualizerConsole.writeln(`\r\n${result}`);
    }
    this.visualizerConsole.write('\x1b[2K\r');
    this.visualizerConsole.write(this.shellPrompt);
  }

  sendQueryData(data){
    eventEmitter.emit("gremlinQueryData", data);
  }

  componentWillUnmount() {
    if (this.visualizerConsole) {
      this.visualizerConsole.clear();
      this.visualizerConsole.dispose();
    }
    if(this.eventEmitter){
      this.eventEmitter.off('gremlinData', this.handleGremlinData);
    }
  }

  getTerminalHTML() {
    return document.getElementById('terminal');
  }
  getTerminalAreaHTML() {
    const terminalHTML = this.getTerminalHTML();
    if (terminalHTML){
      return this.getTerminalHTML().getElementsByClassName("xterm-scroll-area")[0];
    }
  }

  autocomplete() {
    this.buffer = `${this.buffer}${this.suggestionManager.suggestion}`;
    this.cursor.setPosition(this.buffer.length);
    this.visualizerConsole.write('\x1b[2K\r');
    this.visualizerConsole.write(`${this.shellPrompt}${this.buffer}`);
    this.visualizerConsole.write(`\x1b[${this.cursor.getEndPosition()}G`);
    this.suggestionManager.reset();
  }

  handleNextSearch = () => {
    this.searchAddon.findNext(this.state.searchValue, {decorations:{matchBackground: "#008000", matchOverviewRuler: "#8B0000"}});
  }

  handlePrevSearch = () => {
    this.searchAddon.findPrevious(this.state.searchValue, {decorations:{matchBackground: "#008000"}});
  }

  setSearch = (value) => {
    this.setState({searchValue: value})
  }

  handleClear = () => {
    this.visualizerConsole.clear();
    this.searchAddon.clearDecorations();   
  }

  handleMaximize = () => {
    this.setState({drawerHeight: `${this.terminalLimits.maxHeight}px`, consoleHeight: `${this.terminalLimits.maxHeight}px`});
    this.fitAddon.fit();
  }

  handleMinimize= () => {
    this.setState({drawerHeight: `${this.terminalLimits.minimumHeight}px`, consoleHeight: '0px'});
    this.fitAddon.fit();
  }

  toggleDrawer() {
    this.props.dispatch({ type: ACTIONS.SET_TOGGLE_CONSOLE });
  }

  handleMouseUp(event) {
    this.setState({isResizing: false, lastClientY: event.clientY})
  }

  handleMouseDown(event) {
    event.preventDefault();
    this.setState({isResizing: true, lastClientY: event.clientY})
  }


  handleExpand = () => {
    this.setState({isExpanded: !this.state.isExpanded}, (() =>{
      if(this.state.isExpanded){
        this.setState({drawerHeight: `50%`, consoleHeight: `100%`});
      }
      else{
        this.setState({drawerHeight: `${this.terminalLimits.minimumHeight}px`, consoleHeight: '0px'});
      }
      this.fitAddon.fit();
    }))
  }

  handleMouseMove(event) {
    event.preventDefault();
    if (!this.state.isResizing) {
      return;
    }
    const deltaY = this.state.lastClientY - event.clientY;
    this.setState({ lastClientY: event.clientY });

    const drawerElement = document.getElementById("drawerPaper");
    const consoleElement = this.getTerminalHTML();
    //const consoleElement = this.getTerminalAreaHTML();

    let newDrawerHeight = drawerElement.offsetHeight + deltaY;
    newDrawerHeight = Math.max(newDrawerHeight, this.terminalLimits.minHeight); 
    newDrawerHeight = Math.min(newDrawerHeight, this.terminalLimits.maxHeight); 

    let newConsoleHeight = consoleElement.offsetHeight + deltaY
    newConsoleHeight = Math.max(newConsoleHeight, this.terminalLimits.minHeight); 
    newConsoleHeight = Math.min(newConsoleHeight, newDrawerHeight); 
    this.setState({ drawerHeight: `${newDrawerHeight}px`, consoleHeight: `${newConsoleHeight}px`});
    this.fitAddon.fit();
  }

  render() {
    const consoleInteractionComponent = <>
      <Tooltip title="Clear Console">
        <IconButton onClick={this.handleClear} aria-label="clear-console">
          <NotInterestedIcon/>
        </IconButton>
      </Tooltip>
      <Tooltip title="Maximize Console">
        <IconButton onClick={this.handleMaximize} aria-label="max-console">
          <ZoomOutMapIcon/>
        </IconButton>
      </Tooltip>
      <Tooltip title="Minimize Console">
        <IconButton onClick={this.handleMinimize} aria-label="min-console">
          <ZoomInMapIcon/>
        </IconButton>
      </Tooltip>
    </>

    const searchComponent = <div style={{flexGrow: 1}}> 
      <TextField
        id="search-bar"
        className="text"
        label="Search..."
        value={this.state.searchValue} 
        onChange={event => this.setSearch(event.target.value)}
        variant="outlined"
        placeholder="Search..."
        size="small"
        style={{maxWidth: "75%", width:"100%"}}
        InputProps={{
          endAdornment: (
            <IconButton onClick={() => this.setSearch("")}>
              <ClearIcon />
            </IconButton>
          ),
        }}
      />
      <Tooltip title="search string in terminal results">
        <IconButton onClick={this.handleNextSearch} aria-label="search">
          <SearchIcon style={{ fill: "blue" }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="previous result">
        <span style={{ whiteSpace: 'pre-line', maxWidth: 'none' }}>
          <IconButton disabled={this.state.searchValue.length === 0 && this.searchResults.resultCount === 0} onClick={this.handlePrevSearch} aria-label="search-previous">
            <ExpandLessRoundedIcon/>
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="next result">
        <span style={{ whiteSpace: 'pre-line', maxWidth: 'none' }}>
          <IconButton disabled={this.state.searchValue.length === 0 && this.searchResults.resultCount === 0} onClick={this.handleNextSearch} aria-label="search-next">
            <ExpandMoreRoundedIcon/>
          </IconButton>
        </span>
      </Tooltip>
      {this.searchResults.resultCount > 0 ? `${this.searchResults.resultIndex + 1} of ${this.searchResults.resultCount}`: ""}
    </div>

    const toggleConsoleComponent = (
      <Tooltip title={this.state.isExpanded ? "Close console" : "Launch console"}>
        <IconButton onClick={this.handleExpand} aria-label="toggle-console">
          {this.state.isExpanded ? <CloseFullscreenIcon/> : <LaunchIcon/>}
        </IconButton>
      </Tooltip>
    );
  
    return (
      <Drawer
        sx={{
          overflow: "hidden",
          flexShrink: 0,
          height: this.state.drawerHeight,
          '& .MuiDrawer-paper': {
            height: this.state.drawerHeight,
            overflow: "hidden",
          },
        }}
        onClose={(event => this.toggleDrawer())}
        variant="persistent"
        anchor="bottom"
        open={this.props.toggleConsole}
        id='drawer'
        PaperProps={{id: 'drawerPaper'}}
      >
        {this.state.isExpanded && (
          <div
            id="dragger"
            onMouseDown={(event) => {
              this.handleMouseDown(event);
            }}
            style={{
              height: '5px',
              cursor: 'ns-resize',
              padding: '0 100% 0',
              borderTop: '1px solid #ddd',
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: '100',
              backgroundColor: '#f4f7f9',
            }}
          />
        )}
        <div>
          <Box m={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              {searchComponent}
              <div style={{ display: 'flex', gap: '16px' }}>
                {consoleInteractionComponent}
                {toggleConsoleComponent}
              </div>
            </Stack>
          </Box>
        </div> 
        <div className="xterm-visualizer-console" id='terminal' style={{height: this.state.consoleHeight}}/>
      </Drawer>
    );
  }
}

export const ConsoleComponent = connect((state)=>{
  return {
    toggleConsole: state.options.toggleConsole,
  };
})(Console);