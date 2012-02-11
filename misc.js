function extend(from,to) {
    for (var prop in to) {
        from[prop] = to[prop];
    };
    return from;
};

/*  Tree stuff */
function RGFNode(time) {
    this.properties=[];
    this.children=[];
    this.parent=null;
    this.index=null;
    this.position="";
    this.time=(time==undefined) ? -1 : +time;
};
function RGFProperty(name,argument,time) {
    this.name=name;
    this.argument=argument;
    this.time=(time==undefined) ? -1 : +time;
};
RGFNode.prototype.addNode=function(node) {
    node.parent=this;
    node.index=this.children.length;
    if (this.parent==null) {
        node.position=""+node.index;
    } else {
        node.position=this.position+"."+node.index;
    }
    this.children.push(node);
    return node;
}
RGFNode.prototype.addProp=function(property) {
    this.properties.push(property);
    return property;
}

/*  Old definition of position... */
RGFNode.prototype.descend = function(path) {
    if (!path.length) return this;
    if (path=="") path=[];
    if (typeof path=='string') path=path.split('.');
    return this.children[path[0]].descend(path.slice(1));
};

RGFNode.prototype.getDuration=function() {
    var duration=this.time;
    if (this.properties.length) duration=(this.properties[this.properties.length-1].time>duration) ? this.properties[this.properties.length-1].time : duration;
    
    for (var i=0; i<this.children.length; i++) {
        duration=Math.max(duration,this.children[i].getDuration());
    }
    
    return duration;
}

/*  needed to get eidogo's position. */
RGFNode.prototype.getEidogoPath = function() {
    var n = this,
        rpath = [],
        mn = 0;
    while (n && n.parent && n.parent.children.length == 1 && n.parent.parent) {
        mn++;
        n = n.parent;
    }
    rpath.push(mn);
    while (n) {
        if (n.parent && (n.parent.children.length > 1 || !n.parent.parent))
            rpath.push(n.index || 0);
        n = n.parent;
    }
    return rpath.reverse();
};

/*  New definition of position, compatible with eidogo */
/*  (I never tried this, it's probably buggy)
RGFNode.prototype.descend = function(path) {
    if (!path.length || (path.length==1 && path[0]==0)) {
        return this;
    } else if (path.length==1 && path.children.length==1 && path[0]>0) {
        var newpath=path.slice(0);
        newpath[0]--;
        return this.children[0].descend(newpath);
    } else if (path.length==1) {
        alert("Illegal path!");
        return this;
    } else if (this.children.length==1) {
        return this.children[0].descend(path);
    } else if (path[0]>=0 && path[0]<this.children.length) {
        return this.children[path[0]].descend(path.slice(1));
    } else {
        alert("Illegal path!");
        return this;
    }
};
*/

// the following two functions are used to get stable sorting, which is needed
function merge(left,right,comparison) {
    var result = new Array();
    while((left.length > 0) && (right.length > 0)) {
        if(comparison(left[0],right[0]) <= 0) result.push(left.shift());
        else result.push(right.shift());
    }
    while(left.length > 0) result.push(left.shift());
    while(right.length > 0) result.push(right.shift());
    return result;
};

function merge_sort(array,comparison) {
    if(array.length < 2)
        return array;
    var middle = Math.ceil(array.length/2);
    return merge(
        merge_sort(array.slice(0,middle),comparison),
        merge_sort(array.slice(middle),comparison),
        comparison);
};


// only for testing
function createBox(id,title,style) {
    var el,tmp;
    var title_height=20;
    var title_margin=0;
    var title_padding=4;
    var main_margin=0;
    var main_padding=4;
    el=document.createElement("div");
        el.id=id+"_all";
        el.style.overflow="hidden";
        extend(el.style,style);
    
        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.top=0+"px";
        tmp.style.height=title_height+"px";
        tmp.style.left=0+"px";
        tmp.style.right=0+"px";
        tmp.style.border="solid grey 1px";
        tmp.style.overflow="hidden";
        tmp.style.fontWeight="bold";
        tmp.style.fontSize="100%";
        tmp.style.margin=title_margin+"px";
        tmp.style.padding=title_padding+"px";
        tmp.innerHTML=title;
        tmp.id=id+"_title";
        el.appendChild(tmp);

        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.top=(title_height+15)+"px";
        tmp.style.bottom=0+"px";
        tmp.style.left=0+"px";
        tmp.style.right=0+"px";
        tmp.style.border="solid black 1px";
        tmp.style.margin=main_margin+"px";
        tmp.style.padding=main_padding+"px";
        tmp.style.whiteSpace="pre";
        tmp.style.overflow="auto";
        tmp.id=id;
        el.appendChild(tmp);
    return el;
};
