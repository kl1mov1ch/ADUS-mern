# Используем образ node:18-alpine
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json .
RUN npm config set fetch-retries 5
RUN npm config set fetch-timeout 60000
RUN npm cache clean --force
RUN npm install

# Копируем все файлы в контейнер
COPY . .

# Запускаем сборку приложения
RUN npm run build

# Устанавливаем сервер для обслуживания статических файлов
RUN npm install -g serve

# Открываем порт 8000
EXPOSE 8000

# Запускаем сервер для обслуживания приложения на порту 8000
CMD ["serve", "-s", "build", "-l", "8000"]
