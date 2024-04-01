const TelegramManager = require("./managerTelegramServer");
const TelegramBot = require("./connectionAndSendMessage");
const buttonsConfirmReject = require("./layoutsButton");

const telegramBot = new TelegramBot();
const telegramManager = new TelegramManager(telegramBot);

telegramManager.connectServerAndWebhook();
telegramBot.sendTelegramMessageAdminInterective(
  "Алло бл",
  buttonsConfirmReject
);
