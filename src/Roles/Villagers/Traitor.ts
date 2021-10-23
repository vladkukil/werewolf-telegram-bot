import {Villager} from "./Villager";

export class Traitor extends Villager {
    roleName = 'Предатель 🖕';
    startMessageText = `Ты ${this.roleName}. Вот ты сейчас простой селянин, а убьют волков - станешь последним ` +
        `в их роде!`;
    weight = () => 0;
}