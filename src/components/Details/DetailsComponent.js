import React from 'react';
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
import _ from 'lodash';
import { ACTIONS, COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from '../../constants';
import axios from "axios";
import { onFetchQuery} from '../../logics/actionHelper';
import { getTableData } from '../../logics/utils';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import { tableCellClasses } from '@mui/material/TableCell';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 500;
class Details extends React.Component {

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
    const query = `g.V('${nodeId}').${direction}()`;
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

  toggleDrawer() {
    this.props.dispatch({ type: ACTIONS.SET_TOGGLE_DRAWER });
  }

  generateList(list) {
    let key = 0;
    return list.map(value => {
      key = key+1;
      return React.cloneElement((
        <ListItem>
          <ListItemText
            primary={value}
          />
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

  render(){
    let hasSelected = false;
    let selectedType = null;
    let selectedId = null ;
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
      <TableContainer component={Paper} sx={{ width:'490px' }}>
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
                <List dense={true}>
                  {this.generateList(this.props.queryHistory)}
                </List>
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
          <Grid item xs={12} sm={12} md={12} container justifyContent="center">
            <Grid item xs={12} sm={12} md={12}>
              <Grid container justifyContent="center">
                <Table aria-label="simple table">
                  <TableBody>
                    <TableRow key={'type'}>
                      <TableCell scope="row"><h4>{selectedHeader}</h4></TableCell>
                      <TableCell align="left">{String(selectedType)}</TableCell>
                      {selectedHeader === 'Node' &&
                          <TableCell align="left">
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
                          </TableCell>
                        }
                    </TableRow>
                    <TableRow key={'id'}>
                      <TableCell scope="row">ID</TableCell>
                      <TableCell align="left">{String(selectedId)}</TableCell>
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
    toggleDrawer: state.options.toggleDrawer
  };
})(Details);