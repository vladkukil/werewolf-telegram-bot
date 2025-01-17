import {Game,Player} from "../../Game";
import {playerLink} from "../../Utils/playerLink";
import {GuardianAngel, Martyr, Suicide} from "../index";
import {specialConditionType} from "../../Utils/specialConditionTypes";

export type DeathType = 'loverDeath' | 'lover_betrayal' | 'harlotDeath' | 'shotByGunner' | 'runOutOfSnow'; // Harlot

export abstract class RoleBase {
    constructor(readonly player: Player, previousRole?: RoleBase) {
        this.previousRole = previousRole;
    }

    static game: Game

    abstract readonly roleName: string
    abstract readonly weight: () => number
    readonly roleIntroductionText = () => `Ты ${this.roleName}!`;
    abstract readonly startMessageText: () => string

    readonly previousRole?: RoleBase;

    readonly killMessage?: () => {
        text: {
            toChat: (deadPlayer: Player) => string,
            toTarget: string,
        }
        gif: string
    }

    readonly actionAnnouncement?: () => {
        message: string,
        gif: string
    }

    stealMessage?: () => string | false;
    findAllies?: () => Player[]
    sendAlliesMessage?: (notify?: boolean) => Promise<void>

    readonly action?: () => void
    readonly actionResolve?: () => Promise<void>
    readonly actionResult?: () => Promise<void>
    readonly handleChoice?: (choice?: string) => void

    targetPlayer?: Player

    actionMsgId?: number
    voteMsgId?: number

    specialCondition?: specialConditionType;

    nightActionDone?: boolean

    readonly originalHandleDeath = this.handleDeath;

    readonly onKilled = async (killer?: Player, type?: DeathType): Promise<void> => {
        if (!this.player.isAlive) return;
        if (RoleBase.game.players.find(p =>
            p.role instanceof Martyr
            && p.role.specialCondition.protectedPlayer === this.player
            && p.role.protectedPlayerKiller === killer)) return
        if (await this.handleDeath(killer, type)) {
            /*type !== 'loverDeath' && */
            this.movePlayer();
            await this.killLover('loverDeath')
        }
    }

    readonly killLover = async (type: DeathType) => {
        if (!this.player.lover) return

        if (type !== 'loverDeath')
            this.player.lover.lover = undefined;

        await this.player.lover.role?.onKilled(this.player, type);
    }

    readonly sendLoverMessage = async (newLover: Player) => {
        newLover.lover && await RoleBase.game.bot.sendAnimation(
            newLover.id,
            'https://media.giphy.com/media/VgU9D8avczJWJi08dT/giphy.gif',
            {
                caption: `Ты был(а) поражен(а) любовью. ${playerLink(newLover.lover)} навсегда в твоей памяти ` +
                    'и любовь никогда не погаснет в твоем сердце... Ваша цель выжить! Если один из вас погибнет, ' +
                    'другой умрет из-за печали и тоски.'
            }
        )
    }

    readonly handleGuardianAngel = async (killer: Player) => {
        const guardianAngelPlayer = killer.role?.targetPlayer?.guardianAngel;
        if (guardianAngelPlayer
            && guardianAngelPlayer.role instanceof GuardianAngel
            && killer.role?.targetPlayer) { // Дополнительная проверка нужна для доступа к полям GuardianAngel
            await RoleBase.game.bot.sendMessage(
                killer.id,
                `Придя домой к ${playerLink(killer.role.targetPlayer)}, ` +
                `у дверей ты встретил ${guardianAngelPlayer.role.roleName}, ` +
                'и тебя вежливо попросили свалить. Ты отказался, потому тебе надавали лещей и ты убежал.'
            )

            await RoleBase.game.bot.sendMessage(
                killer.role.targetPlayer.id,
                `${guardianAngelPlayer.role.roleName} наблюдал за тобой этой ночью и защитил тебя от зла!`
            )

            let ending: string = '';
            if (guardianAngelPlayer.role.numberOfAttacks)
                ending = ' Снова!'

            await RoleBase.game.bot.sendMessage(
                guardianAngelPlayer.id,
                `С выбором ты угадал, на ` +
                `${playerLink(killer.role.targetPlayer)} действительно напали! Ты спас ему жизнь!`
                + ending
            )

            guardianAngelPlayer.role.numberOfAttacks++;
        }
    }

    doneNightAction = () => {
        if (RoleBase.game.stage === 'night') {
            this.nightActionDone = true;
            if (!RoleBase.game.players
                .find(p => p.isAlive && p.role?.nightActionDone === false && !p.daysLeftToUnfreeze))
                RoleBase.game.setNextStage()
        }
    }

    movePlayer = () => {
        RoleBase.game.players.push(...RoleBase.game.players.splice(
            RoleBase.game.players.indexOf(this.player), 1)); // Delete current player and push it to the end
    }

    async handleDeath(killer?: Player, type?: DeathType): Promise<boolean> {
        if (type === 'loverDeath') {
            killer?.role && await RoleBase.game.bot.sendMessage(
                RoleBase.game.chatId,
                `Бросив взгляд на мертвое тело ${playerLink(killer)}, ` +
                `${playerLink(this.player)} падает на колени и рыдает. ` +
                `${playerLink(this.player)}, не выдерживая боли, хватает ближайший пистолет и ` +
                (this.player.role instanceof Suicide
                    ? 'перед тем, как нажать на курок, его сердце останавливается от горя! ' +
                    'Он не успевает покончить с собой!'
                    : 'выстреливает в себя...') +
                `\n${playerLink(this.player)} был(а) *${this.roleName}*.`
            )

            // new message for players if their lover died
        } else if (type === 'lover_betrayal') {
            await RoleBase.game.bot.sendMessage(
                RoleBase.game.chatId,
                'Жители деревни просыпаются на следующее утро и обнаруживают, ' +
                `что ${playerLink(this.player)} покончил(а) с собой прошлой ночью. ` +
                'Возле остывающего тела лежит недописанное любовное письмо.'
            )

            killer && await RoleBase.game.bot.sendMessage(
                killer.id,
                'Поскольку ты влюбляешься в другого(ую), ' +
                `${playerLink(this.player)} должен(на) покинуть тебя. ` +
                'Ты расстаешься с ним(ней), больше не заботясь о его(ее) благополучии.'
            )
        } else if (killer?.role) {
            if (type === 'shotByGunner')
                killer.role.actionAnnouncement && await RoleBase.game.bot.sendAnimation(
                    RoleBase.game.chatId,
                    killer.role.actionAnnouncement().gif, {caption: killer.role.actionAnnouncement().message}
                )
            else if (killer.role.killMessage) {
                await RoleBase.game.bot.sendMessage(
                    RoleBase.game.chatId,
                    killer.role.killMessage().text.toChat(this.player)
                );

                await RoleBase.game.bot.sendAnimation(
                    this.player.id,
                    killer.role.killMessage().gif,
                    {
                        caption: killer.role.killMessage().text.toTarget
                    }
                );
            }
        } else if (!killer) {
            await RoleBase.game.bot.sendMessage(
                RoleBase.game.chatId,
                `Жители отдали свои голоса в подозрениях и сомнениях... \n`
                + `${playerLink(this.player, true)} мёртв!`
            )
        }
        this.player.isAlive = false;
        return true;
    }

    choiceMsgEditText = (targetPlayer = this.targetPlayer) => RoleBase.game.bot.editMessageText(
        `Выбор принят — ${targetPlayer
            ? playerLink(targetPlayer)
            : 'Пропустить'}.`,
        {
            message_id: this.actionMsgId,
            chat_id: this.player.id,
        }
    )

    createThisRole = (player: Player, previousRole?: RoleBase): RoleBase =>
        new (this.constructor as any)(player, previousRole);
}
