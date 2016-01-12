FROM node:5.4.0-wheezy

RUN mkdir -p /usr/src/app  
WORKDIR /usr/src/app  
COPY . /usr/src/app

EXPOSE 80
RUN npm install  
CMD ["npm", "start"]  
