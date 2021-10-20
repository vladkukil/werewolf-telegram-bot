import {GameStage} from "./Game";

export const gameStageMsg = (stage: GameStage) => {
    switch (stage) {
        case "night":
            return 'Наступила ночь! Все простые смертные легли спать, игроки ночи - настало ваше время! \n' +
                'У вас есть 120 секунд...'
        case 'day':
            return 'Настал день... Время протестовать, делать заявления и сражаться за справедливость!';
    }
}