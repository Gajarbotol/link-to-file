const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const MAX_FILE_SIZE_MB = 20;
const PORT = process.env.PORT || 3000; // Use the provided port or default to 3000

const bot = new Telegraf('7124287824:AAGcZUblRJ9-YWCWwPXnJhwGrv7a6kwObDo');

// Start command handler
bot.start((ctx) => {
  ctx.reply('Welcome to the file downloader bot! Send me a direct download link and I will download the file for you.');
});

bot.on('message', async (ctx) => {
  const message = ctx.message;
  
  // Check if the message contains a direct download link
  if (message.text && message.text.startsWith('http')) {
    try {
      // Download the file
      const response = await axios.get(message.text, { responseType: 'stream' });
      
      // Check file size
      const contentLength = response.headers['content-length'];
      const fileSizeMB = contentLength / (1024 * 1024); // Convert bytes to MB
      
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        ctx.reply(`Sorry, the file size exceeds the limit of ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }
      
      const fileName = `downloaded_file_${Date.now()}.pdf`; // Example: You can customize the file name
      
      // Create a writable stream and pipe the response data to it
      const fileStream = fs.createWriteStream(fileName);
      response.data.pipe(fileStream);
      
      // Wait for the file to finish downloading
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
      
      // Upload the file to the user who sent the link
      await ctx.replyWithDocument({ source: fileName });
      
      // Delete the downloaded file from the server
      fs.unlinkSync(fileName);
      
    } catch (error) {
      console.error('Error:', error);
      ctx.reply('Failed to download the file.');
    }
  }
});

// Start listening on the specified port
bot.startPolling(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
