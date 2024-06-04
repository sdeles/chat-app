# Use a imagem base Node.js LTS com Alpine Linux
FROM node:lts-alpine3.20

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie o package.json e package-lock.json (se existir)
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Defina o comando de entrada
ENTRYPOINT ["node", "server.js"]
