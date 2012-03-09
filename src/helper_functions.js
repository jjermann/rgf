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
};

function deepclone(o) {
    return (o && typeof(o) === 'object' ?
    function(t) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                t[p] = deepclone(o[p])
            }
        }
        return t
    }({}) : o)
}
