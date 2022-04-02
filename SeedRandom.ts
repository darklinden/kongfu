/*
Copyright 2019 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

//
// The following constants are related to IEEE 754 limits.
//

const width = 256;        // each RC4 output is 0 <= x < 256
const chunks = 6;         // at least six RC4 outputs for each double
const digits = 52;        // there are 52 significant digits in a double
const startdenom = Math.pow(width, chunks);
const significance = Math.pow(2, digits);
const overflow = significance * 2;
const mask = width - 1;

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
class ARC4 {

    public i: number = 0;
    public j: number = 0;
    public S: number[] = [];

    constructor(k: number[]) {
        let t = 0;
        let keylen = k.length;
        let i = this.i = 0;
        let j = this.j = 0;
        let s: number[] = this.S = [];

        // The empty key [] is treated as [0].
        if (!keylen) { k = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) {
            s[i] = i++;
        }

        for (i = 0; i < width; i++) {
            s[i] = s[j = mask & (j + k[i % keylen] + (t = s[i]))];
            s[j] = t;
        }

        this.g(width);
    }

    // The "g" method returns the next (count) outputs as one number.
    public g(count: number) {
        // Using instance members instead of closure state nearly doubles speed.
        let t = 0;
        let r = 0;
        let i = this.i;
        let j = this.j
        let s = this.S;

        while (count--) {
            t = s[i = mask & (i + 1)];
            r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
        }

        this.i = i;
        this.j = j;
        return r;
        // For robust unpredictability, the function call below automatically
        // discards an initial batch of values.  This is called RC4-drop[256].
        // See http://google.com/search?q=rsa+fluhrer+response&btnI
    }
}

class Prng {
    // This function returns a random double in [0, 1) that contains
    // randomness in every bit of the mantissa of the IEEE 754 value.
    public static prng(arc4: ARC4) {
        var n = arc4.g(chunks), // Start with a numerator n < 2 ^ 48
            d = startdenom, //   and denominator d = 2 ^ 48.
            x = 0; //   and no 'extra last byte'.
        while (n < significance) { // Fill up all significant digits by
            n = (n + x) * width; //   shifting numerator and
            d *= width; //   denominator and generating a
            x = arc4.g(1); //   new least-significant-byte.
        }
        while (n >= overflow) { // To avoid rounding up, before adding
            n /= 2; //   last byte, shift everything
            d /= 2; //   right using integer math until
            x >>>= 1; //   we have exactly the desired bits.
        }
        return (n + x) / d; // Form the number within [0, 1).
    }

    public static int32(arc4: ARC4) { return arc4.g(4) | 0; }
    public static quick(arc4: ARC4) { return arc4.g(4) / 0x100000000; }
    public static double(arc4: ARC4) { return this.prng(arc4); }
}


export class SeedRandom {

    pool: number[] = [];
    key: number[] = [];

    //
    // When seedrandom.js is loaded, we immediately mix a few bits
    // from the built-in RNG into the entropy pool.  Because we do
    // not want to interfere with deterministic PRNG state later,
    // seedrandom will not call math.random on its own again after
    // initialization.
    //
    // mixkey(math.random(), pool);

    private _seed: string = null;
    public set seed(v: string) {
        this._seed = v;
    }

    public setSeed(v: string) {
        this._seed = v;
    }

    public get seed(): string {
        return this._seed;
    }

    //
    // copy()
    // Copies internal state of ARC4 to or from a plain object.
    //
    copy(f: ARC4, t: ARC4) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
    }

    //
    // flatten()
    // Converts an object tree to nested arrays of strings.
    //
    flatten(obj: string | any, depth: number): string[] | string {
        let result: string[] = [];
        const typ = (typeof obj);
        let prop;
        if (depth && typ == 'object') {
            for (prop in obj) {
                try {
                    result.push(this.flatten(obj[prop], depth - 1) as string);
                }
                catch (e) {
                }
            }
        }

        if (result instanceof Array && result.length) {
            return result;
        }

        if (typ == 'string') {
            return obj as string;
        }

        return obj + '\0';
    }

    //
    // mixkey()
    // Mixes a string seed into a key that is an array of integers, and
    // returns a shortened string seed that is equivalent to the result key.
    //
    mixkey(seed: string | string[], key: number[]): string {
        let stringseed = seed + '';
        let smear = 0;
        let j = 0;
        while (j < stringseed.length) {
            key[mask & j] =
                mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
        }
        return this.tostring(key);
    }

    //
    // tostring()
    // Converts an array of charcodes to a string
    //
    tostring(a: number[]): string {
        return String.fromCharCode.apply(0, a);
    }

    public random() {

        // Flatten the seed string or build one from local entropy if needed.
        this.mixkey(this.flatten(this.seed, 3), this.key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(this.key);

        // Mix the randomness into accumulated entropy.
        this.mixkey(this.tostring(arc4.S), this.pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return Prng.prng(arc4);
    }

    public int32() {

        // Flatten the seed string or build one from local entropy if needed.
        this.mixkey(this.flatten(this.seed, 3), this.key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(this.key);

        // Mix the randomness into accumulated entropy.
        this.mixkey(this.tostring(arc4.S), this.pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return Prng.int32(arc4);
    }

    public quick() {

        // Flatten the seed string or build one from local entropy if needed.
        this.mixkey(this.flatten(this.seed, 3), this.key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(this.key);

        // Mix the randomness into accumulated entropy.
        this.mixkey(this.tostring(arc4.S), this.pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return Prng.quick(arc4);
    }

    public double() {
        return this.random();
    }

    public range(from: number, to: number) {
        return from + (this.random() * (to - from));
    }

    public rangeInt(from: number, to: number) {
        return Math.floor(from + (this.random() * (to - from)));
    }

    constructor(seed: string) {
        this.seed = seed;
    }

    public static create(seed: string): SeedRandom {
        const sr = new SeedRandom(seed);
        return sr;
    }
}