/*global require, module, atom, console, fruit:true, window*/
var jshint = require('jshint').JSHINT,
    fs = require('fs');

module.exports = {
    configDefaults: {
        showNoErrorsFoundMessage: true,
        jshintrcFilePath: '.jshintrc'
    },

    activate: function () {
        console.log('Fruit jshint activated');

        // Listen save on all editors
        atom.workspace.eachEditor(function (editor) {
            editor.onDidSave(function () {
                module.exports.convert(editor);
            });
        });

        // For first time
        var editor = atom.workspace.activePaneItem;
        if (editor) {
            module.exports.convert(editor);
        }

        // For commands
        atom.workspaceView.command("siddiq-jshint:convert", module.exports.convert(editor));
    },

    convert: function (editor) {
        if (editor.getGrammar().name !== 'JavaScript') {
            return;
        }

        // Create Panel
        var MessagePanelView = require('atom-message-panel').MessagePanelView,
            PlainMessageView = require('atom-message-panel').PlainMessageView,
            LineMessageView = require('atom-message-panel').LineMessageView;

        fruit = window.fruit || {};
        fruit.messages = fruit.messages || new MessagePanelView({
            title: 'JSHint output'
        });

        fruit.messages.clear();

        // Load .jshintrc file
        //var editor = atom.workspace.activePaneItem;
        var file = editor !== null ? editor.buffer.file : void 0;
        var jshintrcPath = '';
        var path = file.getPath();
        path = path.split('/');
        do {
            path.pop();
            var npath = path.join('/');
            if (fs.existsSync(npath + '/.jshintrc')) {
                jshintrcPath = npath + '/.jshintrc';
                break;
            }
        } while (path.length > 0);

        var spath = atom.config.get('siddiq-jshint.jshintrcFilePath'),
            spath0 = module.exports.configDefaults.jshintrcFilePath;
        if (spath !== spath0) {
            if (fs.existsSync(spath) && fs.lstatSync(path_string).isFile()) {
                jshintrcPath = spath;
            } else {
                fruit.messages.add(new PlainMessageView({
                    message: 'Invalid settings. ' + spath + ' not found.',
                    className: 'text-error'
                }));
            }
        }

        // JSHint
        var fileText = editor.getText();
        var jshintrc, options = {};
        if (jshintrcPath) {
            jshintrc = fs.readFileSync(jshintrcPath, 'utf-8');
            jshintrc = jshintrc.replace(/\/\/[^\n]*/g, '');
            options = JSON.parse(jshintrc);
        }

        if (jshint(fileText, options)) {
            fruit.messages.add(new PlainMessageView({
                message: 'No errors found',
                className: 'text-success'
            }));
            if (atom.config.get('siddiq-jshint.showNoErrorsFoundMessage')) {
                fruit.messages.attach();
            }
        } else {
            var out = jshint.data();
            var errors = out.errors;
            for (var j = 0; j < errors.length; j ++) {
                fruit.messages.add(new LineMessageView({
                    message: errors[j].reason + ' -> ' + errors[j].evidence,
                    file: file.getPath(),
                    line: errors[j].line,
                    character: errors[j].character,
                    preview: errors[j].evidence,
                    className: 'text-error'
                }));
            }
            fruit.messages.attach();
        }
        fruit.messages.add(new PlainMessageView({
            message: jshintrcPath ?
                ('jshintrc path: ' + jshintrcPath) :
                ('.jshintrc not found around ' + file.getPath() + ' or in any parent directory.'),
            className: 'text-info'
        }));

    }
};
