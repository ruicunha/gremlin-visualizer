require('dotenv').config();
const { readFileSync } = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const gremlin = require('gremlin');
const cors = require('cors');
const app = express();
const port = 3001;


let config={connections:[],queries:[]}

let clientConfig={connections:[],queries:[]}

try{
  config=JSON.parse(readFileSync('./config.json', 'utf8'));
  clientConfig.connections= config.connections.map((connection)=>{return { ...connection };})
  clientConfig.queries= config.queries;
  clientConfig.connections.forEach((connection)=>{delete connection["cosmosKey"]});


}catch(error){
}


const DATABASE = process.env.DATABASE;
const COLLECTION = process.env.COLLECTION;
const COSMOSDB_KEY = process.env.COSMOSDB_KEY;

app.use(cors({
  credentials: true,
}));

// parse application/json
app.use(bodyParser.json());

function getGremlinClient(connection) {
  return new gremlin.driver.Client(`${connection.host}:${connection.port}/gremlin`, { traversalSource: 'g', mimeType: 'application/json' });
}

function getCosmosClient(connection) {

  const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(`/dbs/${connection.database}/colls/${connection.collection}`, connection.cosmosKey);
  const client = new gremlin.driver.Client(`${connection.host}:${connection.port}/gremlin`,
    {
      authenticator,
      traversalSource: 'g',
      mimeType: 'application/vnd.gremlin-v2.0+json'
    }
  );
  return client;
}

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

async function handleCosmosRequest(connection, query, nodeLimit,consoleMode) {

  if(consoleMode){
    return origninalCosmosRequest(connection,query);
  }

  const result = await  getCosmosClient(connection).submit(makeCosmosQuery(query, nodeLimit), {});
  return convertNodes(result._items);

}
async function origninalCosmosRequest(connection, query) {

  try{
  const result = await  getCosmosClient(connection).submit(query, {});
   return {error:undefined, result:result};
  }catch(e){
    console.log(e);
    return {error:e, result:undefined};
  }
}


async function handleRequest(connection, query, nodeLimit) {

  if(consoleMode){
    return origninalGremlinRequest(connection,query);
  }

  const result = await getGremlinClient(connection).submit(makeQuery(query, nodeLimit), {});
  return nodesToJson(result._items);
}

async function origninalGremlinRequest(connection, query) {

  try{
   const result = await  getGremlinClient(connection).submit(query, {});
   return {error:undefined, result:result};
  }catch(e){
    console.log(e);
    return {error:e, result:undefined};
  }
}

async function handleCosmosDeleteRequest(connection,query) {

  const result = await  getCosmosClient(connection).submit(query, {});
  return true;
}

async function handleDeleteRequest(connection, query, nodeLimit) {

  const result = await getGremlinClient(connection).submit(query, {});
  return true

}


function getConnection(req){

  const connection= config?.connections.find((connection)=>{return connection.name==req.body.name;});

  if(connection)
    return connection;

  return {
    host:req.body.host,
    port:req.body.port,
    cosmosKey:COSMOSDB_KEY,
    database:DATABASE,
    collection:COLLECTION
  }

}

function getDeleteQuery(req){

  const id = req.body.id;
  const selectedType = req.body.selectedType;
  const cascade = req.body.cascade;
  const label = req.body.label;
  const field = req.body.field;
  let value = req.body.value;

  let boleanValue=value=='true'|| value==true?true:value=='false'|| value==false?false:undefined
  
  value = value=='true'?true:value=='false'?false:value

  if(selectedType=='Edge'){
    return  `g.E('${id}').drop()`;
  }
  if(selectedType=='Node'){

    let query=`g.V('${id}')`;

    if(cascade){

      query=query+".emit().repeat(";

      if(!label && ! field){
        query=query+'out()'
      }else{
        query=query+'outE()'
      }

      if(label){
        query=query+`.hasLabel('${label}')`
      }
      if(field && value){
        if(boleanValue!=undefined){
          query=query+`.has('${field}',${boleanValue})`
        }else{
          query=query+`.has('${field}','${value}')`
        }

      }else if(field){
        query=query+`.has('${field}')`
      }

      if( label ||  field){
        query=query+'.inV()'
      }

      query=query+").fold().unfold()";
    }
    return  query+`.drop()`;
  }
}


app.get('/config', (req, res, next) => {
  res.send(clientConfig)
});
app.post('/delete', (req, res, next) => {

  const connection=getConnection(req);
  const query=getDeleteQuery(req);
  
  const cosmosDBMode = connection.cosmosKey!=undefined;

  if(cosmosDBMode)
    handleCosmosDeleteRequest(connection, query)
      .then((result) => res.send(result))
      .catch((err) => next(err));
  else 
    handleDeleteRequest(connection, query)
        .then((result) => res.send(result))
       .catch((err) => next(err));

});

app.post('/query', (req, res, next) => {

  const connection=getConnection(req);

  const consoleMode = req.body.consoleMode;
  const nodeLimit = req.body.nodeLimit;
  const query = req.body.query;

  const cosmosDBMode = connection.cosmosKey!=undefined;

  if(cosmosDBMode)
    handleCosmosRequest(connection, query, nodeLimit,consoleMode)
    .then((result) => res.send(result))
    .catch((err) => next(err));
  else 
    handleRequest(connection, query, nodeLimit,consoleMode)
        .then((result) => res.send(result))
    .catch((err) => next(err));

});

app.listen(port, () => console.log(`Simple gremlin-proxy server listening on port ${port}!`));



