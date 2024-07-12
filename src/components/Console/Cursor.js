export default class Cursor {
    position;
    minPosition;
    
    constructor(promptLength) {
        this.position = promptLength;
        this.minPosition = promptLength;
    }

    getPosition() {
        return this.position;
    }

    reset () {
        this.position = this.minPosition;        
    }
    
    inc () {
        this.position++;
    }
 
    dec () {
        if(this.isValidMoveLeft()){
            this.position--;
        }
    }

    setPosition(position) {
        this.position = position + this.minPosition;
    }

    getEndPosition() {
        return this.position + 1;
    }

    moveLeft(terminal) {
        this.dec();
        terminal.write('\x1b[D'); //moveLeft
    }

    isValidMoveLeft() {
        return this.position > this.minPosition;
    }

    moveRight(terminal) {
        this.inc();
        terminal.write('\x1b[C'); //moveRight
    }

    isValidMoveRight(buffer) {
        return this.position < buffer.length + this.minPosition;
    }
    getCommand(buffer, data) {
        const commandLength = this.position - this.minPosition;
        return data ? `${buffer.slice(0, commandLength)}${data}${buffer.slice(commandLength)}` : `${buffer.slice(0, commandLength - 1)}${buffer.slice(commandLength)}`;

    }
}