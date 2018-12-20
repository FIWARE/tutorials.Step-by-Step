ARG  NODE_VERSION=8.12.0-slim
FROM node:${NODE_VERSION}
ARG GITHUB_ACCOUNT=fiware
ARG GITHUB_REPOSITORY=tutorials.Step-by-Step
ARG DOWNLOAD=latest

# Copying Build time arguments to environment variables so they are persisted at run time and can be 
# inspected within a running container.
# see: https://vsupalov.com/docker-build-time-env-values/  for a deeper explanation.

ENV GITHUB_ACCOUNT=${GITHUB_ACCOUNT}
ENV GITHUB_REPOSITORY=${GITHUB_REPOSITORY}
ENV DOWNLOAD=${DOWNLOAD}

#
# The following RUN command retrieves the source code from GitHub.
# 
# To obtain the latest stable release run this Docker file with the parameters
# --no-cache --build-arg DOWNLOAD=stable
# To obtain any speciifc version of a release run this Docker file with the parameters
# --no-cache --build-arg DOWNLOAD=1.7.0
#
# The default download is the latest tip of the master of the named repository on GitHub
#
# Alternatively for local development, just copy this Dockerfile into file the root of the repository and 
# replace the whole RUN statement by the following COPY statement in your local source using :
#
COPY context-provider /usr/src/app
#


# Create app directory
WORKDIR /usr/src/app

RUN npm install --production && \
    rm -rf /root/.npm/cache/*

# Ports used by application
EXPOSE ${WEB_APP_PORT:-3000} ${DUMMY_DEVICES_PORT:-3001}

CMD ["npm", "start" ]