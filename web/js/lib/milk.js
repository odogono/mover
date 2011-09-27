// https://github.com/pvande/Milk/blob/master/milk.coffee
// Milk is a simple, fast way to get more Mustache into your CoffeeScript and
// Javascript.
// 
// Mustache templates are reasonably simple -- plain text templates are
// sprinkled with "tags", which are (by default) a pair of curly braces
// surrounding some bit of content. A good resource for Mustache can be found
// [here](mustache.github.com).
var Expand, Find, Milk, Parse, TemplateCache, key;
var __slice = Array.prototype.slice;
TemplateCache = {};

// Tags used for working with data get their data by looking up a name in a
// context stack. This name corresponds to a key in a hash, and the stack is
// searched top to bottom for an object with given key. Dots in names are
// special: a single dot ('.') is "top of stack", and dotted names like 'a.b.c'
// do a chained lookups.
Find = function(name, stack, value) {
    var ctx, i, part, parts, _i, _len, _ref, _ref2;
    if (value == null) {
        value = null;
    }
    if (name === '.') {
        return stack[stack.length - 1];
    }
    _ref = name.split(/\./), name = _ref[0], parts = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
    for (i = _ref2 = stack.length - 1; _ref2 <= -1 ? i < -1 : i > -1; _ref2 <= -1 ? i++ : i--) {
        if (stack[i] == null) {
            continue;
        }
        if (!(typeof stack[i] === 'object' && name in (ctx = stack[i]))) {
            continue;
        }
        value = ctx[name];
        break;
    }
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        value = Find(part, [value]);
    }
    // If we find a function in the stack, we'll treat it as a method, and call it
    // with `this` bound to the element it came from. If a method returns a
    // function, we treat it as a lambda, which doesn't have a bound `this`.
    if (value instanceof Function) {
        value = (function(value) {
            return function() {
                var val;
                val = value.apply(ctx, arguments);
                return (val instanceof Function) && val.apply(null, arguments) || val;
            };
        })(value);
    }
    return value;
};

// Parsed templates are expanded by simply calling each function in turn.
Expand = function() {
    var args, f, obj, tmpl;
    obj = arguments[0], tmpl = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = tmpl.length; _i < _len; _i++) {
            f = tmpl[_i];
            _results.push(f.call.apply(f, [obj].concat(__slice.call(args))));
        }
        return _results;
    })()).join('');
};

// For parsing, we'll basically need a template string to parse. We do need to
// remember to take the tag delimiters into account for the cache -- different
// parse trees can exist for the same template string!
Parse = function(template, delimiters, section) {
    var BuildRegex, buffer, buildInterpolationTag, buildInvertedSectionTag, buildPartialTag, buildSectionTag, cache, content, contentEnd, d, error, escape, isStandalone, match, name, parseError, pos, sectionInfo, tag, tagPattern, tmpl, type, whitespace, _name, _ref, _ref2, _ref3;
    if (delimiters == null) {
        delimiters = ['{{', '}}'];
    }
    if (section == null) {
        section = null;
    }
    cache = (TemplateCache[_name = delimiters.join(' ')] || (TemplateCache[_name] = {}));
    if (template in cache) {
        return cache[template];
    }
    buffer = [];

    // We'll use a regular expression to handle tag discovery. A proper parser
    // might be faster, but this is simpler, and certainly fast enough for now.
    // Since the tag delimiters may change over time, we'll want to rebuild the
    // regex when they change.
    BuildRegex = function() {
        var tagClose, tagOpen;
        tagOpen = delimiters[0], tagClose = delimiters[1];
        return RegExp("([\\s\\S]*?)([" + ' ' + "\\t]*)(?:" + tagOpen + "\\s*(?:(!)\\s*([\\s\\S]+?)|(=)\\s*([\\s\\S]+?)\\s*=|({)\\s*(\\w[\\S]*?)\\s*}|([^0-9a-zA-Z._!={]?)\\s*([\\w.][\\S]*?))\\s*" + tagClose + ")", "gm");
    };
    tagPattern = BuildRegex();
    tagPattern.lastIndex = pos = (section || {
        start: 0
    }).start;

    // Useful errors should always be prefered - we should compile as much
    // relevant information as possible.
    parseError = function(pos, msg) {
        var carets, e, endOfLine, error, indent, key, lastLine, lastTag, lineNo, parsedLines, tagStart;
        (endOfLine = /$/gm).lastIndex = pos;
        endOfLine.exec(template);
        parsedLines = template.substr(0, pos).split('\n');
        lineNo = parsedLines.length;
        lastLine = parsedLines[lineNo - 1];
        tagStart = contentEnd + whitespace.length;
        lastTag = template.substr(tagStart + 1, pos - tagStart - 1);
        indent = new Array(lastLine.length - lastTag.length + 1).join(' ');
        carets = new Array(lastTag.length + 1).join('^');
        lastLine = lastLine + template.substr(pos, endOfLine.lastIndex - pos);
        error = new Error();
        for (key in e = {
            "message": "" + msg + "\n\nLine " + lineNo + ":\n" + lastLine + "\n" + indent + carets,
            "error": msg,
            "line": lineNo,
            "char": indent.length,
            "tag": lastTag
        }) {
            error[key] = e[key];
        }
        return error;
    };
    // As we start matching things, let's pull out our captures and build indices.
    while (match = tagPattern.exec(template)) {
        _ref = match.slice(1, 3), content = _ref[0], whitespace = _ref[1];
        type = match[3] || match[5] || match[7] || match[9];
        tag = match[4] || match[6] || match[8] || match[10];
        contentEnd = (pos + content.length) - 1;
        pos = tagPattern.lastIndex;
        isStandalone = (contentEnd === -1 || template.charAt(contentEnd) === '\n') && ((_ref2 = template.charAt(pos)) === void 0 || _ref2 === '' || _ref2 === '\r' || _ref2 === '\n');
        if (content) {
            buffer.push((function(content) {
                return function() {
                    return content;
                };
            })(content));
        }
        if (isStandalone && (type !== '' && type !== '&' && type !== '{')) {
            if (template.charAt(pos) === '\r') {
                pos += 1;
            }
            if (template.charAt(pos) === '\n') {
                pos += 1;
            }
        } else if (whitespace) {
            buffer.push((function(whitespace) {
                return function() {
                    return whitespace;
                };
            })(whitespace));
            contentEnd += whitespace.length;
            whitespace = '';
        }
        switch (type) {
        case '!':
            break;
        case '':
        case '&':
        case '{':
            buildInterpolationTag = function(name, is_unescaped) {
                return function(context) {
                    var value, _ref3;
                    if ((value = (_ref3 = Find(name, context)) != null ? _ref3 : '') instanceof Function) {
                        value = Expand.apply(null, [this, Parse("" + (value()))].concat(__slice.call(arguments)));
                    }
                    if (!is_unescaped) {
                        value = this.escape("" + value);
                    }
                    return "" + value;
                };
            };
            buffer.push(buildInterpolationTag(tag, type));
            break;
        case '>':
            buildPartialTag = function(name, indentation) {
                return function(context, partials) {
                    var partial;
                    partial = partials(name).toString();
                    if (indentation) {
                        partial = partial.replace(/^(?=.)/gm, indentation);
                    }
                    return Expand.apply(null, [this, Parse(partial)].concat(__slice.call(arguments)));
                };
            };
            buffer.push(buildPartialTag(tag, whitespace));
            break;
        case '#':
        case '^':
            sectionInfo = {
                name: tag,
                start: pos,
                error: parseError(tagPattern.lastIndex, "Unclosed section '" + tag + "'!")
            };
            _ref3 = Parse(template, delimiters, sectionInfo), tmpl = _ref3[0], pos = _ref3[1];
            sectionInfo['#'] = buildSectionTag = function(name, delims, raw) {
                return function(context) {
                    var parsed, result, v, value;
                    value = Find(name, context) || [];
                    tmpl = value instanceof Function ? value(raw) : raw;
                    if (!(value instanceof Array)) {
                        value = [value];
                    }
                    parsed = Parse(tmpl || '', delims);
                    context.push(value);
                    result = (function() {
                        var _i, _len, _results;
                        _results = [];
                        for (_i = 0, _len = value.length; _i < _len; _i++) {
                            v = value[_i];
                            context[context.length - 1] = v;
                            _results.push(Expand.apply(null, [this, parsed].concat(__slice.call(arguments))));
                        }
                        return _results;
                    }).apply(this, arguments);
                    context.pop();
                    return result.join('');
                };
            };
            sectionInfo['^'] = buildInvertedSectionTag = function(name, delims, raw) {
                return function(context) {
                    var value;
                    value = Find(name, context) || [];
                    if (!(value instanceof Array)) {
                        value = [1];
                    }
                    value = value.length === 0 ? Parse(raw, delims) : [];
                    return Expand.apply(null, [this, value].concat(__slice.call(arguments)));
                };
            };
            buffer.push(sectionInfo[type](tag, delimiters, tmpl));
            break;
        case '/':
            if (section == null) {
                error = "End Section tag '" + tag + "' found, but not in section!";
            } else if (tag !== (name = section.name)) {
                error = "End Section tag closes '" + tag + "'; expected '" + name + "'!";
            }
            if (error) {
                throw parseError(tagPattern.lastIndex, error);
            }
            template = template.slice(section.start, (contentEnd + 1) || 9e9);
            cache[template] = buffer;
            return [template, pos];
        case '=':
            if ((delimiters = tag.split(/\s+/)).length !== 2) {
                error = "Set Delimiters tags should have two and only two values!";
            }
            if (error) {
                throw parseError(tagPattern.lastIndex, error);
            }
            escape = /[-[\]{}()*+?.,\\^$|#]/g;
            delimiters = (function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = delimiters.length; _i < _len; _i++) {
                    d = delimiters[_i];
                    _results.push(d.replace(escape, "\\$&"));
                }
                return _results;
            })();
            tagPattern = BuildRegex();
            break;
        default:
            throw parseError(tagPattern.lastIndex, "Unknown tag type -- " + type);
        }
        tagPattern.lastIndex = pos != null ? pos : template.length;
    }
    if (section != null) {
        throw section.error;
    }
    if (template.length !== pos) {
        buffer.push(function() {
            return template.slice(pos);
        });
    }
    return cache[template] = buffer;
};

// ### Public API

// The exported object (globally `Milk` in browsers) forms Milk's public API:
Milk = {
    VERSION: '1.2.0',
    // Helpers are a form of context, implicitly on the bottom of the stack. This
    // is a global value, and may be either an object or an array.
    helpers: [],
    // Partials may also be provided globally.
    partials: null,

    // The `escape` method performs basic content escaping, and may be either
    // called or overridden with an alternate escaping mechanism.
    escape: function(value) {
        var entities;
        entities = {
            '&': 'amp',
            '"': 'quot',
            '<': 'lt',
            '>': 'gt'
        };
        return value.replace(/[&"<>]/g, function(ch) {
            return "&" + entities[ch] + ";";
        });
    },

    // Rendering is simple: given a template and some data, it populates the
    // template. If your template uses Partial Tags, you may also supply a hash or
    // a function, or simply override `Milk.partials`. There is no Step Three.
    render: function(template, data, partials) {
        var context;
        if (partials == null) {
            partials = null;
        }
        if (!((partials || (partials = this.partials || {})) instanceof Function)) {
            partials = (function(partials) {
                return function(name) {
                    if (!(name in partials)) {
                        throw "Unknown partial '" + name + "'!";
                    }
                    return Find(name, [partials]);
                };
            })(partials);
        }
        context = this.helpers instanceof Array ? this.helpers : [this.helpers];
        return Expand(this, Parse(template), context.concat([data]), partials);
    }
};

// Happy hacking!
if (typeof exports !== "undefined" && exports !== null) {
    for (key in Milk) {
        exports[key] = Milk[key];
    }
} else {
    this.Milk = Milk;
}