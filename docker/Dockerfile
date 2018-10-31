FROM node:carbon-slim

ENV OWNER "fiware" 
ENV REPOSITORY "tutorials.Step-by-Step"

WORKDIR /
RUN apt-get update && \
  	apt-get install -y unzip && \
  	wget --no-check-certificate -O source.zip https://github.com/${OWNER}/${REPOSITORY}/archive/master.zip; \
	apt-get --no-install-recommends install unzip  && \
	unzip source.zip && \
	rm source.zip && \
	mv ${REPOSITORY}-master/context-provider /usr/src/app && \
	rm -rf ${REPOSITORY}-master && \
	apt-get clean && \
    apt-get remove -y unzip && \
    apt-get -y autoremove

# Create app directory
WORKDIR /usr/src/app

RUN npm install --production && \
    rm -rf /root/.npm/cache/*

# Ports used by application
EXPOSE ${WEB_APP_PORT:-3000} ${DUMMY_DEVICES_PORT:-3001}

CMD ["npm", "start" ]