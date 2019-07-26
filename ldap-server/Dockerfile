# specify the node base image with your desired version node:<version>
FROM node:10.13.0
ENV NPM_CONFIG_LOGLEVEL warn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app
RUN npm install

# replace this with your application's default port
EXPOSE 1389
CMD [ "npm", "start" ]