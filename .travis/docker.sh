#!/usr/bin/env bash

# Path to this file
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Path the script was called from
IPWD="$(pwd)"
# Import shared vars
. ${DIR}/_shared-vars.sh

function tag_and_push_api_and_web {
    docker tag hdafbi/geli-api hdafbi/geli-api:${1}
    docker tag hdafbi/geli-web-frontend hdafbi/geli-web-frontend:${1}
    docker push hdafbi/geli-api:${1}
    docker push hdafbi/geli-web-frontend:${1}
}

function check_dockerhub_major {
    local EXISTING_TAGS=$( \
        wget -q https://registry.hub.docker.com/v1/repositories/hdafbi/geli-api/tags -O - \
        | sed -e 's/[][]//g' -e 's/"//g' -e 's/ //g' \
        | tr '}' '\n' \
        | awk -F: '{print $3}' \
        )

    while read -r line; do
        # Check if line beginns with a "v"
        if [[ $line == v* ]]; then
            local MAJ=0; local MIN=0; local PAT=0; local SPE=""
            semverParseInto "$line" MAJ MIN PAT SPE

            # Check if same major
            if [[ "$REAL_MAJOR" == "v$MAJ" ]]; then
                semverGT "$line" "$TRAVIS_TAG"
                
                # Check if current line was bigger
                if [[ $? == 0 ]]; then
                    echo "+ found bigger MINOR: $line > $TRAVIS_TAG"
                    return false
                fi
            else
                echo "+ skipping $line, not same MAJOR"
            fi
        else
            echo "+ skipping DockerHub-Tag: $line"
        fi
    done <<< "$EXISTING_TAGS"

    return true
}

echo
echo "+++ Run docker build and publish. +++"
echo
# printenv

if [ "$TRAVIS_BRANCH" == "master" ] || [ "$TRAVIS_BRANCH" == "develop" ]; then
  if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
    echo "+ build docker images";
    echo "+ prune dev-dependencies"
    ( cd api && npm prune --production )
    docker build -t hdafbi/geli-api:latest -f .docker/api/Dockerfile .
    docker build -t hdafbi/geli-web-frontend:latest -f .docker/web-frontend/Dockerfile .

    echo "+ publish docker images";
    docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
    echo "+ => tagged: latest"
    tag_and_push_api_and_web "latest"
    echo "+ => tagged: ${TRAVIS_BRANCH}"
    tag_and_push_api_and_web ${TRAVIS_BRANCH}
  else
    echo -e "${YELLOW}+ WARNING: pull request #$TRAVIS_PULL_REQUEST -> skipping docker build and publish${NC}";
  fi
else
  if [ -n "${TRAVIS_TAG}" ]; then
    echo "+ this is a tagged build: $TRAVIS_TAG";
    echo "+ build docker images";
    echo "+ prune dev-dependencies"
    ( cd api && npm prune --production )
    docker build -t hdafbi/geli-api:$TRAVIS_TAG -f .docker/api/Dockerfile .
    docker build -t hdafbi/geli-web-frontend:$TRAVIS_TAG -f .docker/web-frontend/Dockerfile .

    echo "+ publish docker images";
    docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
    echo "+ => tagged: ${TRAVIS_TAG}"
    tag_and_push_api_and_web ${TRAVIS_TAG}

    echo "+ retrieve semver-parts of tag"
    . ${DIR}/_semver.sh
    MAJOR=0;MINOR=0;PATCH=0;SPECIAL=""
    semverParseInto ${TRAVIS_TAG} MAJOR MINOR PATCH SPECIAL
    REAL_MAJOR="v${MAJOR}"
    REAL_MINOR="v${MAJOR}.${MINOR}"
    REAL_PATCH="v${MAJOR}.${MINOR}.${PATCH}"

    if [ "${SPECIAL}" ]; then
        echo -e "${YELLOW}+ WARNING: tag '${TRAVIS_TAG}' has special-part '${SPECIAL}'${NC}"
        echo -e "${YELLOW}+ WARNING: will NOT tag Major '${REAL_MAJOR}' and Minor '${REAL_MINOR}', only the full tag '${TRAVIS_TAG}'${NC}"
    else
        echo "+ tag images"
        echo -e "${YELLOW}+ WARNING: Major tagging is currently not implemented, will skip major tagging"
        check_dockerhub_major
        if [ $? == true ]; then
            echo "+ => tagged Major: ${REAL_MAJOR}"
            tag_and_push_api_and_web REAL_MAJOR
        fi
        echo "+ => tagged Minor: ${REAL_MINOR}"
        tag_and_push_api_and_web REAL_MINOR
    fi
  else
    echo -e "${YELLOW}+ WARNING: branch $TRAVIS_BRANCH is not whitelisted -> skipping docker build and publish${NC}";
  fi
fi
