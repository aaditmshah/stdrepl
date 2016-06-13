var wait = require('wait.for');
var nop = function () {
};
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

var commandExecutionInProgress = false;
var _executeCommandSync = function () {
	if (commandExecutionInProgress) {
		return;
	}
	cursor = line.length;
	stdout.write("\x1B[" + (cursor + 1) + "G");
	commandExecutionInProgress = true;
	current = line.slice(margin, cursor);
	index = history.push(current);
	stdout.write("\x1B[0K\n");

	var args = stdrepl.eval.toString().match(/^\s*function\s+(?:\w*\s*)?\((.*?)\)/);
	args = args ? (args[1] ? args[1].trim().split(/\s*,\s*/) : []) : null;

	if (args.length == 2) {
		wait.for(stdrepl.eval, current);
	} else {
		stdrepl.eval();
	}

	line = line.slice(cursor);
	var prompt = stdrepl.prompt;
	prompt = prompt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
	margin = cursor = prompt.length + 1;
	line = prompt + (line === " " ? "" : " ") + line;
	stdout.write(stdrepl.prompt + "\x1B[" + (cursor + 1) + "G");
	commandExecutionInProgress = false;
};

setControl("M", function () {
	wait.launchFiber(_executeCommandSync);
});

setControl("[", function (key) {
	switch (key.slice(1)) {
		case "[3~":
			if (cursor < line.length) {
				var rest = line.slice(cursor + 1);
				line = line.slice(0, cursor) + rest;
				stdout.write("\x1B[0K\x1B[s" + rest + "\x1B[u");
			}
			break;
		case "[A":
			if (index) {
				if (index-- === history.length) current = line.slice(margin);
				line = line.slice(0, margin) + history[index];
				stdout.write("\x1B[2K\x1B[1G" + stdrepl.prompt + " " + history[index]);
				cursor = line.length;
			}
			break;
		case "[B":
			if (index < history.length) {
				var nextLine = ++index < history.length ? history[index] : current;
				line = line.slice(0, margin) + nextLine;
				stdout.write("\x1B[2K\x1B[1G" + stdrepl.prompt + " " + nextLine);
				cursor = line.length;
			}
			break;
		case "[C":
			if (cursor < line.length) {
				stdout.write(key);
				cursor++;
			}
			break;
		case "[D":
			if (cursor > margin) {
				stdout.write(key);
				cursor--;
			}
			break;
		case "OF":
			setCursor(line.length);
			break;
		case "OH":
			setCursor(margin);
			break;
	}
});

setControl("A", function() {
    var prompt = stdrepl.prompt;
    prompt = prompt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    cursor = prompt.length + 1;
	stdout.write("\x1B[" + (cursor + 1) + "G");
    //console.log(cursor);
});

setControl("U", function() {
    stdout.write("\x1B[2K\x1B[1G");
    stdout.write(stdrepl.prompt + " ");
	var prompt = stdrepl.prompt;
	prompt = prompt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
	cursor = prompt.length + 1;
    line = "";
    current = "";
	stdout.write(stdrepl.prompt + "\x1B[" + (cursor + 1) + "G");
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
	prompt = prompt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
	margin = cursor = prompt.length + 1;
	line = prompt + " ";
	stdout.write(stdrepl.prompt + " ");

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
