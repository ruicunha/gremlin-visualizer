import _ from 'lodash';
import tinycolor from "tinycolor2";
import { LIGHT_THRESHOLD, DARK_THRESHOLD, BASE_COLORS, BASE_COLORS_PALETTE } from '../constants';

const selectRandomField = (obj) => {
  let firstKey;
  for (firstKey in obj) break;
  return firstKey;
};

export const getRemovedData =(nodes,updatedNodes) =>{

  const nodesToRemove=[];
  let edgesToRemove=[];

  nodes.forEach(node=>{
    if(!updatedNodes.find(updatedNode=>node.id===updatedNode.id) ){
      nodesToRemove.push(node);
    }

  });
  edgesToRemove=nodesToRemove.flatMap((node)=>node.edges)

  return {nodesToRemove, edgesToRemove};

}
export const getNodesToRemove =(nodes,filter) =>{

   const nodesToRemove=[];
   let edgesToRemove=[];

   const rootNode=nodes.find((node)=>{ return node.id === filter.id});

   nodesToRemove.push(rootNode);

   if(filter.cascade && rootNode.edges.length>0){
     filterNodes(nodesToRemove, nodes, filter, rootNode.edges)
   }

   edgesToRemove=nodesToRemove.flatMap((node)=>node.edges)

   return {nodesToRemove, edgesToRemove};

}
export const filterNodes =(nodesToRemove,nodes,filter,edges) =>{

  edges.forEach((edge)=>{
      
    let node= getNode(nodesToRemove,nodes,edge.to);

    if(node && filterAppliesToNode(filter,edge)){
      nodesToRemove.push(node);
      filterNodes(nodesToRemove,nodes,filter,node.edges)
    }
  }
  );
}

export const filterAppliesToNode =(filter,edge) =>{

  if(filter.label && !(edge.label===filter.label)){
    return false;
 
  }
  if(filter.field || filter.value){
    return edgeHasField(edge,filter.field, filter.value)
  }
  return true;

}

export const edgeHasField =(edge,field,value)=>{

  if(!edge.properties.hasOwnProperty(field))
    return false;
  if(value)
     return edge.properties[field]===toFieldValue(value);

  return true;
}
export const toFieldValue =(value)=>{
  return value==="true"?true: value==="false"?false:value;
}


export const getNode =(nodesToRemove,nodes,id) =>{

  const removed=nodesToRemove.find((node)=>{return node.id === id});
  if(!removed)
    return nodes.find((node)=>{return node.id===id});

}

export const getDiffNodes = (newList, oldList) => {
  return _.differenceBy(newList, oldList, (node) => node.id);
};

export const getDiffEdges = (newList, oldList) => {
  return _.differenceBy(newList, oldList, (edge) => `${edge.from},${edge.to}`);
};

export const extractEdgesAndNodes = (nodeList, isColorGradientEnabled, userInputField, nodeLabels = []) => {
  let edges = [];
  const nodes = [];

  const nodeLabelMap =_.mapValues( _.keyBy(nodeLabels, 'type'), 'field');

  let baseColorPointer = 0;
  let palettePointer = 0;
  let isDarkSide = false;

  const colorGroupByLabelMap = new Map();
  const colorGroupByCustomGroupMap = new Map();

  _.forEach(nodeList, (node) => {

    const type = node.label;
    let label = determineLabel(nodeLabelMap, type, node, nodeLabels);
    const isCustomColor = isColorGradientEnabled && ( node.properties.kind ||userInputField );

    if(!isCustomColor) {
      nodes.push({ id: node.id, label: String(label),shape:getNodeShape(node), group: node.label, properties: node.properties, type, edges: node.edges });
      edges = edges.concat(_.map(node.edges, edge => ({ ...edge, label: getEdgeLabel(edge), type: edge.label, dashes: isDashed(edge), arrows: { to: { enabled: true, type: node.label === 'NetworkFunction' ? "circle" : "arrow", scaleFactor: 0.5 } } })));
      return;
    }

    const {mainField, groupString} = getGroupInfo(node, userInputField);
    let newNode;

    if (!colorGroupByLabelMap.has(mainField)) {
      mainField === "NetworkFunction" ?
        setColorMaps(colorGroupByLabelMap, colorGroupByCustomGroupMap, groupString, mainField, BASE_COLORS_PALETTE, palettePointer) :
        setColorMaps(colorGroupByLabelMap, colorGroupByCustomGroupMap, groupString, mainField, BASE_COLORS, baseColorPointer);
        
      baseColorPointer++;
      newNode = { id: node.id, label: String(label), shape: getNodeShape(node), group: mainField, properties: node.properties, type, edges: node.edges, color: colorGroupByLabelMap.get(mainField).color }
    }
    else if (!colorGroupByCustomGroupMap.has(groupString)) {

      let { color, level } = colorGroupByLabelMap.get(mainField);
      let shadedColor;
      ({ shadedColor, isDarkSide, level } = shadeColor(isDarkSide, color, level));

      if (mainField === "NetworkFunction" && shadedColor.getBrightness() < DARK_THRESHOLD) {
        isDarkSide = false;
        palettePointer++;
        color = BASE_COLORS_PALETTE[palettePointer];
        level = 1;
        colorGroupByCustomGroupMap.set(groupString, color);
      }
      else {
        colorGroupByCustomGroupMap.set(groupString, shadedColor.toString());
        level++;
      }
      colorGroupByLabelMap.set(mainField, { color, level })
      newNode = { id: node.id, label: String(label), shape: getNodeShape(node), group: mainField, properties: node.properties, type, edges: node.edges, color: colorGroupByCustomGroupMap.get(groupString) }
    }
    else {
      newNode = { id: node.id, label: String(label), shape: getNodeShape(node), group: mainField, properties: node.properties, type, edges: node.edges, color: colorGroupByCustomGroupMap.get(groupString) }
    }
    
    baseColorPointer = recycleColor(baseColorPointer, colorGroupByLabelMap, mainField, BASE_COLORS);
    palettePointer = recycleColor(palettePointer, colorGroupByLabelMap, mainField, BASE_COLORS_PALETTE);

    nodes.push(newNode);
    edges = edges.concat(_.map(node.edges, edge => ({ ...edge, label: getEdgeLabel(edge), type: edge.label, dashes: isDashed(edge), arrows: { to: { enabled: true, type: node.label === 'NetworkFunction' ? "circle" : "arrow", scaleFactor: 0.5 } } })));
  });
  return { edges, nodes, nodeLabels }
};

export const determineLabel = (nodeLabelMap, type, node, nodeLabels) => {
  if (!nodeLabelMap[type]) {
    const field = node.properties.kind && node.properties.name ? 'name' : selectRandomField(node.properties);
    const nodeLabel = { type, field };
    nodeLabels.push(nodeLabel);
    nodeLabelMap[type] = field;
  }
  const labelField = nodeLabelMap[type];

  let label = "";
  if (!labelField.includes(',')) {
    label = labelField in node.properties ? node.properties[labelField] : type;
  } else {
    _.forEach(labelField.split(','), (field) => {
      label += "/" + node.properties[field];
    });
    label = label.substring(1);
  }
  return label;
}


export const getGroupInfo = (node, inputField) => {
  let mainField = node.label;
  let nodeField = node.properties.kind;

  if(inputField){
    const inputArray = inputField.split(",");
    if(inputArray[0].length > 0 && inputArray[0] !== "label") {
      mainField = node.properties[inputArray[0]];
    }

    inputArray.forEach((input) => {
      const nodeProperty = node.properties[input.trim()];
      if(nodeProperty) {
        nodeField = nodeField ? `${nodeField}:${nodeProperty}` : `${nodeProperty}`;
      }
    })
  } 
  return {mainField: mainField, groupString:`${mainField}:${nodeField}`};
}

export const shadeColor = (isDarkSide, color, level, shadeFactor = 7.5) => {
  let shadedColor = isDarkSide ?
    tinycolor(color).darken((level - 1) * shadeFactor) :
    tinycolor(color).lighten((level - 1) * shadeFactor);

  if (shadedColor.getBrightness() > LIGHT_THRESHOLD) {
    isDarkSide = true;
    level = 2;
  }
  return { shadedColor, isDarkSide, level };
}

export const recycleColor = (colorPointer, colorMap, mainField, colors) => {
  if (colorPointer === colors.length) {
    colorPointer = 0;
    colorMap.set(mainField, { color: colors[colorPointer], level: 1 });
  }
  return colorPointer;
}

export const setColorMaps = (colorMap, colorCustomMap, groupString, mainField, colors, pointer) => {
  colorMap.set(mainField, { color: colors[pointer], level: 1 });
  colorCustomMap.set(groupString, colors[pointer]);
}

export const getNodeShape = (node) => {
  switch(node.label) { 
    case 'Pod': { 
     
       return 'diamond'; 
    } 
    case 'K8SNode': case 'Cluster': { 
    
       return 'hexagon'; 
    } 
    case 'DataCenter': case  'NetworkSlice': { 
    
      return 'star'; 
    } 
    case 'Server': case  'VirtualMachine': { 
    
      return 'square'; 
    } 
    default: { 
      return 'dot'; 
    } 
 } 
};
export const getEdgeLabel = (edge) => {
  return edge.properties.field?  edge.label+" : "+ edge.properties.field: edge.label;
};

export const isDashed = (edge) => {
  return edge.properties.field===undefined?false:!edge.properties.ownership;
};

export const findNodeById = (nodeList, id) => {
  return _.find(nodeList, node => node.id === id);
};

export const stringifyObjectValues = (obj) => {
  _.forOwn(obj, (value, key) => {
    if (!_.isString(value)) {
      obj[key] = JSON.stringify(value);
    }
  });
};

export const getTableData = (obj) => {
  const data = [];
  _.forOwn(obj, (value, key) => {
    data.push({property: key, value: typeof value == "boolean"?value.toString():value });
  });
  return data;
};

export const mergeNodeProperties= (node, updatedNode,deletedEdges) => {

  for (const [k, v] of Object.entries(updatedNode.properties)) {
    node.properties[k]=v;
  }
  node.edges.forEach(edge => {
    if(!updatedNode.edges.find((updateEdge)=>edge.id===updateEdge.id)){
      deletedEdges.push(edge.id)
    }
  });
  node.edges=updatedNode.edges;
}

export const mergeNodes= (nodes, updatedNodes, deletedEdges) => {

  updatedNodes.forEach(updatedNode => {
    mergeNodeProperties(nodes.find((node)=>node.id===updatedNode.id),updatedNode ,deletedEdges);
  });

}