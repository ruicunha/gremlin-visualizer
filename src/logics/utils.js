import _ from 'lodash';

const selectRandomField = (obj) => {
  let firstKey;
  for (firstKey in obj) break;
  return firstKey;
};

export const getDiffNodes = (newList, oldList) => {
  return _.differenceBy(newList, oldList, (node) => node.id);
};

export const getDiffEdges = (newList, oldList) => {
  return _.differenceBy(newList, oldList, (edge) => `${edge.from},${edge.to}`);
};

export const extractEdgesAndNodes = (nodeList, nodeLabels=[]) => {
  let edges = [];
  const nodes = [];

  const nodeLabelMap =_.mapValues( _.keyBy(nodeLabels, 'type'), 'field');
  console.log(nodeLabelMap);
  
  _.forEach(nodeList, (node) => {

    console.log(node);
    console.log(node.label)

    const type = node.label;
    if (!nodeLabelMap[type]) {
      const field = node.properties.kind && node.properties.name? 'name':selectRandomField(node.properties);
      const nodeLabel = { type, field };
      console.log(nodeLabel);
      nodeLabels.push(nodeLabel);
      nodeLabelMap[type] = field;
    }
    const labelField = nodeLabelMap[type];

    let label="";
    if(!labelField.includes(',')){
      label = labelField in node.properties ? node.properties[labelField] : type;
    }else {
      _.forEach(labelField.split(','), (field) => {
        label+="/"+node.properties[field];
      })
      label=label.substring(1);
    }

    nodes.push({ id: node.id, label: String(label),shape:getNodeShape(node), group: node.label, properties: node.properties, type });

    edges = edges.concat(_.map(node.edges, edge => ({ ...edge, label:getEdgeLabel(edge), type: edge.label, dashes:isDashed(edge), arrows: { to: { enabled: true, type:node.label==='NetworkFunction'?"circle":"arrow", scaleFactor: 0.5 } }})));

  });

  return { edges, nodes, nodeLabels }
};

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
    data.push({property: key, value: value});
  });
  return data;
};
