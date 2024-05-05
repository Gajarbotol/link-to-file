const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
const bot = new TelegramBot('7124287824:AAGcZUblRJ9-YWCWwPXnJhwGrv7a6kwObDo', { polling: true });

// Define the allowed file extensions
const allowedExtensions = ['apk', 'mp4', 'mp3', 'zip', 'jar', 'js', 'html', 'png', 'jpeg'];

// Maximum file size allowed in bytes (20 MB)
const maxFileSize = 20 * 1024 * 1024;

// Array to store users who started the bot
let startedUsers = [];

// Specify your specific chat ID
const specificChatId = '5197344486';

// Handle the download and sending of files
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    // Check if the message contains a direct link to a file with allowed extensions
    if (messageText && isUrl(messageText) && isAllowedExtension(messageText)) {
        try {
            // Get the file size
            const response = await axios.head(messageText);
            const fileSize = response.headers['content-length'];

            // Check if the file size is within the limit
            if (fileSize <= maxFileSize) {
                // Download the file
                const downloadResponse = await axios.get(messageText, { responseType: 'stream' });
                const fileName = messageText.substring(messageText.lastIndexOf('/') + 1);
                const filePath = `downloads/${fileName}`; // Change the "downloads" directory to your desired location
                const writer = fs.createWriteStream(filePath);
                downloadResponse.data.pipe(writer);

                // Send the downloaded file back to the user
                writer.on('finish', () => {
                    bot.sendDocument(chatId, filePath).then(() => {
                        // Delete the downloaded file from the server
                        fs.unlinkSync(filePath);
                    });
                });
            } else {
                bot.sendMessage(chatId, "Sorry, the file exceeds the maximum size limit (20MB). Please send a smaller file.");
            }
        } catch (error) {
            console.error(error);
        }
    }
});

// Function to check if a string is a URL
function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Function to check if a file link has an allowed extension
function isAllowedExtension(fileLink) {
    const extension = fileLink.substring(fileLink.lastIndexOf('.') + 1).toLowerCase();
    return allowedExtensions.includes(extension);
}

// Handle the start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if the user already started the bot
    if (!startedUsers.includes(userId)) {
        startedUsers.push(userId);
        bot.sendMessage(chatId, "Hello! Thanks for starting the bot.");
    } else {
        bot.sendMessage(chatId, "You've already started the bot.");
    }
});

// Send the list of users who started the bot to the specified chat ID
function sendUserList() {
    bot.sendMessage(specificChatId, `List of users who started the bot: \n${startedUsers.join('\n')}`);
}
