From node:18-alpine3.14
WORKDIR /backend
COPY . .
RUN npm install && npm install -g nodemon
EXPOSE 443
CMD ["nodemon", "app.js"]