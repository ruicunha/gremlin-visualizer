import EventEmitter from 'eventemitter3';

const SERVER_URL = 'http://localhost:3001';
export const QUERY_ENDPOINT = `${SERVER_URL}/query`;
export const CONFIG_ENDPOINT = `${SERVER_URL}/config`;
export const DELETE_ENDPOINT = `${SERVER_URL}/delete`;
export const COMMON_GREMLIN_ERROR = 'Invalid query. Please execute a query to get a set of vertices';
export const DELETE_GREMLIN_ERROR = 'Unable to run delete query.';
export const DARK_THRESHOLD = 50;
export const LIGHT_THRESHOLD = 220;
export const ACTIONS = {
  SET_NAME: 'SET_NAME',
  SET_HOST: 'SET_HOST',
  SET_PORT: 'SET_PORT',
  SET_QUERY: 'SET_QUERY',
  SET_ERROR: 'SET_ERROR',
  SET_NETWORK: 'SET_NETWORK',
  CLEAR_GRAPH: 'CLEAR_GRAPH',
  ADD_NODES: 'ADD_NODES',
  ADD_EDGES: 'ADD_EDGES',
  DELETE_EDGE: 'DELETE_EDGE',
  DELETE_NODE: 'DELETE_NODE',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  SET_SELECTED_EDGE: 'SET_SELECTED_EDGE',
  SET_CONSOLE_MODE: 'SET_CONSOLE_MODE',
  SET_MULTILINE_CONSOLE_MODE: 'SET_MULTILINE_CONSOLE_MODE',
  SET_IS_COLOR_GRADIENT_ENABLED: 'SET_IS_COLOR_GRADIENT_ENABLED',
  SET_IS_PHYSICS_ENABLED: 'SET_IS_PHYSICS_ENABLED',
  SET_IS_PHYSICS_ON_DRAG_ENABLED: 'SET_IS_PHYSICS_ON_DRAG_ENABLED',
  SET_MERGE_EXISTING_NODES: 'SET_MERGE_EXISTING_NODES',
  ADD_QUERY_HISTORY: 'ADD_QUERY_HISTORY',
  CLEAR_QUERY_HISTORY: 'CLEAR_QUERY_HISTORY',
  SET_NODE_LABELS: 'SET_NODE_LABELS',
  ADD_NODE_LABEL: 'ADD_NODE_LABEL',
  EDIT_NODE_LABEL: 'EDIT_NODE_LABEL',
  REMOVE_NODE_LABEL: 'REMOVE_NODE_LABEL',
  REFRESH_NODE_LABELS: 'REFRESH_NODE_LABELS',
  REFRESH_NODE_COLORS: 'REFRESH_NODE_COLORS',
  SET_NODE_LIMIT: 'SET_NODE_LIMIT',
  SET_EDGE_FILTER: 'SET_EDGE_FILTER',
  SET_USER_INPUT_FIELD: 'SET_USER_INPUT_FIELD',
  SET_TOGGLE_DRAWER: 'SET_TOGGLE_DRAWER',
  SET_TOGGLE_CONSOLE: 'SET_TOGGLE_CONSOLE',
  PRINT_TERMINAL: 'PRINT_TERMINAL',
  OPEN_DELETE: 'OPEN_DELETE',
  OPEN_PROPERTIES: 'OPEN_PROPERTIES',
  SET_CASCADE_DELETE: 'SET_CASCADE_DELETE'
};

export const BASE_COLORS_PALETTE = [
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
]

export const BASE_COLORS =
  [
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#3F51B5",
    "#4CAF50",
    "#FFEB3B",
    "#FF9800",
    "#9E9E9E",
    "#795548",
  ]

export const eventEmitter = new EventEmitter();

export const COMMON_GREMLIN_STEPS = [
  'addE',
  'addV',
  'and',
  'as',
  'by',
  'coalesce',
  'constant',
  'count',
  'dedup',
  'drop',
  'E',
  'executionProfile',
  'fold',
  'g',
  'group',
  'has',
  'hasLabel',
  'inject',
  'is',
  'key',
  'label',
  'limit',
  'local',
  'not',
  'optional',
  'or',
  'order',
  'path',
  'project',
  'property',
  'propertyMap',
  'properties',
  'range',
  'repeat',
  'sample',
  'select',
  'store',
  'tree',
  'unfold',
  'union',
  'value',
  'values',
  'valueMap',
  'V',
  'where'
]