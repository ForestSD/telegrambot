const https = require("https");
const http = require("http");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const config = require("./settings.json");

//Залупа работает только с ngrok - в тестовом режиме

class TelegramManager {
  constructor(telegramBotInstance) {
    this.telegramBot = telegramBotInstance;
    this.token = config.token;
    this.webhookUrl = config.webhook;
    this.port = config.port || 3020;
    this.app = express();
    this.initMiddleware();
    this.server = null;
  }

  initMiddleware() {
    this.app.use(bodyParser.json());
  }

  //Основной метод для запуска сервера в телеге и установки взаимодействия с пользователем
  connectServerAndWebhook() {
    this.setWebhook();
    this.startServer();
  }

  // Устанавливает webhook для бота
  setWebhook() {
    const data = JSON.stringify({
      url: this.webhookUrl,
    });

    const options = {
      hostname: "api.telegram.org",
      path: `/bot${this.token}/setWebhook`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log("Webhook set response:", body);
      });
    });

    req.on("error", (e) => {
      console.error(`Произошла ошибка при установке webhook: ${e.message}`);
    });

    req.write(data);
    req.end();
  }

  // Обрабатывает входящие обновления от Telegram
  startServer() {
    http
      .createServer((req, res) => {
        if (req.method === "POST") {
          let body = "";

          req.on("data", (chunk) => {
            body += chunk.toString();
          });

          req.on("end", () => {
            const update = JSON.parse(body);
            this.handleUpdate(update);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("OK");
          });
        }
      })
      .listen(this.port);
    console.log(`Server is listening on port ${this.port}`);
  }

  stopServer() {
    if (this.server) {
      this.server.close(() => {
        console.log("Server stopped.");
      });
    }
  }

  // Обрабатывает входящие обновления от Telegram
  async handleUpdate(update) {
    if (update.message) {
      // Обработка обычного сообщения от пользователя
    } else if (update.callback_query) {
      // Обработка нажатия на inline кнопку
      console.log(`Callback Query received: ${update.callback_query.data}`);
      this.handleCallbackQuery(update.callback_query);
    }
  }

  // Обрабатывает callback queries, полученные от inline кнопок
  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    // Определение обработчиков для разных callback_data
    const handlers = {
      // Ссылки на методы
      confirm: this.telegramBot.handleConfirm,
      reject: this.telegramBot.handleReject,
    };
    // Получаем функцию обработчика на основе callback_data
    const handler = handlers[callbackQuery.data];

    if (handler) {
      // Вызываем обработчик и передаем ему необходимые параметры
      let result = await handler.call(this.telegramBot, chatId, messageId);
    } else {
      console.log(`Неизвестный callback_data: ${callbackQuery.data}`);
    }

    await this.answerCallbackQuery(callbackQuery.id);
  }

  // Отправляет ответ на callback query, чтобы подтвердить его получение
  async answerCallbackQuery(callbackQueryId) {
    const data = JSON.stringify({
      callback_query_id: callbackQueryId,
      text: "Понял, принял",
      show_alert: false,
    });

    const options = {
      hostname: "api.telegram.org",
      path: `/bot${this.token}/answerCallbackQuery`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      // Логирование ответа от Telegram API
    });

    req.on("error", (e) => {
      console.error(`Ошибка при ответе на callback query: ${e.message}`);
    });

    req.write(data);
    req.end();
  }
}

module.exports = TelegramManager;
