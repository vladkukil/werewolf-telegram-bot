import {playerLink} from "../../Utils/playerLink";
import {Fool, RoleBase, Seer} from "../index";

export class Beholder extends RoleBase {
    roleName = 'Очевидец 👁';
    private seers = (): string[] => Beholder.game.players
        .filter(player => player.role instanceof Seer && !(player.role instanceof Fool))
        .map(player => playerLink(player))

    stealMessage = () => this.seers().length === 0
            ? 'Провидца нет!'
            : this.seers().length === 1
                ? `${this.seers()[0]} своим даром может спасти народ, защищай его!`
                : 'Провидцы: ' + this.seers().join(', ');

    startMessageText = () => `Ты знаешь, кто настоящий провидец, а не дурак... В общем это ` +
        'твоя единственная функция.\n' + this.stealMessage();
    weight = () => this.seers().length ? 4.5 : 2;
}