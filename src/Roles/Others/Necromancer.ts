import {RoleBase} from "../Abstract/RoleBase";
import {generateInlineKeyboard} from "../../Game/playersButtons";

export class Necromancer extends RoleBase {
    roleName = 'Некромант ⚰';
    startMessageText = () => 'Ночью ты можешь выбрать роль мертвого для оставшейся части игры. ' +
        'Но выбирай мудро, так как ты не можешь выиграть как Некромант.'
    weight = () => 3;

    action = () => {
        const deadPlayers = Necromancer.game.players
            .filter(player => player !== this.player && !player.isAlive);
        if (!deadPlayers.length) return
        Necromancer.game.bot.sendMessage(
            this.player.id,
            'Чью роль ты хочешь взять?',
            {
                reply_markup: generateInlineKeyboard(deadPlayers)
            }
        ).then(msg => this.choiceMsgId = msg.message_id)
    }

    actionResolve = () => {
        if (!this.targetPlayer?.role) return;

        this.player.role = this.targetPlayer.role.createThisRole(this.player, this.player.role);

        this.targetPlayer = undefined;
    }
}