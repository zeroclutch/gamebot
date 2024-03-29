class CardDeck {
    constructor() {
        this.EMOJIS = Object.freeze({
            'Aclubs': '985732364472815677',
            'Adiamonds': '985732363252301844',
            'Jdiamonds': '985732144519331872',
            'Kdiamonds': '985732145945399306',
            'Qdiamonds': '985732147769909299',
            '8diamonds': '985732148776534016',
            'Tdiamonds': '985732150391345192',
            '9diamonds': '985732151418966046',
            '5diamonds': '985732152509468733',
            '7diamonds': '985732153847447602',
            '6diamonds': '985732154724081666',
            '2diamonds': '985732156468912128',
            '4diamonds': '985732157534240808',
            '3diamonds': '985732159321026591',
            'Jclubs': '985732160424128574',
            'Kclubs': '985732162110246942',
            'Qclubs': '985732163246882849',
            '8clubs': '985732164442292277',
            'Tclubs': '985732165847375912',
            '9clubs': '985732166883348490',
            '5clubs': '985732168087121940',
            '7clubs': '985732169341227019',
            '6clubs': '985732170809233408',
            '2clubs': '985732172231098431',
            '4clubs': '985732173644570684',
            '3clubs': '985732175125164113',
            'Jhearts': '985732176769335386',
            'Khearts': '985732178220572713',
            'Qhearts': '985732179663388692',
            '8hearts': '985732181265625188',
            'Thearts': '985732182574239754',
            '9hearts': '985732183639601152',
            '5hearts': '985732184738517132',
            '7hearts': '985732185623506965',
            '6hearts': '985732187187990638',
            '2hearts': '985732188274323466',
            '4hearts': '985732189910081616',
            '3hearts': '985732190912524328',
            'Jspades': '985732191843659796',
            'Kspades': '985732193085169694',
            'Qspades': '985732194335084564',
            '8spades': '985732195299762266',
            'Tspades': '985732196423835648',
            '9spades': '985732197426286682',
            '5spades': '985732198684585984',
            '7spades': '985732199653466262',
            '6spades': '985732200710438922',
            '2spades': '985732201943556096',
            '4spades': '985732203227000902',
            '3spades': '985732204527255563',
            'Aspades': '985732206003646474',
            'Ahearts': '985732207605841930',
            'CardBack': '985786973597868142',
        })
    }

    resolveName(name) {
        return this.EMOJIS[name]
    }
}

export default CardDeck