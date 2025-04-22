FROM node:22-alpine AS builder

WORKDIR /app

# Definicja argumentów
ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG OPENROUTER_API_KEY

# Ustawienie zmiennych środowiskowych podczas budowania
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

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