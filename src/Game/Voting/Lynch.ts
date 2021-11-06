import {GameStage} from "../Game";
import {Monarch, Pacifist, Pumpkin, Suicide} from "../../Roles";
import {Player} from "../../Player/Player";
import {VotingBase} from "./VotingBase";

export class Lynch extends VotingBase {
    voteStage: GameStage = 'lynch'
    type = 'lynch'
    votePromptMessage = 'За кого ты хочешь проголосовать?'

    getVoters = () => {
        const activeMonarchs = this.getActiveMonarchs();
        return activeMonarchs.length
            ? activeMonarchs
            : this.game.players.filter(p => p.isAlive && !(p.role instanceof Pumpkin))
    }

    voteTargetCondition = (otherPlayer: Player) => otherPlayer.isAlive

    getActiveMonarchs = () => this.game.players
        .filter(player => player.isAlive && player.role instanceof Monarch && player.role.specialCondition.comingOut);

    getActivePacifists = () => this.game.players
        .filter(player => player.isAlive && player.role instanceof Pacifist && player.role.specialCondition.peace);

    handleVotingChoiceResult = () => {
        this.game.bot.sendMessage(
            this.game.chatId,
            `${this.votedPlayers.length} из ${this.getVoters().length} игроков проголосовало.`
        )
        if (this.votedPlayers.length === this.getVoters().length)
            this.game.setNextStage()
    }

    handleVoteResult(voteResult: Player[]) {
        if (this.getActivePacifists().length) return;

        if (voteResult.length === 1) {
            if (voteResult[0].role instanceof Suicide) {
                this.game.onGameEnd({winners: [voteResult[0]], type: 'suicide'})
                return true
            } else
                voteResult[0].role?.onKilled()
        } else
            this.game.bot.sendMessage(
                this.game.chatId,
                'Не удалось придти к одному решению! Расстроенная толпа расходится по домам...'
            )
    }
}
