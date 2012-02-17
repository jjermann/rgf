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
    path=pathToArray(path);
    if (!path.length) return this;
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

// We store the node position temporarly in _node_pos (used later, see below)
RGFNode.prototype._getUnsortedActions = function() {
    var actions=[];
    if (this.parent==null && !this.children.length) {
        return actions;
    } else if (this.parent!=null) {
        actions.push({time:this.time, name:";", arg:"", position:this.parent.position, _node_pos:this.position});
    }

    for (var i=0; i<this.properties.length; i++) {
        actions.push({time:this.properties[i].time, name:this.properties[i].name, arg:this.properties[i].argument, position:this.position});
    }
    for (var i=0; i<this.children.length; i++) {
        actions=actions.concat(this.children[i]._getUnsortedActions());
    }
    return actions;
};

RGFNode._sortActions = function(action_list) {
    var actions=merge_sort(action_list,function(a, b) {return a.time - b.time});
    var last_position="";

    for (var i=0; i<actions.length; i++) {
        if (actions[i].name==";") {
            if (actions[i].position==last_position) delete actions[i].position;
            last_position=actions[i]._node_pos;
            delete actions[i]._node_pos;
        } else {
            if (actions[i].position==last_position) delete actions[i].position;
            else last_position=actions[i].position;
        }
    }
    return actions;
};

RGFNode.prototype.getActions = function() {
    return RGFNode._sortActions(this._getUnsortedActions());
};

// TODO: Fix property lists!!!
RGFNode.prototype.writeRGF = function(indent,base_indent) {
    var output;
    if (indent==null) indent="    ";
    if (base_indent==null) base_indent=indent;

    if (this.parent==null) {
        output="";
        if (!this.children.length) {
            // Someone else should check for output=="" then and react approrpiately (e.g. by not creating a game stream)
            // Note that if we create an rgf _file_ it necessarily has to contain a timestamp to be valid! 
        } else {
            for (var i=0; i<this.children.length; i++) {
                output += "(\n"; 
                output += this.children[i].writeRGF(indent,base_indent);
                output += ")\n";
            }
        }
    } else {
        var last_propname=undefined;
        output=indent;
        output += ";" + ((this.time==-1) ? "" : "TS["+this.time+"] ");
        for (var i=0; i<this.properties.length; i++) {
            if (this.properties[i].time==-1 && this.properties[i].name===last_propname) {
                output=output.slice(0, -1);
                output += "[" + this.properties[i].argument + "]";
            } else {
                last_propname=this.properties[i].name;
                output +=  this.properties[i].name + "[" + this.properties[i].argument + "]";
                output += (this.properties[i].time==-1) ? " " : "TS[" + this.properties[i].time + "] ";
            }
        }
        output += "\n";

        if (!this.children.length) {
        } else if (this.children.length==1) {
            output += this.children[0].writeRGF(indent,base_indent);
        } else {
            for (var i=0; i<this.children.length; i++) {
                output += indent + "(\n";
                output += this.children[i].writeRGF(indent+base_indent,base_indent);
                output += indent + ")\n";
            }
        }
    }
    return output;
};

RGFNode.prototype.toString=function(indent,base) {
    return this.writeRGF(indent,base);
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