import React, {  createRef } from 'react';

import { connect } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  TextField,
  Fab,
  IconButton,
  Grid,
  Table,
  TableContainer,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  FormControlLabel,
  Switch,
  Paper,
  Divider,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import _ from 'lodash';
import { ACTIONS, COMMON_GREMLIN_ERROR, DELETE_GREMLIN_ERROR, QUERY_ENDPOINT , DELETE_ENDPOINT} from '../../constants';
import axios from "axios";
import { onFetchQuery} from '../../logics/actionHelper';
import { getTableData } from '../../logics/utils';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import { tableCellClasses } from '@mui/material/TableCell';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'


const drawerWidth = 550;

let selectedId = null ;

let deleteLabel=undefined;
let deleteField=undefined;
let deleteValue=undefined;
class Details extends React.Component {

  constructor(props) {
    super(props);
    this.deleteCascadeRef = createRef();
    this.deleteLabelRef = createRef();
    this.deleteFieldRef = createRef();
    this.deleteValueRef = createRef();
   
    window.document.addEventListener('keydown', (e) => {

      if (e.key === 'Delete' && e.target.className  ==="vis-network") {
   
        this.openDeleteDialog();
      }

      if (e.ctrlKey && e.key === 'c' && e.target.className  ==="vis-network") {
   
        navigator.clipboard.writeText(selectedId)
      }
      
      if (e.key === 'Enter' && e.target.className  ==="vis-network") {
   
        this.clearAndSelectWithInOutRelations(selectedId);
      }
      if (e.key === 'ArrowRight' && e.target.className  ==="vis-network") {
   
        this.onTraverse(selectedId, 'out')
      }
      if (e.key === 'ArrowLeft' && e.target.className  ==="vis-network") {
   
        this.onTraverse(selectedId, 'in')
      }
      if (e.key === '+' && e.target.className  ==="vis-network") {
   
        this.onTraverse(selectedId, 'out')
        this.onTraverse(selectedId, 'in')
      }

      
    });

    


    window.document.body.addEventListener("mousedown", e => {
 
      if (e.button === 2 && 
        e.target.parentElement?.className  ==="vis-network" && 
        !this.props.toggleDrawer  && 
        (this.props.network.getSelectedNodes().length>0 || this.props.network.getSelectedEdges().length>0)
        ) { 
        e.preventDefault();
        e.stopPropagation();
        this.openPropertiesDialog();
       
      }
    });

    window.document.body.addEventListener("contextmenu", e => {
      if(this.props.openProperties){
         e.preventDefault();
         return false;
      }
      
    });

  }

  onAddNodeLabel() {
    this.props.dispatch({ type: ACTIONS.ADD_NODE_LABEL });
  }

  onEditNodeLabel(index, nodeLabel) {
    this.props.dispatch({ type: ACTIONS.EDIT_NODE_LABEL, payload: { id: index, nodeLabel } });
  }

  onRemoveNodeLabel(index) {
    this.props.dispatch({ type: ACTIONS.REMOVE_NODE_LABEL, payload: index });
  }

  onEditNodeLimit(limit) {
    this.props.dispatch({ type: ACTIONS.SET_NODE_LIMIT, payload: limit });
  }

  onRefresh() {
    this.props.dispatch({ type: ACTIONS.REFRESH_NODE_LABELS, payload: this.props.nodeLabels });
  }

  onTraverse(nodeId, direction) {
    this.executeQuery(`g.V('${nodeId}').${direction}()`);
  }

  executeQuery(query){

    axios.post(
      QUERY_ENDPOINT,
      { name: this.props.name, host: this.props.host, port: this.props.port, query: query, nodeLimit: this.props.nodeLimit },
      { headers: { 'Content-Type': 'application/json' } }
    ).then((response) => {
      onFetchQuery(response, query, this.props.nodeLabels, this.props.dispatch);
    }).catch((error) => {
      this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: COMMON_GREMLIN_ERROR });
    });
  }

  onToggleConsoleMode(enabled){
    this.props.dispatch({ type: ACTIONS.SET_CONSOLE_MODE, payload: enabled });
  }

  onToggleMultilineConsoleMode(enabled){
    this.props.dispatch({ type: ACTIONS.SET_MULTILINE_CONSOLE_MODE, payload: enabled });
  }


  onTogglePhysics(enabled){
    this.props.dispatch({ type: ACTIONS.SET_IS_PHYSICS_ENABLED, payload: enabled });
    if (this.props.network) {
      const edges = {
        smooth: {
          type: enabled ? 'dynamic' : 'continuous'
        }
      };
      this.props.network.setOptions( { physics: enabled, edges } );
    }
  }
  onTogglePhysicsOnDrag(enabled){
    this.props.dispatch({ type: ACTIONS.SET_IS_PHYSICS_ON_DRAG_ENABLED, payload: enabled });
    if (this.props.network) {
      this.props.network.options['physicsOnDrag']=enabled;
    }
  }
  onToggleMergeExistingNodes(enabled){
    this.props.dispatch({ type: ACTIONS.SET_MERGE_EXISTING_NODES, payload: enabled });
    if (this.props.network) {
      this.props.network.options['mergeExistingNodes']=enabled;
    }
  }

  toggleDrawer() {
    this.props.dispatch({ type: ACTIONS.SET_TOGGLE_DRAWER });
  }

  generateList(list) {
    let key = 0;
    return [...list].reverse().map(value => {
      key = key+1;
      return React.cloneElement((
        <ListItem style={{paddingLeft: '0px',paddingRight: '0px'}}>
          <ListItemText
            primary={value}
          />
          <Fab variant="circular" size="small" align="right" color="primary" onClick={() =>  navigator.clipboard.writeText(value)}>
              <Tooltip title="Copy query to clipboard">
                <ContentCopyRoundedIcon/>
              </Tooltip>
            </Fab>        
            <Fab variant="circular" size="small" style={{marginLeft: '15px'}}  align="right" color="primary" onClick={() =>  this.executeQuery(value)}>
              <Tooltip title="Execute query">
                <PlayCircleOutlineRoundedIcon/>
              </Tooltip>
            </Fab>      
        </ListItem>
      ), {
        key
      })
    });
  }

  generateNodeLabelList(nodeLabels) {
    let index = -1;
    return nodeLabels.map( nodeLabel => {
      index = index+1;
      nodeLabel.index = index;
      return React.cloneElement((
        <ListItem>
          <TextField id="standard-basic" label="Node Type" size='small' InputLabelProps={{ shrink: true }} value={nodeLabel.type} onChange={event => {
            const type = event.target.value;
            const field = nodeLabel.field;
            this.onEditNodeLabel(nodeLabel.index, { type, field })
          }}
          />
          <TextField id="standard-basic" label="Label Field" size='small' InputLabelProps={{ shrink: true }} value={nodeLabel.field} onChange={event => {
            const field = event.target.value;
            const type = nodeLabel.type;
            this.onEditNodeLabel(nodeLabel.index, { type, field })
          }}/>
          <IconButton aria-label="delete" size="small" onClick={() => this.onRemoveNodeLabel(nodeLabel.index)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItem>
      ), {
        key: index
      })
    });
  }
  openDeleteDialog(){

    this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    this.props.dispatch({ type: ACTIONS.OPEN_DELETE, payload: true  });

  }

  openPropertiesDialog(){

    this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    this.props.dispatch({ type: ACTIONS.OPEN_PROPERTIES, payload: true  });

  }

  
  closePropertiesDialog(){

    this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    this.props.dispatch({ type: ACTIONS.OPEN_PROPERTIES, payload: false  });

  }
  closeDeleteDialog(){
  
    this.updateDeleteOptions();
    this.props.dispatch({ type: ACTIONS.OPEN_DELETE, payload: false  });

  }
  deleteSelected(id,selectedType){

     this.updateDeleteOptions();

     axios.post(
      DELETE_ENDPOINT,
       { name: this.props.name, 
         host: this.props.host, 
         port: this.props.port, 
         id: id, 
         selectedType: selectedType, 
         cascade:  this.props.cascadeDelete, 
         label: deleteLabel, 
         field: deleteField, 
         value: deleteValue
        },
       { headers: { 'Content-Type': 'application/json' } }
     ).then((response) => {

       if(selectedType==='Edge'){
        this.props.dispatch({ type: ACTIONS.DELETE_EDGE, payload: { id: id } });
       }else{
        this.props.dispatch({ type: ACTIONS.DELETE_NODE, payload: {          
          id: id, 
          selectedType: selectedType, 
          cascade: this.props.cascadeDelete, 
          label: deleteLabel, 
          field: deleteField, 
          value: deleteValue  } });
       }

     }).catch((error) => {

        this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: DELETE_GREMLIN_ERROR });
      
     });

     this.closeDeleteDialog();
  }

  updateDeleteOptions() {


    deleteLabel = this.deleteLabelRef.current?.value;
    deleteField = this.deleteFieldRef.current?.value;
    deleteValue = this.deleteValueRef.current?.value;
  }

  clearAndSelectWithInOutRelations(selectedId){
    
    this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });

    this.executeQuery(`g.V('${selectedId}')`);
    this.onTraverse(selectedId, "out");
    this.onTraverse(selectedId, "in");


  }
  enableDeleteFilter(){
  
    this.props.dispatch({ type: ACTIONS.SET_CASCADE_DELETE, payload:  this.deleteCascadeRef.current?.checked  });
  }

  render(){
  
    let hasSelected = false;
    let selectedType = null;
  
    let selectedProperties = null;
    let selectedHeader = null;



    if (!_.isEmpty(this.props.selectedNode)) {
      hasSelected = true;
      selectedType =  _.get(this.props.selectedNode, 'type');
      selectedId = _.get(this.props.selectedNode, 'id');
      selectedProperties = getTableData(_.get(this.props.selectedNode, 'properties'));
      //stringifyObjectValues(selectedProperties);
      selectedHeader = 'Node';
    } else if (!_.isEmpty(this.props.selectedEdge)) {
      hasSelected = true;
      selectedType =  _.get(this.props.selectedEdge, 'type');
      selectedId = _.get(this.props.selectedEdge, 'id');
      selectedProperties = getTableData(_.get(this.props.selectedEdge, 'properties'));
      selectedHeader = 'Edge';
      //stringifyObjectValues(selectedProperties);
    }

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
      [`&.${tableCellClasses.head}`]: {
        backgroundColor: '#1976d2',
        color: theme.palette.common.white,
      },
      [`&.${tableCellClasses.body}`]: {

      },
    }));
    
    const StyledTableRow = styled(TableRow)(({ theme }) => ({
      '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
      },
      // hide last border
      '&:last-child td, &:last-child th': {
        border: 0,
        size: 'small'
      },
    }));

    const tableData = hasSelected?(
      <TableContainer component={Paper} sx={{ width:'540px' }}>
        <Table  aria-label="simple table" size='small'>
          <TableHead>
            <TableRow>
              <StyledTableCell>Property</StyledTableCell>
              <StyledTableCell>Value</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedProperties.map((row) => (
              <StyledTableRow
                key={row.property}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <StyledTableCell component="th" scope="row" >
                  {row.property}
                </StyledTableCell>
                <StyledTableCell >{row.value}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ):undefined;

    const content = (
      <div className={'details'}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>Query History</Typography>
              </AccordionSummary>
              <AccordionDetails>
              <Paper style={{maxHeight: 220, overflow: 'auto', padding:0, boxShadow:'none' }}>
                <List dense={true}>
                  {this.generateList(this.props.queryHistory)}
                </List>
                </Paper>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                 <Grid item xs={12} sm={12} md={12}>
                    <Tooltip title="Use browser inspect console to see output" aria-label="add">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={this.props.isConsoleModeEnabled}
                          onChange={() => { this.onToggleConsoleMode(!this.props.isConsoleModeEnabled); }}
                          value="node physics"
                          color="primary"
                        />
                      }
                      label="Change to console mode"
                    />
                    </Tooltip>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Tooltip title="Multiple queries at once (execute button is required)" aria-label="add">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={this.props.multilineInConsoleMode}
                          onChange={() => { this.onToggleMultilineConsoleMode(!this.props.multilineInConsoleMode); }}
                          value="query multiline"
                          color="primary"
                        />
                      }
                      label="Allow multiline on console mode"
                    />
                    </Tooltip>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Tooltip title="Automatically stabilize the graph" aria-label="add">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={this.props.isPhysicsEnabled}
                          onChange={() => { this.onTogglePhysics(!this.props.isPhysicsEnabled); }}
                          value="physics"
                          color="primary"
                        />
                      }
                      label="Enable Physics"
                    />
                    </Tooltip>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Tooltip title="Disable Node Physics on drag" aria-label="add">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={this.props.isPhysicsOnDragEnabled}
                          onChange={() => { this.onTogglePhysicsOnDrag(!this.props.isPhysicsOnDragEnabled); }}
                          value="node physics"
                          color="primary"
                        />
                      }
                      label="On Drag Disable Node Physics"
                    />
                    </Tooltip>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Tooltip title="Eanble merge of existing nodes" aria-label="add">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={this.props.mergeExistingNodes}
                          onChange={() => { this.onToggleMergeExistingNodes(!this.props.mergeExistingNodes); }}
                          value="node physics"
                          color="primary"
                        />
                      }
                      label="Merge of existing nodes"
                    />
                    </Tooltip>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Tooltip title="Number of maximum nodes which should return from the query. Empty or 0 has no restrictions." aria-label="add">
                      <TextField label="Node Limit" type="Number" variant="outlined" size='small' value={this.props.nodeLimit} onChange={event => {
                        const limit = event.target.value;
                        this.onEditNodeLimit(limit)
                      }} />
                    </Tooltip>

                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Typography>Node Labels</Typography>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <List dense={true}>
                      {this.generateNodeLabelList(this.props.nodeLabels)}
                    </List>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12}>
                    <Grid item xs={12} sm={12} md={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={6} md={6} container justifyContent="center">
                          <Fab variant="circular" color="primary" size="small" onClick={this.onRefresh.bind(this)}>
                            <RefreshIcon/>
                          </Fab>
                        </Grid>
                        <Grid item xs={6} sm={6} md={6} container justifyContent="center">
                          <Fab variant="circular" size="small" onClick={this.onAddNodeLabel.bind(this)}>
                            <AddIcon />
                          </Fab>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
          {hasSelected &&
          <Grid item xs={10} sm={12} md={12} container justifyContent="center">
            <Grid item xs={10} sm={12} md={12}>
              <Grid container justifyContent="center">
                <Table aria-label="simple table">
                  <TableBody>
                    <TableRow key={'type'}>
                      <TableCell scope="row"><h4>{selectedHeader}</h4></TableCell>
                      <TableCell align="left" >{String(selectedType)}</TableCell>
                      {selectedHeader === 'Node' &&
                          <TableCell align="right" colSpan={2}>
                            <Fab variant="circular" size="small" color="primary" onClick={() => this.onTraverse(selectedId, 'in')}>
                              <Tooltip title="Transverse In">
                                <ArrowBackIcon/>
                              </Tooltip>
                            </Fab>
                            <Fab variant="circular" size="small" color="primary" onClick={() => this.onTraverse(selectedId, 'out')}>
                              <Tooltip title="Transverse Out">
                                <ArrowForwardIcon/>
                              </Tooltip>
                            </Fab>
                            <Fab variant="circular" size="small" color="primary"  style={{marginLeft: '15px'}} onClick={() => this.openDeleteDialog()}>
                              <Tooltip title="Remove">
                                <RemoveRoundedIcon/>
                              </Tooltip>
                            </Fab>                            
                          </TableCell>
                        }
                        {selectedHeader === 'Edge' &&
                          <TableCell align="right" colSpan={2}>
                            <Fab variant="circular" size="small" color="primary" onClick={() => this.openDeleteDialog()}>
                              <Tooltip title="Remove">
                                <RemoveRoundedIcon/>
                              </Tooltip>
                            </Fab>                            
                          </TableCell>
                        }
                       <Dialog open={this.props.openDelete} fullWidth={true} maxWidth={"sm"}>
                           <DialogTitle>Delete {selectedHeader}</DialogTitle>
                           <DialogContent dividers>Are you sure you want to delete?
                           {selectedHeader === 'Node' &&
                           <FormGroup style={{padding:'10px'}}>

                                <FormControlLabel control={<Checkbox defaultChecked={this.props.cascadeDelete}  onChange={() => this.enableDeleteFilter() } />}    label="Cascade delete on out." inputRef={this.deleteCascadeRef} />
                                <FormLabel id="demo-radio-buttons-group-label">On label:</FormLabel>
                                <TextField style={{margin:'10px'}} disabled={!this.props.cascadeDelete} id="outlined-helperText" defaultValue={deleteLabel}  label="has label"  inputRef={this.deleteLabelRef}/>
                                <FormLabel id="demo-radio-buttons-group-label">On property:</FormLabel>
                                <TextField style={{margin:'10px'}} disabled={!this.props.cascadeDelete}  id="outlined-helperText"  defaultValue={deleteField}  label="contains field"  inputRef={this.deleteFieldRef}/>
                                <TextField style={{margin:'10px'}} disabled={!this.props.cascadeDelete} id="outlined-helperText"  defaultValue={deleteValue}  label="with value"  inputRef={this.deleteValueRef}/>

                           </FormGroup>
                           }
                           </DialogContent>
                           <DialogActions>
                              <Button autoFocus onClick={() => this.closeDeleteDialog()}>
                              Cancel
                              </Button>
                              <Button onClick={() => this.deleteSelected(selectedId,selectedHeader)}>Ok</Button>
                          </DialogActions>
                      </Dialog>
                      <Dialog id="propertiesDialog" open={this.props.openProperties} fullWidth={true} maxWidth={"sm"} onClose={() =>  this.closePropertiesDialog()}>
                      <DialogContent style={{marginLeft: '6px'}}>
                       {tableData}
                      </DialogContent>
                      </Dialog>
                    </TableRow>
                    <TableRow key={'id'}>
                      <TableCell scope="row">ID</TableCell>
                      <TableCell align="left" colSpan={2}>{String(selectedId)}</TableCell>
                      <TableCell scope="row" align="right" >

                           <Fab variant="circular" size="small" color="primary" onClick={() =>  navigator.clipboard.writeText(selectedId)}>
                              <Tooltip title="Copy ID to clipboard">
                                <ContentCopyRoundedIcon/>
                              </Tooltip>
                            </Fab>      
                            {selectedHeader === 'Node' &&
                            <Fab variant="circular" size="small" color="primary" style={{marginLeft: '15px'}} onClick={() =>  this.clearAndSelectWithInOutRelations(selectedId)}>
                              <Tooltip title="Clear and query with In Out relations">
                                <AutoFixHighRoundedIcon/>
                              </Tooltip>
                            </Fab>      
                           }
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {tableData}
              </Grid>
            </Grid>
          </Grid>
          }
        </Grid>
      </div>
    );


    return (
            <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
              },
            }}
            onClose={(event => this.toggleDrawer())}
            variant="persistent"
            anchor="right"
            open={this.props.toggleDrawer}
          >    
          <Toolbar>
          <IconButton onClick={(event => this.toggleDrawer())}>
            <ChevronRightIcon />
          </IconButton>
            </Toolbar>
          {content}
          </Drawer>
    );
  }
}

export const DetailsComponent = connect((state)=>{
  return {
    name: state.gremlin.name,
    host: state.gremlin.host,
    port: state.gremlin.port,
    network: state.graph.network,
    selectedNode: state.graph.selectedNode,
    selectedEdge: state.graph.selectedEdge,
    queryHistory: state.options.queryHistory,
    nodeLabels: state.options.nodeLabels,
    nodeLimit: state.options.nodeLimit,
    isPhysicsEnabled: state.options.isPhysicsEnabled,
    isPhysicsOnDragEnabled: state.options.isPhysicsOnDragEnabled,
    mergeExistingNodes: state.options.mergeExistingNodes,
    isConsoleModeEnabled: state.options.isConsoleModeEnabled,
    multilineInConsoleMode: state.options.multilineInConsoleMode,
    toggleDrawer: state.options.toggleDrawer,
    openDelete: state.options.openDelete,
    openProperties: state.options.openProperties,
    cascadeDelete: state.options.cascadeDelete
  };
})(Details);