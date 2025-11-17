FROM node:20

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Устанавливаем TypeScript глобально и билдим
RUN npm install -g typescript
RUN npm run build

# Устанавливаем serve для раздачи статики
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]