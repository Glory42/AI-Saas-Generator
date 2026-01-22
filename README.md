# AI SaaS Image Generator

> A full-stack AI platform that transforms ordinary product photos into professional marketing assets using a Smart Hybrid AI Engine.

![Project Status](https://img.shields.io/badge/status-in%20development-orange)
![Tech Stack](https://img.shields.io/badge/stack-Bun%20%2B%20Express%20%2B%20React-blue)
![License](https://img.shields.io/badge/license-GPL-green)

## Features

- **🔐 Secure Authentication:** JWT-based auth with Supabase (Users, Roles).
- **☁️ Cloud Storage:** High-performance image uploads via Cloudinary.
- **🧠 Smart Hybrid AI Engine:**
  - Attempts native **Gemini 3.0 Pro** image generation first.
  - Automatically falls back to a **Gemini 3.0 (Brain)** pipeline if region-locked.
  - Generates photorealistic product shots (8K, Cinematic Lighting).
- **⚡ High Performance:** Built on **Bun** runtime for blazing fast execution.

## 🗺️ Project Roadmap
Curious about what's coming next? 
[**Click here to view our detailed Roadmap & Master Plan**](./ROADMAP.md)

## Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Backend:** Express, TypeScript
- **Database:** Supabase 
- **Storage:** Cloudinary
- **AI Models:** Google Gemini 1.5/3.0 Pro
- **Frontend:** React.js (In Progress)

##  Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)
- A [Supabase](https://supabase.com/) project
- A [Cloudinary](https://cloudinary.com/) account
- A [Google AI Studio](https://aistudio.google.com/) API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Glory42/ai-saas-generator.git](https://github.com/Glory42/ai-saas-generator.git)
   cd ai-saas-generator
    ```

2. **Install Dependencies**
```bash
    cd server
    bun install
```

3. **Environment Setup Create a .env file in the server directory:**
```toml
    PORT=5000

    # Database
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key

    # Auth
    JWT_TOKEN=your_super_secret_jwt_key

    # Storage
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # AI
    GEMINI_API_KEY=your_google_gemini_key
```

4. **Database Schema Run these SQL queries in your Supabase SQL Editor to set up the tables:**
```sql
-- Users Table
create table users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password text not null,
  username text not null,
  role text default 'user',
  created_at timestamp with time zone default now()
);

-- Images Table
create table images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  original_url text not null,
  generated_url text,
  prompt text,
  template text,
  created_at timestamp with time zone default now()
);
```

5. ***Run the Server***
```bash
    bun run dev
```

## API Endpoints 
| Method | Endpoint | Description | Protected | 
|-------|------------|-----------|----------|
| `POST` | `/api/auth/register` | Create a new account | ❌ |
| `POST` | `/api/auth/login` | Login and get JWT | ❌ |
| `POST` | `/api/upload` | Upload an image file | ✅ |
| `POST` | `/api/generate` | Generate AI transformation | ✅ |

## Roadmap
* [x] Backend Infrastructure (Auth, Uploads)

* [x] AI Logic (Gemini 3.0 Integration)

* [ ] Frontend Dashboard (React)

* [ ] User Gallery & History

## License

This project is licensed under the GNU General Public License v3.0.  
See the [LICENSE](LICENSE) file for more information.

## Contact

If you have any questions, feel free to reach out to me at `me@gorkemkaryol.dev`.