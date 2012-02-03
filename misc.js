function Action(time,name,arg,position) {
    this.time=time;
    this.name=name;
    this.arg=arg;
    this.position=position;
};

/*  Tree stuff */
function RGFNode(time) {
    this.properties=[];
    this.children=[];
//    this.position="";
    this.time=(time==undefined || time==-1) ? -1 : time;
};
function RGFProperty(name,argument,time) {
    this.name=name;
    this.argument=argument;
    this.time=(time==undefined || time==-1) ? -1 : time;
};
RGFNode.prototype.addNode=function(node) {
    this.children.push(node);
//    node.position=((this.position==="") ? "" : (this.position+"."))+(this.children.length-1);
    return node;
}
RGFNode.prototype.addProp=function(property) { this.properties.push(property); }

/*  Old definition of position... */
RGFNode.prototype.descend = function(path) {
    if (!path.length) return this;
    if (typeof path=='string') path=path.split('.');
    return this.children[path[0]].descend(path.slice(1));
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
function createBox(id,title,width,height,left,top) {
    var el,tmp;
    var title_height=20;
    el=document.createElement("div");
        el.id=id+"_all";
    
        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.width=width+"px";
        tmp.style.height=title_height+"px";
        tmp.style.left=left+"px";
        tmp.style.top=top+"px";
        tmp.style.border="solid grey 1px";
        tmp.style.overflow="hidden";
        tmp.style.fontWeight="bold";
        tmp.style.fontSize="100%";
        tmp.style.padding=4+"px";
        tmp.innerHTML=title;
        tmp.id=id+"_title";
        el.appendChild(tmp);

        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.width=width+"px";
        tmp.style.height=height+"px";
        tmp.style.left=left+"px";
        tmp.style.top=(top+title_height+13)+"px";
        tmp.style.border="solid black 1px";
        tmp.style.padding=4+"px";
        tmp.style.overflow="auto";
        tmp.style.whiteSpace="pre";
        tmp.id=id;
        el.appendChild(tmp);
    return el;
};
