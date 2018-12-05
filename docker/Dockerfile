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
# COPY context-provider /usr/src/app
#
RUN if [ "${DOWNLOAD}" = "latest" ] ; \
  then \
    RELEASE="master"; \
    echo "INFO: Building Latest Development"; \
  elif [ "${DOWNLOAD}" = "stable" ]; \
  then \
    RELEASE=$(curl -s https://api.github.com/repos/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/releases/latest | grep 'tag_name' | cut -d\" -f4); \
    echo "INFO: Building Latest Stable Release: ${RELEASE}"; \
  else \
    RELEASE="${DOWNLOAD}"; \
    echo "INFO: Building Release: ${RELEASE}"; \
  fi && \
  # Ensure that unzip is installed, and download the sources
  apt-get update && \
  apt-get install -y  --no-install-recommends unzip && \
  wget --no-check-certificate -O source.zip https://github.com/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/archive/"${RELEASE}".zip && \
  unzip source.zip && \
  rm source.zip && \
  mv "${GITHUB_REPOSITORY}-${RELEASE}"/context-provider /usr/src/app && \
  rm -rf "${GITHUB_REPOSITORY}-${RELEASE}" && \
  # Remove unzip and clean apt cache
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