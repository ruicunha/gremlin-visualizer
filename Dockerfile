FROM node:10-alpine

WORKDIR /gremlin-visualizer-master

COPY . .

RUN npm cache clean --force && \
	npm config set strict-ssl false && \
	npm install

EXPOSE 3000 3001

CMD npm start
