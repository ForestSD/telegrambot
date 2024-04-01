const https = require("https");
const config = require("./settings.json");

const token = config.token;
const chatIds = config.chatIds;

//TODO: Sell/Buy - отметил. (Высылать цену которую хочет поставить, и текущую цену) Сделать интерактивный UI чтобы можно было вручую дать подтверждение

class TelegramBot {
  constructor(yourMessagesTrackingList = []) {
    this.yourMessagesTrackingList = yourMessagesTrackingList;
  }
  //Отправка сообщений для админов (подходит для уведомления об ошибках или выводе баланса/названия предметов/статусов итд.)
  async sendTelegramMessageAdmin(message) {
    chatIds.forEach((chatId) => {
      const data = JSON.stringify({
        chat_id: chatId,
        text: message,
      });

      const options = {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        res.on("data", (d) => {
          process.stdout.write(d);
        });
      });

      req.on("error", (e) => {
        console.error(`Произошла ошибка при отправке сообщения: ${e.message}`);
      });

      req.write(data);
      req.end();
    });
  }

  //Отправка интерактивных сообщений для админов с кнопками, и возможностью взаимодействия с ними
  async sendTelegramMessageAdminInterective(message, buttons) {
    chatIds.forEach((chatId) => {
      const replyMarkup = JSON.stringify({
        inline_keyboard: [
          buttons.map((button) => ({
            text: button.text,
            callback_data: button.callback_data,
          })),
        ],
      });

      const data = JSON.stringify({
        chat_id: chatId,
        text: message,
        reply_markup: replyMarkup,
      });

      console.log("DATA", data);
      console.log("ReplyMarkup", replyMarkup);

      const options = {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let rawData = "";

        // Сбор данных
        res.on("data", (chunk) => {
          rawData += chunk;
        });

        // Конец получения данных
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            if (parsedData.ok) {
              const messageId = parsedData.result.message_id;
              this.yourMessagesTrackingList.push({ chatId, messageId });
            }
          } catch (error) {
            console.error("Ошибка при обработке ответа:", error);
          }
        });
      });

      req.on("error", (e) => {
        console.error(`Произошла ошибка при отправке сообщения: ${e.message}`);
      });

      req.write(data);
      req.end();
    });
  }

  //Отправка сообщений пользователям
  async sendTelegramMessageToUser(message, chatId) {
    const data = JSON.stringify({
      chat_id: chatId,
      text: message,
    });

    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      res.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    req.on("error", (e) => {
      console.error(`Произошла ошибка при отправке сообщения: ${e.message}`);
    });

    req.write(data);
    req.end();
  }

  // Метод для обновления сообщения (удаляем кнопки выбора)
  async updateMessage(chatId, messageId, newText) {
    const data = JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: newText, // Обновляем текст сообщения
      reply_markup: {
        inline_keyboard: [], // Очищаем клавиатуру
      },
    });

    const options = {
      hostname: "api.telegram.org",
      path: `/bot${token}/editMessageReplyMarkup`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      res.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    req.on("error", (e) => {
      console.error(`Ошибка при обновлении сообщения: ${e.message}`);
    });

    req.write(data);
    req.end();
  }

  async handleConfirm() {
    for (let message of this.yourMessagesTrackingList) {
      await this.updateMessage(
        message.chatId,
        message.messageId,
        "Товар подтвержден"
      );
    }
    // Очистка списка отслеживаемых сообщений
    this.yourMessagesTrackingList = [];
  }

  /**
   * Промис ->
   *   Функция
   * БД
   */

  // Обрабатывает отклонения от пользователя
  async handleReject() {
    for (let message of this.yourMessagesTrackingList) {
      await this.updateMessage(
        message.chatId,
        message.messageId,
        "Товар отклонен"
      );
    }
    // Очистка списка отслеживаемых сообщений
    this.yourMessagesTrackingList = [];
  }
}

module.exports = TelegramBot;
