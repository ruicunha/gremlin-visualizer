import _ from 'lodash';
import { ACTIONS } from '../constants';

const initialState = {
  nodeLabels: [],
  queryHistory: [],
  isConsoleModeEnabled: false,
  isPhysicsEnabled: true,
  isPhysicsOnDragEnabled: false,
  toggleDrawer: true,
  openDelete: false,
  openProperties: false,
  nodeLimit: 100,
  networkOptions: {
    physics: {
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 95,
        springConstant: 0.04,
        damping: 0.09,
        avoidOverlap: 0
      },
      forceAtlas2Based: {
        gravitationalConstant: -26,
        centralGravity: 0.005,
        springLength: 230,
        springConstant: 0.18,
        avoidOverlap: 1.5
      },
      repulsion: {
        centralGravity: 0.2,
        springLength: 200,
        springConstant: 0.05,
        nodeDistance: 100,
        damping: 0.09
      },
      hierarchicalRepulsion: {
        centralGravity: 0.0,
        springLength: 100,
        springConstant: 0.01,
        nodeDistance: 120,
        damping: 0.09,
        avoidOverlap: 0
      },
      maxVelocity: 40,
      solver: 'forceAtlas2Based',
      timestep: 0.35,
      stabilization: {
        enabled: true,
        iterations: 50,
        updateInterval: 25
      }
    },
    nodes: {
      shape: "dot",
      size: 20,
      borderWidth: 2,
      font: {
        size: 11
      }
    },
    edges: {
      width: 2,
      font: {
        size: 11
      },
      smooth: {
        type: 'dynamic'
      }
    }
  }
};

export const reducer =  (state=initialState, action)=>{
  switch (action.type){

    case ACTIONS.SET_CONSOLE_MODE: {
      const isConsoleModeEnabled = _.get(action, 'payload', true);

      if(isConsoleModeEnabled){
        console.warn("----------------------------------------------------------------------------------")
        console.warn("   Console mode is enabled:\n")
        console.warn("        No limit, mapping, or visualizer projection is applied.")
        console.warn("        You will see the result of the gremlin client submit.")
        console.warn("----------------------------------------------------------------------------------")
      }
      return { ...state, isConsoleModeEnabled };
    }
    case ACTIONS.SET_MULTILINE_CONSOLE_MODE: {
      const multilineInConsoleMode = _.get(action, 'payload', true);

      return { ...state, multilineInConsoleMode };
    }
    case ACTIONS.SET_IS_PHYSICS_ENABLED: {
      const isPhysicsEnabled = _.get(action, 'payload', true);
      return { ...state, isPhysicsEnabled };
    }
    case ACTIONS.SET_IS_PHYSICS_ON_DRAG_ENABLED: {
      const isPhysicsOnDragEnabled = _.get(action, 'payload', true);
      return { ...state, isPhysicsOnDragEnabled };
    }
    case ACTIONS.ADD_QUERY_HISTORY: {
      if(state.queryHistory.indexOf(action.payload)>=0){
        return state;
      }
      return { ...state, queryHistory: [ ...state.queryHistory, action.payload] }
    }
    case ACTIONS.CLEAR_QUERY_HISTORY: {
      return { ...state, queryHistory: [] }
    }
    case ACTIONS.SET_NODE_LABELS: {
      const nodeLabels = _.get(action, 'payload', []);
      return { ...state, nodeLabels };
    }
    case ACTIONS.ADD_NODE_LABEL: {
      const nodeLabels = [...state.nodeLabels, {}];
      return { ...state, nodeLabels };
    }
    case ACTIONS.EDIT_NODE_LABEL: {
      const editIndex = action.payload.id;
      const editedNodeLabel = action.payload.nodeLabel;

      if (state.nodeLabels[editIndex]) {
        const nodeLabels = [...state.nodeLabels.slice(0, editIndex), editedNodeLabel, ...state.nodeLabels.slice(editIndex+1)];
        return { ...state, nodeLabels };
      }
      return state;
    }
    case ACTIONS.REMOVE_NODE_LABEL: {
      const removeIndex = action.payload;
      if (removeIndex < state.nodeLabels.length) {
        const nodeLabels = [...state.nodeLabels.slice(0, removeIndex), ...state.nodeLabels.slice(removeIndex+1)];
        return { ...state, nodeLabels };
      }
      return state;
    }
    case ACTIONS.SET_NODE_LIMIT: {
      const nodeLimit = action.payload;
      return { ...state, nodeLimit };
    }
    case ACTIONS.SET_TOGGLE_DRAWER: {
      return { ...state, toggleDrawer:!state.toggleDrawer };
    }
    case ACTIONS.OPEN_DELETE: {
      return { ...state, openDelete: action.payload};
    }
    case ACTIONS.OPEN_PROPERTIES: {
      return { ...state, openProperties: action.payload};
    }
    case ACTIONS.SET_CASCADE_DELETE: {
      return { ...state, cascadeDelete: action.payload};
    }
    default:
      return state;
  }
};
