class Nbt {
    public static text: string = ''
    public static eat(length: number) {
        Nbt.text = Nbt.text.substr(length)
    }
    public static parseObject() {
        const obj: any = {}
        if (Nbt.testCloseCurly()) {
            return obj
        }
        while (true) {
            const tagName = Nbt.parseKey()
            Nbt.eatColon()
            const value = Nbt.parseValue()
            obj[tagName] = value
            if (Nbt.testCloseCurly()) {
                break
            }
            Nbt.eatComma()
        }
        return obj
    }
    public static testIndexArray() {
        const match = Nbt.text.match(/\s*\d+\s*:/)
        if (match) {
            if (match) {
                Nbt.eat(match[0].length)
                return true;
            }
        }
        return false
    }
    public static testTypeArray() {
        const match = Nbt.text.match(/^\s*[ILB]\s*;/)
        if (match) {
            if (match) {
                Nbt.eat(match[0].length)
                return true;
            }
        }
        return false
    }
    public static parseArray() {
        const array: any[] = []
        if (Nbt.testCloseSquare()) {
            return array
        }
        while (true) {
            Nbt.testIndexArray()
            Nbt.testTypeArray()
            if (Nbt.testBeginSquare()) {
                array.push(Nbt.parseObject())
            } else {
                array.push(Nbt.parseValue())
            }
            if (Nbt.testCloseSquare()) {
                break
            }
            Nbt.eatComma()
        }
        return array
    }
    public static eatColon() {
        const match = Nbt.text.match(/^\s*:/)
        if (match) {
            Nbt.eat(match[0].length)
            return;
        }
        throw new Error('lack of colon')
    }
    public static eatComma() {
        const match = Nbt.text.match(/^\s*,/)
        if (match) {
            Nbt.eat(match[0].length)
            return;
        }
        throw new Error('lack of comma')
    }
    public static testBeginCurly() {
        const match = Nbt.text.match(/^\s*{/)
        if (match) {
            Nbt.eat(match[0].length)
            return true;
        }
        return false
    }
    public static testCloseCurly() {
        const match = Nbt.text.match(/^\s*}/)
        if (match) {
            Nbt.eat(match[0].length)
            return true
        }
        return false
    }
    public static testBeginSquare() {
        const match = Nbt.text.match(/^\s*\[/)
        if (match) {
            Nbt.eat(match[0].length)
            return true
        }
        return false
    }
    public static testCloseSquare() {
        const match = Nbt.text.match(/^\s*\]/)
        if (match) {
            Nbt.eat(match[0].length)
            return true
        }
        return false
    }
    public static parseKey() {
        const match = Nbt.text.match(/^\s*([a-z][a-z0-9]*)/i)
        if (match) {
            const [_, key] = match
            Nbt.eat(_.length)
            return key
        }
        throw new Error(`Property name is invalid at "${Nbt.text.slice(0, 15)}"`)
    }
    public static parseValue() {
        if (Nbt.testBeginCurly()) {
            return Nbt.parseObject()
        }
        if (Nbt.testBeginSquare()) {
            return Nbt.parseArray()
        }
        const match = Nbt.text.match(/^\s*([0-9a-zA-Z_\-\$\.]+)|^\s*("(?:\\\"|\\\\|[^\\\\])*?")|^\s*(\'(?:\\\"|\\\\|[^\\\\])*?')/)
        if (match) {
            const [_, bare, double, single] = match
            Nbt.eat(_.length)
            if (bare) {
                return bare
            }
            if (double) {
                return double.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\\"/g, '"')
            }
            if (single) {
                return single.slice(1, -1)
            }
        }
        throw new Error(`value is invalid at "${Nbt.text.slice(0, 15)}"`)
    }
}

export default function mojangParser(text: string) {
    Nbt.text = text
    if (Nbt.testBeginCurly()) {
        return Nbt.parseObject() 
    }
    throw new Error('expect an object')
}