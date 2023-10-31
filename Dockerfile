FROM node:20

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get -y install cron
RUN apt-get -y install ghostscript

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install
RUN npm install --prefix ./server/ ./server/

COPY policy.xml /etc/ImageMagick-6/
COPY cron /etc/cron.d/cron
COPY . .

RUN chmod 0644 /etc/cron.d/cron
RUN crontab /etc/cron.d/cron

EXPOSE 80

ENTRYPOINT ["/bin/sh", "-c" , "cron && npm run start"]