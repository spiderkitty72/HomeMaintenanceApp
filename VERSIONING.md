# Release and Versioning Guide

This document outlines the standard workflow for incrementing the version of the Maintenance App, tagging it on GitHub, and publishing the updated image to DockerHub.

## 1. Increment the Version
We use `npm` to handle versioning. This automatically updates `package.json`, commits the change, and creates a git tag.

From the root of the project, run **one** of the following commands depending on the type of update:

- **Patch** (Bug fixes, small tweaks):
  ```bash
  npm version patch
  ```
  *(Example: `0.1.0` -> `0.1.1`)*

- **Minor** (New features, backward compatible):
  ```bash
  npm version minor
  ```
  *(Example: `0.1.1` -> `0.2.0`)*

- **Major** (Breaking changes):
  ```bash
  npm version major
  ```
  *(Example: `0.2.0` -> `1.0.0`)*

## 2. Push to GitHub
Once the version is incremented, you need to push the commit and the new tag to GitHub:

```bash
git push origin main
git push --tags
```

### Create a GitHub Release (Optional but Recommended)
1. Go to your GitHub repository.
2. Click on **Tags** or **Releases** on the right side.
3. Find your new tag (e.g., `v0.1.1`) and click **Create release from tag**.
4. Add release notes detailing what changed, and click **Publish release**.

## 3. Build and Publish to DockerHub
Now that your code is versioned locally, you can build the Docker image and tag it with the same version number so it matches.

1. **Build the image**:
   Replace `yourdockerhubusername` with your actual DockerHub username, and `v0.1.1` with the version you just created.
   ```bash
   docker build -t yourdockerhubusername/maintenance-app:v0.1.1 .
   ```

2. **Tag it as `latest`** (so people downloading without a version get the newest one):
   ```bash
   docker tag yourdockerhubusername/maintenance-app:v0.1.1 yourdockerhubusername/maintenance-app:latest
   ```

3. **Push both tags to DockerHub**:
   ```bash
   docker push yourdockerhubusername/maintenance-app:v0.1.1
   docker push yourdockerhubusername/maintenance-app:latest
   ```

> [!TIP]
> **Docker Compose Users**: If you are just building the docker container for your own local use and not pushing to DockerHub, simply run `docker-compose up -d --build` after running `npm version patch`. Docker will automatically pick up the new version from `package.json`!
