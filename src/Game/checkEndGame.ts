import {Player} from "../Game";
import {
    ApprenticeSeer, Beholder, Blacksmith, ClumsyGuy, Cursed, Drunk, GuardianAngel, Gunner, Harlot, Martyr, Mason,
    Monarch, Oracle, Sandman, Seer, SerialKiller, Traitor, Villager, WiseElder, Wolf, WoodMan, WildChild, Beauty,
    JackOLantern, Pumpkin, Detective, Cupid, Princess, Mayor, Sorcerer, Prowler, Arsonist, Pacifist, FallenAngel,
} from "../Roles";
import {GameStage} from "./Game";

const villagers: Function[] = [
    ApprenticeSeer, Beholder, ClumsyGuy, Cursed, Drunk, GuardianAngel, Gunner, Harlot, Mason, Mayor, Monarch, Oracle,
    Seer, Traitor, Villager, WiseElder, WoodMan, Martyr, Sandman, Blacksmith, WildChild, Beauty, Detective, Cupid,
    Princess, Pacifist,
]
const wolfTeam: Function[] = [Wolf, FallenAngel, Sorcerer, Prowler]
const nonWolfKillers: Function[] = [SerialKiller, FallenAngel, Arsonist, JackOLantern]
const evil: Function[] = [Wolf, ...nonWolfKillers]

export type Win = 'villagers' | 'serialKiller' | 'wolves' | 'lovers' | 'suicide' | 'nobody' | 'jack' | 'arsonist'
export const checkEndGame = (players: Player[], stage: GameStage): undefined | { winners: Player[], type: Win } => {
    const wolvesTeamPlayers = players.filter(p => wolfTeam.find(wa => p.role instanceof wa))
    const villagersTeamPlayers = players.filter(p => villagers.find(v => p.role instanceof v))
    const alivePlayers = players.filter(p => p.isAlive)
    const aliveWolves = alivePlayers.filter(p => p.role instanceof Wolf)
    const aliveEvilPlayer = alivePlayers.find(p => evil.find(e => p.role instanceof e))
    const aliveJackPlayers = alivePlayers.filter(player => player.role instanceof JackOLantern);

    if (alivePlayers.length === 2 && alivePlayers[0].lover === alivePlayers[1]) {
        return {winners: alivePlayers.filter(player => player.lover), type: 'lovers'}
    }

    if (aliveJackPlayers.length
        && !alivePlayers.filter(p => !(p.role instanceof Pumpkin) && !(p.role instanceof JackOLantern)).length) {
        return {winners: players.filter(player => player.role instanceof JackOLantern), type: 'jack'}
    }

    if (!aliveEvilPlayer) {
        return {winners: villagersTeamPlayers, type: 'villagers'}
    }

    alivePlayers.find(p => p.role instanceof Gunner && p.role.specialCondition.ammo) && nonWolfKillers.push(Gunner)
    const aliveUniqueKillers = [...new Set(alivePlayers
        .filter(p => nonWolfKillers.find(k => p.role instanceof k))
        .map(p => p.role!.constructor))]
    aliveWolves.length && aliveUniqueKillers.push(Wolf)

    if (aliveUniqueKillers.length > 1) {
        if (alivePlayers.length > 2) return undefined
        else {
            if (aliveJackPlayers.length) return undefined;

            const wolf = players.find(p => p.role instanceof Wolf)
            const serialKiller = players.find(p => p.role instanceof SerialKiller)
            const gunner = players.find(p => p.role instanceof Gunner)
            const arsonist = players.find(p => p.role instanceof Arsonist)
            // const cowboy = players.filter(p => p.role instanceof Cowboy)
            // const puppetMaster = players.filter(p => p.role instanceof PuppetMaster)

            // if(puppetMaster) return puppetMaster

            if (wolf && arsonist) return {winners: wolvesTeamPlayers, type: 'wolves'}
            if ((wolf || arsonist) && serialKiller) return {winners: [serialKiller], type: 'serialKiller'}
            if ((wolf || serialKiller || arsonist) && gunner) {
                if (stage === 'night') return {winners: villagersTeamPlayers, type: 'villagers'}
                if (wolf) return {winners: wolvesTeamPlayers, type: 'wolves'}
                if (serialKiller) return {winners: [serialKiller], type: 'serialKiller'}
                if (arsonist) return {winners: [arsonist], type: 'arsonist'}
            }
            // if(cowboy && serialKiller) return []
            // if(cowboy && wolf) return [Math.random()>.3 wolf:cowboy]
        }
    }

    if (aliveWolves.length * 2 >= alivePlayers.length) {
        return {winners: wolvesTeamPlayers, type: 'wolves'}
    }

    if (alivePlayers.length < 3) {
        if (aliveEvilPlayer.role instanceof SerialKiller) return {winners: [aliveEvilPlayer], type: 'serialKiller'}
        else if (aliveEvilPlayer.role instanceof Arsonist) return {
            winners: players.filter(p => p.role instanceof Arsonist),
            type: 'arsonist'
        }
    }

    return undefined
}


export const setWinners = (winners: Player[], players: Player[]) => {
    winners.forEach(w => w.won = true)
    const lovers = players.map(player => player.lover);
    for (const lover of lovers) if (lover?.won && lover.lover) lover.lover.won = true;
    const sacrificedMartyrs = players.map(p => p.role).filter(r => (r instanceof Martyr) && r.diedForProtectedPlayer)
    for (const sm of sacrificedMartyrs) {
        if (sm) sm.player.won =
            sm instanceof Martyr
            && !!winners.find(p => p === sm.specialCondition.protectedPlayer)
    }
}