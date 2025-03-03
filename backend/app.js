const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const GeneralController = require("./controllers/general-controller");
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'pug');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', require('./routes'));

function createUploadsDirIfNotExists() {
  const dir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log('Директория uploads была создана.');
  }
}

createUploadsDirIfNotExists();

// Функция для очистки базы данных
async function clearDatabase() {
  try {
    await prisma.answer.deleteMany({});
    await prisma.grade.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.testAssignment.deleteMany({});
    await prisma.test.deleteMany({});
    console.log('Все коллекции очищены!');
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
  }
}

// Добавляем маршрут для очистки базы данных
app.delete('/api/clear-database', async (req, res) => {
  await clearDatabase();
  res.status(200).send('База данных очищена!');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Закрытие соединения с базой данных
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Соединение с базой данных закрыто.');
  process.exit(0);
});

module.exports = app;
