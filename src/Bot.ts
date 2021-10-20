import {config} from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import {Game} from "./Game/Game";
import {initGame} from "./Game/commands/init"; // optimid
import {callbackHandle} from "./Game/commands/callbackHandle";
import {forceStart} from "./Game/commands/forceStart";
import {nextStage} from "./Game/commands/nextStage";

config({path: __dirname + '/./../.env'})
const tgToken = process.env.TG_TOKEN!
const herokuUrl = process.env.HEROKU_URL!

let bot: TelegramBot

if (process.env.NODE_ENV === 'production') {
    bot = new TelegramBot(tgToken);
    bot.setWebHook(herokuUrl + tgToken);

    // bot.getUpdates({ limit:0})
} else {
    bot = new TelegramBot(tgToken, {polling: true});
}

export type State = { game?: Game, } // fix maybe
let state: State = {}

initGame(bot, state)

callbackHandle(bot, state)
forceStart(bot, state)
nextStage(bot,state)