# Standard REPL #

An standard REPL for node.js to enable programmers to create interactive user interfaces.

## Installation ##

Standard REPL can be installed via [npm](https://npmjs.org/ "npm") by entering the following bash command:

```bash
npm install stdrepl
```

## Usage ##

Using `stdrepl` is a piece of cake. Learning by example, an echo prompt:

```javascript
var stdrepl = require("stdrepl");
stdrepl.eval = stdrepl.print;
```

The `stdrepl.eval` function is invoked every time the user enters a line. The `stdrepl.print` function prints a line to the REPL.

When the user presses `TAB` the REPL inserts upto `4` spaces by default. This number can be changed by changing `stdrepl.tabsize`.

By default every line of the REPL has the prefix `>>`. You may change it by changing the value of `stdrepl.prompt`.

Special actions can be assigned to control characters using the `stdrepl.setControl` function. For example:

```javascript
stdrepl.setControl("C", function () {
    // keyboard interrupt - do something
});
```

Now when the user presses `Ctrl + C` the above function will be executed.

That's all folks. Happy coding!
