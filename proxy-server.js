require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const gremlin = require('gremlin');
const cors = require('cors');
const app = express();
const port = 3001;


const DATABASE = process.env.DATABASE;
const COLLECTION = process.env.COLLECTION;
const COSMOSDB_KEY = process.env.COSMOSDB_KEY;

app.use(cors({
  credentials: true,
}));

// parse application/json
app.use(bodyParser.json());

function mapToObj(inputMap) {
  let obj = {};

  inputMap.forEach((value, key) => {
   
    obj[key] = value;
  });

  return obj;
}

function edgesToJson(edgeList) {
  return edgeList.map(
    edge => ({
      id: typeof edge.get('id') !== "string" ? JSON.stringify(edge.get('id')) : edge.get('id'),
      from: edge.get('from'),
      to: edge.get('to'),
      label: edge.get('label'),
      properties: mapToObj(edge.get('properties')),
    })
  );
}

function nodesToJson(nodeList) {
  return nodeList.map(
    node => ({
      id: node.get('id'),
      label: node.get('label'),
      properties: mapToObj(node.get('properties')),
      edges: edgesToJson(node.get('edges'))
    })
  );
}

function convertEdges(edgeList) {

  return edgeList.map(
    edge => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label,
      properties: convertProperties(edge.properties),
    })
  );
}

function convertNodes(nodeList) {
  return nodeList
  .map(
    node => ({
      id: node.id,
      label: node.label,
      properties:convertProperties(node.properties),
      edges:convertEdges(node.edges)
    })
  );
}

function convertProperties(p){

  let properties = {};

  Object.entries(p).forEach( entry => {
    const[ key, value ] = entry;

    if(Array.isArray(value)){

      if(value.length>1){
        properties[key]= value; 
      }else{
        properties[key]= value[0]; 
      }

    }else {
      properties[key]= value;
    }
  
  });

  return properties;
}


function makeQuery(query, nodeLimit) {
  const nodeLimitQuery = !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${nodeLimit})`: '';
  return `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap().by(__.unfold())).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap().by(__.unfold())).fold())`;
}

function makeCosmosQuery(query, nodeLimit) {
  const nodeLimitQuery = !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${nodeLimit})`: '';
  return `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap()).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id() ).by(__.inV().id()).by(__.label()).by(__.valueMap()).fold())`;
}

async function handleRequest(gremlinHost, gremlinPort, query, nodeLimit) {
  const client =  new gremlin.driver.Client(`${gremlinHost}:${gremlinPort}/gremlin`, { traversalSource: 'g', mimeType: 'application/json' });

  const result = await client.submit(makeQuery(query, nodeLimit), {});
  
  return nodesToJson(result._items);
}

async function handleCosmosRequest(gremlinHost, gremlinPort, query, nodeLimit) {
  const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(`/dbs/${DATABASE}/colls/${COLLECTION}`, COSMOSDB_KEY);
  const client =  new gremlin.driver.Client(`${gremlinHost}:${gremlinPort}/gremlin`, 
    { 
      authenticator,
      traversalSource: 'g', 
      mimeType: 'application/vnd.gremlin-v2.0+json' 
    }
  );  

  const result = await client.submit(makeCosmosQuery(query, nodeLimit), {});

  return convertNodes(result._items);
}

app.post('/query', (req, res, next) => {
  const gremlinHost = req.body.host;
  const gremlinPort = req.body.port;
  const nodeLimit = req.body.nodeLimit;
  const query = req.body.query;

  const cosmosDBMode = COSMOSDB_KEY!=undefined;


  if(cosmosDBMode)
    handleCosmosRequest(gremlinHost, gremlinPort, query, nodeLimit)
    .then((result) => res.send(result))
    .catch((err) => next(err));
  else 
    handleRequest(gremlinHost, gremlinPort, query, nodeLimit)
        .then((result) => res.send(result))
    .catch((err) => next(err));

});

app.listen(port, () => console.log(`Simple gremlin-proxy server listening on port ${port}!`));