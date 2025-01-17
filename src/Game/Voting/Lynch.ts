import {GameStage} from "../Game";
import {Mayor, ClumsyGuy, Monarch, Pumpkin, Suicide, Pacifist} from "../../Roles";
import {Player} from "../../Game";
import {VotingBase} from "./VotingBase";
import {randomElement} from "../../Utils/randomElement";

export class Lynch extends VotingBase {
    voteStage: GameStage = 'lynch'
    type = 'lynch'
    votePromptMessage = 'За кого ты хочешь проголосовать?'

    getVoters = () => {
        const activeMonarchs = this.getActiveMonarchs()
        return activeMonarchs.length ? activeMonarchs : this.game.players
            .filter(p => p.isAlive && !(p.role instanceof Pumpkin))
    }

    voteTargetCondition = (otherPlayer: Player) => otherPlayer.isAlive

    getActiveMonarchs = () => this.game.players
        .filter(player => player.role instanceof Monarch && player.role.specialCondition.comingOut && player.isAlive);

    getActivatedPacifists = () => this.game.players
        .filter(player => player.role instanceof Pacifist && player.role.specialCondition.peace);

    defineTarget = async (voter: Player, target?: Player) => {
        if (target && voter.role instanceof ClumsyGuy && Math.random() < .5) {
            await this.game.bot.sendMessage(
                voter.id,
                'Кажется ты опять что-то напутала и отдала свой голос не за того...')
            return randomElement(this.game.players.filter(otherPlayer =>
                otherPlayer !== voter
                && otherPlayer !== target
                && this.voteTargetCondition(otherPlayer)))
        }
        return target
    }

    async startVoting() {
        if (this.getActivatedPacifists().length) {
            this.game.setNextStage();
            return;
        }

        await super.startVoting();
    }

    handleVotingChoiceResult = async () => {
        await this.game.bot.sendMessage(
            this.game.chatId,
            `${this.votedPlayers.length} из ${this.getVoters().length} игроков проголосовало.`
        )
        if (this.votedPlayers.length === this.getVoters().length) this.game.setNextStage()
    }

    calculateVoteWeight = (voter: Player) => (voter.role instanceof Mayor
        && voter.role.specialCondition.comingOut !== undefined) ? 2 : 1;

    async handleVoteResult(voteResult: Player[]) {
        if (this.getActivatedPacifists().length) {
            this.getActivatedPacifists()
                .forEach(pacifist => {
                    if (pacifist.role instanceof Pacifist)
                        pacifist.role.specialCondition.peace = false; // So the dead Pacifist can still skip lynch
                })
            return;
        }

        if (voteResult.length === 1) {
            if (voteResult[0].role instanceof Suicide) {
                await this.game.onGameEnd({winners: [voteResult[0]], type: 'suicide'})
                this.game.stopStage()
            } else {
                await voteResult[0].role?.onKilled()
            }
        } else {
            await this.game.bot.sendMessage(this.game.chatId,
                'Не удалось придти к одному решению! Расстроенная толпа расходится по домам...')
        }
    }
}
