#!/bin/bash

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

echo "--------------------------------------------------"
echo "Building Docker images for $IMAGE_NAME"
echo "Version: $VERSION"
echo "--------------------------------------------------"

# Build the image and tag both the specific version and latest
docker build -t "$IMAGE_NAME:$VERSION" -t "$IMAGE_NAME:latest" .

echo "--------------------------------------------------"
echo "Pushing $IMAGE_NAME:$VERSION to Docker Hub..."
echo "--------------------------------------------------"
docker push "$IMAGE_NAME:$VERSION"

echo "--------------------------------------------------"
echo "Pushing $IMAGE_NAME:latest to Docker Hub..."
echo "--------------------------------------------------"
docker push "$IMAGE_NAME:latest"

echo "--------------------------------------------------"
echo "Successfully built and pushed $IMAGE_NAME:$VERSION and latest!"
echo "--------------------------------------------------"
