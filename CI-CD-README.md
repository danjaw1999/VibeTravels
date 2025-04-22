# CI/CD dla VibeTravels

Ten dokument opisuje konfigurację CI/CD dla projektu VibeTravels, wykorzystującą GitHub Actions, Docker i DigitalOcean.

## Przegląd

Konfiguracja zawiera następujące etapy:

1. **Setup** - pobranie kodu i odczytanie wersji Node.js z pliku `.nvmrc`
2. **Test** - uruchomienie linterów, testów jednostkowych i E2E
3. **Build** - zbudowanie aplikacji produkcyjnej
4. **Deploy** - wdrożenie na serwer DigitalOcean przez Docker

## Wymagane sekrety GitHub

W swoim repozytorium GitHub dodaj następujące sekrety:

1. `SUPABASE_URL` - URL do instancji Supabase
2. `SUPABASE_KEY` - klucz API Supabase
3. `OPENROUTER_API_KEY` - klucz API OpenRouter
4. `E2E_USERNAME_ID` - ID użytkownika dla testów E2E
5. `E2E_USERNAME` - Nazwa użytkownika/email dla testów E2E
6. `DOCKER_USERNAME` - nazwa użytkownika w Docker Hub
7. `DOCKER_PASSWORD` - hasło do Docker Hub
8. `DO_HOST` - adres IP serwera DigitalOcean
9. `DO_USERNAME` - nazwa użytkownika do serwera DigitalOcean
10. `DO_PRIVATE_KEY` - klucz SSH do logowania na serwer DigitalOcean

## Uruchamianie workflow

Workflow uruchamia się automatycznie:

- Po każdym push do gałęzi `main`
- Przy każdym pull request do gałęzi `main`

Można również uruchomić workflow ręcznie z zakładki "Actions" w repozytorium GitHub.

## Struktura workflow

### 1. Setup

```yaml
setup:
  name: Setup
  runs-on: ubuntu-latest
  outputs:
    node-version: ${{ steps.nvmrc.outputs.node-version }}
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Read .nvmrc
      id: nvmrc
      run: echo "node-version=$(cat .nvmrc)" >> $GITHUB_OUTPUT
```

### 2. Test

```yaml
test:
  name: Test
  runs-on: ubuntu-latest
  needs: setup
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ needs.setup.outputs.node-version }}
        cache: "npm"

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run unit tests
      run: npm test
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        E2E_USERNAME_ID: ${{ secrets.E2E_USERNAME_ID }}
        E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
```

### 3. Build

```yaml
build:
  name: Build
  needs: [setup, test]
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ needs.setup.outputs.node-version }}
        cache: "npm"

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build
        path: dist/
        retention-days: 7
```

### 4. Deploy

```yaml
deploy:
  name: Deploy
  needs: [setup, build]
  if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build
        path: dist

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v6
      with:
        context: .
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/vibetravels:latest
        cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/vibetravels:buildcache
        cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/vibetravels:buildcache,mode=max

    - name: Deploy to DigitalOcean
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.DO_HOST }}
        username: ${{ secrets.DO_USERNAME }}
        key: ${{ secrets.DO_PRIVATE_KEY }}
        script: |
          docker pull ${{ secrets.DOCKER_USERNAME }}/vibetravels:latest
          docker stop vibetravels || true
          docker rm vibetravels || true
          docker run -d --name vibetravels -p 80:80 \
            -e SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            -e SUPABASE_KEY=${{ secrets.SUPABASE_KEY }} \
            -e OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }} \
            ${{ secrets.DOCKER_USERNAME }}/vibetravels:latest
```

## Konfiguracja Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Kopiowanie plików konfiguracyjnych
COPY package*.json ./
COPY .nvmrc ./

# Instalacja zależności
RUN npm ci

# Kopiowanie kodu źródłowego
COPY . .

# Budowanie aplikacji
RUN npm run build

# Etap 2: Serwowanie aplikacji
FROM nginx:alpine

# Kopiowanie plików z etapu budowania
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ekspozycja portu
EXPOSE 80

# Uruchomienie serwera
CMD ["nginx", "-g", "daemon off;"]
```

## Konfiguracja Nginx

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Kompresja
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    gzip_min_length 1000;

    # Cache statycznych zasobów
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Obsługa SPA - przekierowanie wszystkich ścieżek do index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Nagłówki bezpieczeństwa
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Obsługa błędów
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## Konfiguracja testów E2E

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run preview",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || "",
      E2E_USERNAME: process.env.E2E_USERNAME || "",
    },
  },
});
```
