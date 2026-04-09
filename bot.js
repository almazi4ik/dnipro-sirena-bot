const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

// ВСТАВЬ СВОЙ НОВЫЙ ТОКЕН (который получил от @BotFather)
const BOT_TOKEN = '8371342098:AAFndPQTg6LEMSIXy-Bfw7SFpPD5tNhKXN8';
const CHANNEL_ID = '@dnipro_sirena_off';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });
let lastState = null;

if (fs.existsSync('lastState.json')) {
    lastState = JSON.parse(fs.readFileSync('lastState.json', 'utf8'));
}

function getTime() {
    return new Date().toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Kiev'
    });
}

async function checkAlerts() {
    try {
        const response = await axios.get('https://devs.alerts.in.ua/v1/alerts/active.json');
        const data = response.data;
        
        const isActive = data.alerts?.some(a => 
            a.location_title === 'Дніпропетровська область' ||
            a.location_title?.includes('Дніпро')
        ) || false;
        
        if (lastState === null || isActive !== lastState.isActive) {
            const time = getTime();
            let message = '';
            
            if (isActive) {
                message = `⚠️ Тривога в Дніпрі ⚠️\n\n🕒 ${time}\n\nШвидко в укриття.\nЗберігай спокій. 🇺🇦`;
            } else if (lastState !== null) {
                message = `✅ Відбій тривоги ✅\n\n🕒 ${time}\n\nМожна виходити.\nБережіть себе! 🇺🇦`;
            }
            
            if (message) {
                await bot.sendMessage(CHANNEL_ID, message);
                console.log(`[${time}] ${isActive ? 'ТРИВОГА' : 'ВІДБІЙ'}`);
            }
            
            lastState = { isActive, time };
            fs.writeFileSync('lastState.json', JSON.stringify(lastState));
        }
    } catch (error) {
        console.error('Помилка:', error.message);
    }
}

console.log('✅ Бот запущено!');
checkAlerts();
setInterval(checkAlerts, 30000);
