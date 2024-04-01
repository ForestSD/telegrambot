const TelegramBot = require("node-telegram-bot-api");
const {
  sendTelegramMessage,
  sendTelegramMessageByChatId,
} = require("./connectionAndSendMessage");
const config = require("./settings.json");

const token = config.token;
const chatIds = config.chatIds;
// const bot = new TelegramBot(token, { polling: true })

async function initTelegrammCommand() {
  getStatus();
  //getAllAccounts()
}

function getStatus() {
  bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;

    // Получение статуса вашей программы
    const status = "Работает - это статика!(он его ни от куда не получает)";

    // Отправка статуса пользователю
    if (chatIds.includes(chatId)) {
      sendTelegramMessageByChatId(`Статус программы: ${status}`, chatId)
        .then(() => {
          bot.sendMessage(chatId, "Статус отправлен.");
        })
        .catch((error) => {
          bot.sendMessage(chatId, "Произошла ошибка при отправке статуса.");
        });
    } else {
      sendTelegramMessageByChatId(`Вы не администратор`, chatId);
    }
  });
}

function getAllAccounts() {
  bot.onText(/\/accounts/, async (msg) => {
    const chatId = msg.chat.id;

    if (chatIds.includes(chatId)) {
      try {
        //const allAccounts = await ActionsWithAccount.prototype.getAllAccounts();
        const allAccountsString = JSON.stringify(allAccounts, null, 2);
        await sendTelegramMessageByChatId(
          `Вот все аккаунты: ${allAccountsString}`,
          chatId
        );
      } catch (error) {
        console.error(error);
        await sendTelegramMessageByChatId(
          "Произошла ошибка при получении данных об аккаунтах.",
          chatId
        );
      }
    } else {
      await sendTelegramMessageByChatId("Свободен", chatId);
    }
  });
}

module.exports = { initTelegrammCommand };
