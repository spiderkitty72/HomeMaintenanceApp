# Maintenance App

WARNING:
This project is 99% Vibe Coded. This is a personal project and the intent is not to make this useful for everyone and every application. The intent is a simple to use web based application that I can run on my server in docker to track maintenance on my home, vechicles and utility equipment.

A comprehensive maintenance tracking system designed to help you manage assets (vehicles, equipment, property), track service history, monitor fuel usage, and stay on top of maintenance schedules.

## 🚀 Key Features

- **Asset Management**: Track unlimited assets with flexible tracking methods (Mileage, Hours, or Date-only).
- **Service Records**: Maintain detailed service history including summary, notes, vendor information, and total costs.
- **Fuel Tracking**: Log fuel fills to monitor consumption, price fluctuations, and efficiency.
- **Parts Inventory**: Manage a catalog of parts with stock levels, manufacturer details, and compatibility mapping to assets.
- **Maintenance Schedules**: Set up recurring maintenance reminders based on usage intervals or calendar dates.
- **Flexible Permissions**: Robust group-based access control (RBAC) to share assets and manage team collaboration.
- **Attachment Support**: Upload and link receipts, manuals, or photos directly to records.
- **Data Export**: Export inventory and records to Excel for external reporting.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database**: [Prisma](https://prisma.io) with **SQLite**
- **Authentication**: [NextAuth.js](https://next-auth.js.org) (v5)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) & [Shadcn UI](https://ui.shadcn.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ 
- npm / yarn / pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd maintenance-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory (or use the provided `.env.local` templates):
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   AUTH_SECRET="your-secret-here" # Generate with: npx auth secret
   ```

4. **Initialize Database**:
   ```bash
   npx prisma db push
   ```

5. **Seed Initial Data (Admin Account)**:
   This creates a default admin user and base permission groups.
   ```bash
   npx prisma db seed
   ```
   **Default Credentials:**
   - **Email**: `admin@example.com`
   - **Password**: `maintenance`

6. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🐳 Docker Support

You can also run the application using Docker Compose:

This will spin up the application in production mode on port 3030.

```bash
docker-compose up -d
```

### Data Persistence

The app is configured to use **bind mounts** for data persistence. This ensures your database and uploads are stored safely on your host machine even if the container is removed:

- **Database**: Stored in `./data/dev.db`
- **Uploads**: Stored in `./public/uploads/`

> [!NOTE]
> Ensure the `./data` and `./public/uploads` directories exist on your host machine to avoid permission issues when the container starts.

## 🔒 Reverse Proxy & Security

If you are running this app behind a reverse proxy (Nginx, Caddy, etc.):

1.  **Trust Headers**: The app is already configured with `AUTH_TRUST_HOST=true` in `docker-compose.yml`.
2.  **Public URL**: Set the `AUTH_URL` environment variable to your public address (e.g., `https://maintenance.example.com`).
3.  **Proxy Configuration**: Ensure your proxy passes `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers.

### Nginx Example
```nginx
location / {
    proxy_pass http://localhost:3030;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📄 License

Check individual file headers or the license file for details.
