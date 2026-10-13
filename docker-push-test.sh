#!/bin/bash

# Builds and pushes a test image to Docker Hub WITHOUT touching the "latest" tag.
#
# Usage:
#   ./docker-push-test.sh            -> pushes <version>-test-<git short sha>, e.g. 0.4.2-test-1a2b3c4
#   ./docker-push-test.sh my-tag     -> pushes my-tag
#
# Then point your test server's compose file at that tag, e.g.
#   image: spiderkitty72/maintenanceapp:0.4.2-test-1a2b3c4

# Exit immediately if a command exits with a non-zero status
set -e

# Set your Docker Hub username and image name
IMAGE_NAME="spiderkitty72/maintenanceapp"

# Read version from package.json
VERSION=$(node -e "try { console.log(require('./package.json').version); } catch (e) { process.exit(1); }")

if [ -z "$VERSION" ]; then
    echo "ERROR: Could not read version from package.json"
    exit 1
fi

if [ -n "$1" ]; then
    TAG="$1"
else
    SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
    TAG="$VERSION-test-$SHA"
fi

# Never overwrite the production tags by accident
if [ "$TAG" = "latest" ] || [ "$TAG" = "$VERSION" ]; then
    echo "ERROR: '$TAG' is a release tag. Use docker-push.sh for releases."
    exit 1
fi

echo "--------------------------------------------------"
echo "Building TEST image $IMAGE_NAME:$TAG"
echo "(latest and $VERSION are NOT touched)"
echo "--------------------------------------------------"

docker build -t "$IMAGE_NAME:$TAG" .

echo "--------------------------------------------------"
echo "Pushing $IMAGE_NAME:$TAG to Docker Hub..."
echo "--------------------------------------------------"
docker push "$IMAGE_NAME:$TAG"

echo "--------------------------------------------------"
echo "Successfully built and pushed $IMAGE_NAME:$TAG"
echo "--------------------------------------------------"
