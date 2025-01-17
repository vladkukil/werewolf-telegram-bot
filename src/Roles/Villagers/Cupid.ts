import {RoleBase} from "../index";
import {Player} from "../../Game";
import {generateInlineKeyboard} from "../../Game/playersButtons";
import {findPlayer} from "../../Game/findPlayer";
import {playerLink} from "../../Utils/playerLink";
import {specialConditionCupid} from "../../Utils/specialConditionTypes";
import {randomElement} from "../../Utils/randomElement";

export class Cupid extends RoleBase {
    readonly roleName = 'Купидон 🏹';

    readonly startMessageText = () => 'Сошел на землю в одних штанах, с луком и любовными стрелами... Выбери двух, '
        + 'кто будет любить друг друга до скончания века. Если один из них погибнет, другой умрет от печали.';

    readonly weight = () => 2;

    nightActionDone = false

    specialCondition: specialConditionCupid = {loversBound: false}

    targetPlayer2?: Player

    targets = () => Cupid.game.players.filter(player => player !== this.targetPlayer && player.isAlive)

    stealMessage = () => this.specialCondition.loversBound
        && 'Однако, ты видишь, что в колчане кончились любовные стрелы.'

    action = () => {
        this.targetPlayer2 = undefined
        if (!this.specialCondition.loversBound) this.loveArrowChoice()
        else this.doneNightAction()
    }

    loveArrowChoice = () => Cupid.game.bot.sendMessage(
        this.player.id,
        'Кого ты хочешь связать узами вечной любви?',
        {
            reply_markup: generateInlineKeyboard(this.targets(), false)
        }
    ).then(msg => this.actionMsgId = msg.message_id)

    handleChoice = (choice?: string) => {
        if (this.targetPlayer) {
            this.targetPlayer2 = findPlayer(choice, Cupid.game.players);
            this.targetPlayer2 && RoleBase.game.bot.editMessageText(
                `Выбор принят — ${playerLink(this.targetPlayer2)}.`,
                {message_id: this.actionMsgId, chat_id: this.player.id}
            ).then(this.doneNightAction)
        } else {
            this.targetPlayer = findPlayer(choice, Cupid.game.players)
            this.choiceMsgEditText().then(this.loveArrowChoice)
        }
    }

    actionResolve = async () => {
        if (this.specialCondition.loversBound) return
        this.specialCondition.loversBound = true
        if (!this.targetPlayer2) {
            if (!this.targetPlayer) this.targetPlayer = randomElement(this.targets())
            this.targetPlayer2 = randomElement(this.targets())
            if (!this.targetPlayer || !this.targetPlayer2) return
            await Cupid.game.bot.editMessageText(
                `Ты не успел сделать выбор, так что высшие силы сделали выбор за тебя. `
                + `${playerLink(this.targetPlayer)} и ${playerLink(this.targetPlayer2)} `
                + `теперь связаны любовью.`,
                {
                    chat_id: this.player.id,
                    message_id: this.actionMsgId
                }
            )
        }
        await this.targetPlayer?.loveBind(this.targetPlayer2)
    }
}
