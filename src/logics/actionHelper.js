import { extractEdgesAndNodes } from './utils';
import { ACTIONS } from '../constants';

export const onFetchQuery = (result, query, oldNodeLabels, dispatch, isColorGradientEnabled, userInputField) => {
  const { nodes, edges, nodeLabels } = extractEdgesAndNodes(result.data, oldNodeLabels, isColorGradientEnabled, userInputField);
  dispatch({ type: ACTIONS.ADD_NODES, payload: nodes , deleteUnexistingNodes: query==='g.V()'});
  dispatch({ type: ACTIONS.ADD_EDGES, payload: edges });
  dispatch({ type: ACTIONS.SET_NODE_LABELS, payload: nodeLabels });
  dispatch({ type: ACTIONS.ADD_QUERY_HISTORY, payload: query });
};