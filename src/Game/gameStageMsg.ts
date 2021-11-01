import {Game} from "./Game";

export const gameStageMsg = (game: Game) => {
    switch (game.stage) {
        case "night":
            return 'Наступила ночь! Все простые смертные легли спать, игроки ночи - настало ваше время! \n' +
                `У вас есть ${120} секунд...`
        case 'day':
            return 'Настал день... Время протестовать, делать заявления и сражаться за справедливость! \n' +
                `У вас есть ${120} секунд...`;
        case 'lynch':
            const activeMonarchs = game.lynch?.getActiveMonarchs();
            return activeMonarchs && activeMonarchs.length
                ? `${activeMonarchs[0].role?.roleName} раскрылся, так что он решит, кто умрёт сегодня!`
                : 'Все селяне пришли на городское собрание, чтобы сделать выбор, кого же будут сегодня казнить!\n' +
                `Есть ${120} секунд, чтобы сделать выбор!`;
        default:
            return 'gameStage default case'
    }
}