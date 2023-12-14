// (function() {
var slice = [].slice;

function queue(parallelism) {
    var q,
        tasks = [],
        started = 0, // number of tasks that have been started (and perhaps finished)
        active = 0, // number of tasks currently being executed (started but not finished)
        remaining = 0, // number of tasks not yet finished
        popping, // inside a synchronous task callback?
        error = null,
        a_wait = noop,
        all;

    if (!parallelism) parallelism = Infinity;

    function pop() {
        while (popping = started < tasks.length && active < parallelism) {
            var i = started++,
                t = tasks[i],
                a = slice.call(t, 1);
            a.push(callback(i));
            ++active;
            t[0].apply(null, a);
        }
    }

    function callback(i) {
        return function (e, r) {
            --active;
            if (error != null) return;
            if (e != null) {
                error = e; // ignore new tasks and squelch active callbacks
                started = remaining = NaN; // stop queued tasks from starting
                notify();
            } else {
                tasks[i] = r;
                if (--remaining) popping || pop();
                else notify();
            }
        };
    }

    function notify() {
        if (error != null) a_wait(error);
        else if (all) a_wait(error, tasks);
        else a_wait.apply(null, [error].concat(tasks));
    }

    return q = {
        defer: function () {
            if (!error) {
                tasks.push(arguments);
                ++remaining;
                pop();
            }
            return q;
        },
        await: function (f) {
            a_wait = f;
            all = false;
            if (!remaining) notify();
            return q;
        },
        awaitAll: function (f) {
            a_wait = f;
            all = true;
            if (!remaining) notify();
            return q;
        }
    };
}
function noop() {}
export {queue}


//
//     queue.version = "1.0.7";
//     if (typeof define === "function" && define.amd) define(function() { return queue; });
//     else if (typeof module === "object" && module.exports) module.exports = queue;
//     else this.queue = queue;
// })();
