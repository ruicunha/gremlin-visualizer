
const denyRegex = /((?=(--))\2)/;
const safeSearchStringRegex = /^([.][\\*])?[A-Za-z0-9][.A-Za-z0-9_ -]*([.][\\*])?$/;

export function testRegex(input) {
    denyRegex.test(input);
    safeSearchStringRegex.test(input);
}


