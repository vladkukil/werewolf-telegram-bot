const info =
    {
        villager: () => ({
            roleName: 'Селянин 👱',
            team: 'Селяне',
            weight: '1',
            winCondition: 'в живых не осталось волков, поджигателя и серийного убицы.',
        }),
        traitor: () => ({
            ...info.villager(),
            roleName: 'Предатель 🖕',
            weight: '-1',
            notes: [
                'Может выпасть, только если есть волк.',
                'Если в живых не остаётся ни одного волка, превращается в волка.',
                'Провидец видит его либо селянином(50%), либо волком(50%).',
            ],
        }),


        wolf: () => ({
            roleName: 'Волк 🐺',
            team: 'Волки',
            weight: '-10',
            nightAction: 'Может выбрать одного из игроков и попытаться его съесть.',
            winCondition: 'волков не меньше половины живых игроков.',
        }),
        lycan: () => ({
            ...info.wolf(),
            roleName: 'Ликан 🐺🌝',
            weight: 'Если есть провидец, то -12. Если нет провидца, то -10.',
        }),
    }
