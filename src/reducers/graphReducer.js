import vis from 'vis-network';
import _ from 'lodash';
import { ACTIONS } from '../constants';
import { getDiffNodes, getDiffEdges, findNodeById, getNodesToRemove } from '../logics/utils';

const initialState = {
  network: null,
  nodeHolder: new vis.DataSet([]),
  edgeHolder: new vis.DataSet([]),
  nodes: [],
  edges: [],
  selectedNode: {},
  selectedEdge: {},
};

export const reducer =  (state=initialState, action)=>{
  switch (action.type){
    case ACTIONS.CLEAR_GRAPH: {
      state.nodeHolder.clear();
      state.edgeHolder.clear();

      state.network.fit();

      return { ...state, nodes: [], edges: [], selectedNode:{}, selectedEdge: {} };
    }
    case ACTIONS.SET_NETWORK: {
      return { ...state, network: action.payload };
    }
    case ACTIONS.ADD_NODES: {
      const newNodes = getDiffNodes(action.payload, state.nodes);
      const nodes = [...state.nodes, ...newNodes];
      state.nodeHolder.add(newNodes);
      return { ...state, nodes };
    }
    case ACTIONS.ADD_EDGES: {
      const newEdges = getDiffEdges(action.payload, state.edges);
      const edges = [...state.edges, ...newEdges];
      state.edgeHolder.add(newEdges);
      return { ...state, edges };
    }
    case ACTIONS.DELETE_EDGE: {
      const newEdges = state.edges.filter((edge)=>{return edge.id!== action.payload.id})
      const edges = [ ...newEdges];
      state.edgeHolder.remove(action.payload.id);
      return { ...state, edges };
    }
    case ACTIONS.DELETE_NODE: {

      const {nodesToRemove, edgesToRemove}= getNodesToRemove(state.nodes,action.payload);
   
      const removedNodeIds= [];
      const removedEdgeIds= [];

      nodesToRemove.forEach((node)=>{
        state.nodeHolder.remove(node.id);
        removedNodeIds.push(node.id)
      });
      edgesToRemove.forEach((edge)=>{
        state.edgeHolder.remove(edge.id);
        removedEdgeIds.push(edge.id)
      });
      

      const newNodes = state.nodes.filter((node)=>{return !removedNodeIds.indexOf(node.id)>=0})
      const newEdges = state.edges.filter((edge)=>{return !removedEdgeIds.indexOf(edge.id)>=0})


      const edges = [ ...newEdges];
      const nodes = [ ...newNodes];

      return { ...state, edges, nodes };
    }
    case ACTIONS.SET_SELECTED_NODE: {
      const nodeId = action.payload;
      let selectedNode = {};
      if (nodeId !== null) {
        selectedNode = findNodeById(state.nodes, nodeId);
      }
      return { ...state, selectedNode, selectedEdge: {} };
    }
    case ACTIONS.SET_SELECTED_EDGE: {
      const edgeId = action.payload;
      let selectedEdge = {};
      if (edgeId !== null) {
        selectedEdge = findNodeById(state.edges, edgeId);
      }
      return { ...state, selectedEdge, selectedNode: {} };
    }
    case ACTIONS.REFRESH_NODE_LABELS: {
      const nodeLabelMap =_.mapValues( _.keyBy(action.payload, 'type'), 'field');
      _.map(state.nodes, node => {
        if (node.type in nodeLabelMap) {
          const field = nodeLabelMap[node.type];
          let label="";
          if(!field.includes(',')){
            label = field in node.properties ? node.properties[field] : node.type;
          }else {
            _.forEach(field.split(','), (field) => {
              label+="/"+node.properties[field];
            })
            label=label.substring(1);
          }
          state.nodeHolder.update({id:node.id, label: label});
          return {...node, label };
        }
        return node;
      });
      return state;
    }
    default:
      return state;
  }
};
