const symListeners = Symbol("emitterListeners");
export const emit = Symbol("emitterEmit");

export abstract class EventEmitter {
    public static readonly emitSymbol = emit;
    private readonly [symListeners] = new Map<string, [Array<(arg: any) => any>, Array<(arg: any) => any>]>();

    public on(event: string, cb: (arg: any) => any): this {
        const lm = this[symListeners];
        let lst = lm.get(event);
        if (!lst) {
            lm.set(event, lst = [[], []]);
        }
        lst[0].push(cb);
        return this;
    }

    public once(event: string, cb: (arg: any) => any): this {
        const lm = this[symListeners];
        let lst = lm.get(event);
        if (!lst) {
            lm.set(event, lst = [[], []]);
        }
        lst[0].push(cb);
        lst[1].push(cb);
        return this;
    }

    public off(event: string, cb: (arg: any) => any): this {
        const lm = this[symListeners];
        const lst = lm.get(event);
        if (!lst) {
            return this;
        }
        const p = lst[0].indexOf(cb);
        if (p !== -1) {
            lst[0].splice(p, 1);
        }
        return this;
    }

    protected [emit](event: string, arg?: any): number {
        const lm = this[symListeners];
        const lst = lm.get(event);
        if (!lst) {
            return 0;
        }

        const [ls, ols] = lst;
        let cnt = 0;
        for (const f of ls) {
            f.call(this, arg);
            cnt++;
        }
        if (ols.length) {
            for (const f of ols) {
                const p = ls.indexOf(f);
                if (p !== -1) {
                    ls.splice(p, 1);
                }
            }
            ols.length = 0;
        }
        return cnt;
    }
}
