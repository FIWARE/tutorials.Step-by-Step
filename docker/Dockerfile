ARG NODE_VERSION=10
ARG GITHUB_ACCOUNT=fiware
ARG GITHUB_REPOSITORY=tutorials.Step-by-Step
ARG DOWNLOAD=latest
ARG SOURCE_BRANCH=master
ARG SOURCE_COMMIT=unknown

########################################################################################
#
# This build stage retrieves the source code from GitHub. The default download is the 
# latest tip of the master of the named repository on GitHub.
#
# To obtain the latest stable release run this Docker file with the parameters:
# --no-cache --build-arg DOWNLOAD=stable
#
# To obtain any specific version of a release run this Docker file with the parameters:
# --no-cache --build-arg DOWNLOAD=1.7.0
#
# For development purposes, to create a development image including a running Distro, 
# run this Docker file with the parameter:
#
# --target=builder
#
######################################################################################## 
FROM node:${NODE_VERSION} AS builder
ARG GITHUB_ACCOUNT
ARG GITHUB_REPOSITORY
ARG DOWNLOAD
ARG SOURCE_BRANCH

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# As an Alternative for local development, just copy this Dockerfile into file the root of 
# the repository and replace the whole RUN statement below by the following COPY statement 
# in your local source using :
#
# COPY ./context-provider /opt/tutorial
#

# hadolint ignore=DL3008
RUN \
  # Ensure that unzip is installed prior to downloading
  apt-get install -y --no-install-recommends unzip && \
  if [ "${DOWNLOAD}" = "latest" ] ; \
  then \
    RELEASE="${SOURCE_BRANCH}"; \
    echo "INFO: Building Latest Development from ${SOURCE_BRANCH} branch."; \
  elif [ "${DOWNLOAD}" = "stable" ]; \
  then \
    RELEASE=$(curl -s https://api.github.com/repos/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/releases/latest | grep 'tag_name' | cut -d\" -f4); \
    echo "INFO: Building Latest Stable Release: ${RELEASE}"; \
  else \
    RELEASE="${DOWNLOAD}"; \
    echo "INFO: Building Release: ${RELEASE}"; \
  fi && \
  RELEASE_CONCAT=$(echo "${RELEASE}" | tr / -); \
  curl -s -L https://github.com/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/archive/"${RELEASE}".zip > source.zip && \
  unzip source.zip -x "*/docs/**" "*/.*" && \
  rm source.zip && \
  mv "${GITHUB_REPOSITORY}-${RELEASE_CONCAT}/context-provider" /opt/tutorial && \
  # Remove unzip and clean apt cache
  apt-get clean && \
  apt-get remove -y unzip && \
  apt-get -y autoremove && \
  rm -rf /var/lib/apt/lists/* 

WORKDIR /opt/tutorial

# hadolint ignore=DL3008
RUN \
  # Ensure that Git is installed prior to running npm install
  apt-get install -y --no-install-recommends git && \
  echo "INFO: npm install --production..." && \
  npm install --only=prod --no-package-lock --no-optional && \
  # Remove Git and clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove

USER node
ENV NODE_ENV=development
# Ports used by application
EXPOSE ${WEB_APP_PORT:-3000} ${DUMMY_DEVICES_PORT:-3001}
CMD ["node", "/opt/tutorial/bin/www"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
   CMD npm run healthcheck

########################################################################################
#
# This build stage creates an anonymous user to be used with the distroless build
# as defined below.
#
########################################################################################
FROM node:${NODE_VERSION} AS anon-user
RUN sed -i -r "/^(root|nobody)/!d" /etc/passwd /etc/shadow /etc/group \
    && sed -i -r 's#^(.*):[^:]*$#\1:/sbin/nologin#' /etc/passwd


#
# The following creates a distroless build for production.
#

FROM gcr.io/distroless/nodejs:${NODE_VERSION}
ARG GITHUB_ACCOUNT
ARG GITHUB_REPOSITORY
ARG NODE_VERSION
ARG SOURCE_COMMIT
ENV GIT_COMMIT=$SOURCE_COMMIT

LABEL "maintainer"="FIWARE Foundation <fiware.eu@gmail.com>"
LABEL "org.opencontainers.image.authors"="https://www.fiware.org/contact-us/"
LABEL "org.opencontainers.image.documentation"="http://fiware-tutorials.rtfd.io/"
LABEL "org.opencontainers.image.vendor"="FIWARE Foundation"
LABEL "org.opencontainers.image.licenses"="MIT"
LABEL "org.opencontainers.image.title"="FIWARE Step-by-Step Tutorials"
LABEL "org.opencontainers.image.description"="Simple Node.js express application for use with the FIWARE Step-by-Step tutorials"
LABEL "org.opencontainers.image.source"=https://github.com/${GITHUB_ACCOUNT}/${GITHUB_REPOSITORY}
LABEL "org.nodejs.version"=${NODE_VERSION}

COPY --from=builder /opt/tutorial /opt/tutorial
WORKDIR /opt/tutorial

USER nobody
ENV NODE_ENV=production
# Ports used by application
EXPOSE ${WEB_APP_PORT:-3000} ${DUMMY_DEVICES_PORT:-3001}
CMD ["./bin/www"]
HEALTHCHECK  --interval=30s --timeout=3s --start-period=10s \
  CMD ["/nodejs/bin/node", "./bin/healthcheck"]


