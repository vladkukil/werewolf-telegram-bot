import {ForecasterBase} from "../Abstract/ForecasterBase";
import {highlightPlayer} from "../../Utils/highlightPlayer";
import {RoleBase} from "../Abstract/RoleBase";
import {Wolf} from "../Wolves and their allies/Wolf";

export class Detective extends ForecasterBase {
    roleName = 'Детектив 🕵️';
    roleIntroductionText = () => `${this.roleName}. `
    startMessageText = () => 'Ты можешь выбрать игрока днем, чтобы узнать его роль. ' +
        'Но волк узнает, кто ты, если ты выберешь его!'
    weight = () => 6;
    actionResolve = () => {
        if (!this.targetPlayer?.role) return;

        Detective.game.bot.sendMessage(
            this.player.id,
            `Твои выслеживания показали, что ${highlightPlayer(this.targetPlayer)} ` +
            `это ${this.forecastRoleName(this.targetPlayer.role)}.`
        )

    }

    forecastRoleName = (targetRole: RoleBase) => {
        if (targetRole instanceof Wolf)
            Detective.game.bot.sendMessage(
                targetRole.player.id,
                `Ты поймал что-то выискивающего ${highlightPlayer(this.player)}! Он ${this.roleName}!`
            )

        return targetRole.roleName;
    }
}