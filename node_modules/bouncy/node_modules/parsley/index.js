module.exports = function (stream, cb) {
    return new Parser(stream, cb);
};

function Parser (stream, cb) {
    var self = this;
    self.stream = stream;
    self.cb = cb;
    
    self._onData = function (buf) {
        self.execute(buf, 0, buf.length);
    };
    stream.on('data', self._onData);
    
    this.mode = 'begin';
}

Parser.prototype.execute = function (buf, start, len) {
    for (var i = start; i < len && i >= 0; ) {
        i = this.modes[this.mode].call(this, buf, i, len - i);
        if (i < 0) {
            this.stream.removeListener('data', this._onData);
            if (this.request) {
                var err = new Error('error parsing ' + this.mode);
                this.request.emit('error', err);
            }
            break;
        }
    }
};

Parser.prototype.modes = require('./lib/modes');
