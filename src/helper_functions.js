function pathToArray(path) {
    if (path=="" || path==undefined) return [];
    else if (typeof path=='string') return path.split('.');
    else return path;
}

function extend(from,to) {
    for (var prop in to) {
        from[prop] = to[prop];
    };
    return from;
}

function deepClone(o) {
    return (o && typeof(o) === 'object' ?
    function(t) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                t[p] = deepClone(o[p])
            }
        }
        return t
    }({}) : o)
}

function compareArrays(a,b) {
    if (a==undefined && b==undefined) return true;
    else if (a==undefined || b==undefined) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
