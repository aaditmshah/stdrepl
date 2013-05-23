var nop = function () {};
var stdin = process.stdin;
var stdout = process.stdout;
var stdrepl = module.exports;

stdrepl.eval = nop;
stdrepl.tabsize = 4;
stdrepl.prompt = ">>";

stdrepl.setControl = setControl;
stdrepl.print = function (string) {
    stdout.write(string + "\n");
};

var index = 127, action = [nop], margin, cursor, line, history, current;
while (index) action.unshift(index-- > 32 ? print : nop);

setControl("C", exit);
setControl("D", exit);

setControl("I", function () {
    var tabsize = stdrepl.tabsize;
    print(new Array(tabsize + 1 - (cursor - margin) % tabsize).join(" "));
});

setControl("M", function () {
    current = line.slice(margin, cursor);
    index = history.push(current);
    stdout.write("\x1B[0K\n");
    stdrepl.eval(current);

    line = line.slice(cursor);
    var prompt = stdrepl.prompt;
    margin = cursor = prompt.length + 1;
    line = prompt + (line === " " ? "" : " ") + line;
    stdout.write(line + "\x1B[" + (cursor + 1) + "G");
});

setControl("[", function (key) {
    switch (key.slice(1)) {
    case "[3~":
        if (cursor < line.length) {
            var rest = line.slice(cursor + 1);
            line = line.slice(0, cursor) + rest;
            stdout.write("\x1B[0K\x1B[s" + rest + "\x1B[u");
        } break;
    case "[A":
        if (index) {
            if (index-- === history.length) current = line.slice(margin);
            line = line.slice(0, margin) + history[index];
            stdout.write("\x1B[2K\x1B[1G" + line);
            cursor = line.length;
        } break;
    case "[B":
        if (index < history.length) {
            var nextLine = ++index < history.length ? history[index] : current;
            line = line.slice(0, margin) + nextLine;
            stdout.write("\x1B[2K\x1B[1G" + line);
            cursor = line.length;
        } break;
    case "[C":
        if (cursor < line.length) {
            stdout.write(key);
            cursor++;
        } break;
    case "[D":
        if (cursor > margin) {
            stdout.write(key);
            cursor--;
        } break;
    case "OF":
        setCursor(line.length);
        break;
    case "OH":
        setCursor(margin);
        break;
    }
});

setControl("?", function () {
    if (cursor > margin) {
        var rest = line.slice(cursor);
        line = line.slice(0, --cursor) + rest;
        stdout.write("\x08\x1B[0K\x1B[s" + rest + "\x1B[u");
    }
});

stdin.on("data", function (key) {
    var code = key.charCodeAt(0);

    if (code !== 0x1B) {
        var length = key.length;
        for (var i = 0; i < length; i++)
            action[key.charCodeAt(i)](key.charAt(i));
    } else action[code](key);
});

setTimeout(function () {
    var prompt = stdrepl.prompt;
    margin = cursor = prompt.length + 1;
    stdout.write(line = prompt + " ");

    history = stdrepl.history || [];
    index = history.length;

    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
}, 0);

function setControl(char, handler) {
    action[char.charCodeAt(0) - 64 & 127] = handler;
}

function print(string) {
    var rest = line.slice(cursor);
    line = line.slice(0, cursor) + string + rest;
    stdout.write("\x1B[0K" + string + "\x1B[s" + rest + "\x1B[u");
    cursor += string.length;
}

function exit() {
    stdout.write("\n");
    process.exit(0);
}

function setCursor(position) {
    cursor = position++;
    stdout.write("\x1B[" + position + "G");
}
