import {DeathType, RoleBase} from "../Abstract/RoleBase";
import {generateInlineKeyboard} from "../../Game/playersButtons";
import {wolfTeam} from "../../Utils/teams";
import {findPlayer} from "../../Game/findPlayer";
import {GuardianAngel} from "../Villagers/GuardianAngel";
import {Beauty} from "../Villagers/Beauty";
import {highlightPlayer} from "../../Utils/highlightPlayer";
import {Player} from "../../Player/Player";
import {SerialKiller} from "../Others/SerialKiller";

type DecisionType = 'kill' | 'protect';

export class FallenAngel extends RoleBase {
    roleName = 'Падший ангел 👼🐺';
    startMessageText = () => 'Боль пробегает по твоему телу, ' +
        'когда твои белые крылья становятся черными. ' +
        'Сквозь боль трансформации ты борешься с собой и с тем злом, ' +
        'которое пытается тобой овладеть... ' +
        'Несколько часов - и все кончено. ' +
        'Ты встаешь, чтобы посмотреть на себя: ' +
        'ничего не осталось от твоей прежней божественной красоты. ' +
        'Ты стал Падшим Ангелом, союзником волков.'
    weight = () => -20; // can't drop at the start of the game anyway

    nightActionDone = false

    killOrProtect?: DecisionType;

    numberOfAttacks: number = 0;


    action = () => {
        this.targetPlayer = undefined;
        this.numberOfAttacks = 0;
        if (!this.killOrProtect)
            FallenAngel.game.bot.sendMessage(
                this.player.id,
                'Что ты хочешь сегодня сделать?',
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: 'Убить',
                                callback_data: JSON.stringify({type: 'role', choice: 'kill'})
                            }],
                            [{
                                text: 'Защитить',
                                callback_data: JSON.stringify({type: 'role', choice: 'protect'})
                            }],
                            [{
                                text: 'Пропустить',
                                callback_data: JSON.stringify({type: 'role', choice: 'skip'})
                            }],
                        ]
                    }
                }
            ).then(msg => this.choiceMsgId = msg.message_id)
        else {
            if (this.killOrProtect === 'kill') {
                FallenAngel.game.bot.sendMessage(
                    this.player.id,
                    'Кого ты хочешь сегодня убить?',
                    {
                        reply_markup: generateInlineKeyboard(FallenAngel.game.players
                            .filter(player => player !== this.player
                                && player.isAlive
                                && !(wolfTeam.find(wolfTeamPlayer => player.role instanceof wolfTeamPlayer))))
                    }
                ).then(msg => this.choiceMsgId = msg.message_id)
            } else {
                FallenAngel.game.bot.sendMessage(
                    this.player.id,
                    'Кого ты хочешь сегодня защитить?',
                    {
                        reply_markup: generateInlineKeyboard(FallenAngel.game.players
                            .filter(player => player !== this.player
                                && player.isAlive
                                && wolfTeam.find(wolfTeamPlayer => player.role instanceof wolfTeamPlayer)))
                    }
                ).then(msg => this.choiceMsgId = msg.message_id)
            }
        }
    }

    actionResolve = () => {
        if (!this.targetPlayer) return

        if (this.killOrProtect === 'kill')
            if (this.targetPlayer.guardianAngel?.role instanceof GuardianAngel) {
                this.handleGuardianAngel(this.player);
                return;
            } else if (this.targetPlayer.role instanceof Beauty && this.targetPlayer.lover !== this.player)
                this.loveBind(this.targetPlayer)
            else
                this.targetPlayer.role?.onKilled(this.player);
        else // protect
            this.targetPlayer.guardianAngel = this.player;

        this.killOrProtect = undefined; // в таком случае он должен убивать после совы
    }

    actionResult = () => {
        if (!this.targetPlayer?.role) return;

        if (!this.numberOfAttacks) {
            GuardianAngel.game.bot.sendMessage(
                this.player.id,
                `Ты защищал волка ${highlightPlayer(this.targetPlayer)} сегодня ночью, ` +
                `но с ним ничего не случилось...`
            )
        }
    }

    handleChoice = (choice?: string) => {
        if (choice === 'kill' || choice === 'protect') {
            this.killOrProtect = choice;
            this.choiceMsgEditText();
            this.player.role?.action && this.player.role?.action();
        } else {
            this.targetPlayer = findPlayer(choice, FallenAngel.game.players);
            super.choiceMsgEditText();
            this.doneNightAction();
        }
    }

    handleDeath(killer?: Player, type?: DeathType): boolean {
        if (killer?.role instanceof SerialKiller) {
            FallenAngel.game.bot.sendMessage(
                this.player.id,
                killer.role.killMessageDead
            )

            FallenAngel.game.bot.sendMessage(
                FallenAngel.game.chatId,
                `Ночью ангел ${highlightPlayer(this.player)} раз и навсегда пытался спасти от маньяка ` +
                ` дерев... Стоп что?! Волков?! ` +
                'А ангелок-то оказался падшим! ' +
                `В общем *${this.roleName}* пытался помочь волкам, ` +
                `но маньяк отрезал ${highlightPlayer(this.player)} его чёрные крылья! ` +
                'Неужто никто в этой деревне не сможет справиться с этим дьяволом во плоти... '
            )

            this.player.isAlive = false;
            return true;
        } else
            return super.handleDeath(killer, type);
    }

    choiceMsgEditText = () => {
        FallenAngel.game.bot.editMessageText(
            `Выбор принят: ${this.killOrProtect === 'kill'
                ? 'Убить'
                : this.killOrProtect === 'protect'
                    ? 'Защитить'
                    : 'Пропустить'}.`,
            {
                message_id: this.choiceMsgId,
                chat_id: this.player.id,
            }
        )
    }
}
