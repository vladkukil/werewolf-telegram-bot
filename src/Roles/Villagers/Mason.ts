import {playerLink} from "../../Utils/playerLink";
import {DeathType, Player} from "../../Game";
import {RoleBase, Thief} from "../index";

export class Mason extends RoleBase {
    findAllies = () => Mason.game.players.filter(otherPlayer =>
        otherPlayer.role instanceof Mason
        && otherPlayer !== this.player
        && otherPlayer.isAlive
    )

    sendAlliesMessage = async (notify: boolean = false): Promise<void> => {
        const allies = this.findAllies();

        if (notify) {
            let notificationText;
            if (this.player.role?.previousRole instanceof Thief && this.player.role.targetPlayer)
                notificationText = `Странно, ${playerLink(this.player)} пришёл на собрание ` +
                    `каменщиков вместо ${playerLink(this.player.role.targetPlayer)}! ` +
                    `${playerLink(this.player.role.targetPlayer)} уволен за прогул!`
            else
                notificationText = `${playerLink(this.player)} пришёл на стройку по объявлению. ` +
                    `Да, опыта у него нет... но он закончил аж 8 классов! Встречайте нового камещика 🎉!`

            for (const ally of allies) {
                await Mason.game.bot.sendMessage(
                    ally.id,
                    notificationText
                )
            }
        }

        let alliesInfoText: string = '\n'

        if (!allies.length)
            alliesInfoText += 'Правда сегодня на смену ты пришёл один.'
        else {
            if (allies.length === 1)
                alliesInfoText += 'Твой напарник на стройке — '
            else
                alliesInfoText += 'Каменщики: '

            alliesInfoText += allies?.map(ally => playerLink(ally)).join(', ')
        }

        await Mason.game.bot.sendMessage(
            this.player.id,
            alliesInfoText
        )
    }

    roleName = 'Каменщик 👷';
    roleIntroductionText = () => ''
    startMessageText = () => `Тебе ничего не остается делать, кроме как идти и пахать на стройке, ` +
        `ведь ты ${this.roleName}.`
    weight = () => {
        const otherMasonsAmount = this.findAllies().length;
        return (otherMasonsAmount ? 3 : 1) + otherMasonsAmount;
    }

    async handleDeath(killer?: Player, type?: DeathType): Promise<boolean> {
        if (killer?.role && !type) {
            await Mason.game.bot.sendMessage(
                Mason.game.chatId,
                `Проснувшись, все находят тело ${playerLink(this.player)} под грудой ` +
                `камней, кровь разбрызгана повсюду. *${this.roleName}* мертв!`
            )

            killer?.role?.killMessage && await Mason.game.bot.sendAnimation(
                this.player.id,
                killer?.role?.killMessage().gif,
                {
                    caption: killer.role.killMessage().text.toTarget
                }
            )
            this.player.isAlive = false;
            return true;
        } else
            return super.handleDeath(killer, type);
    }
}