function RGFNode(time,counter) {
    this.properties=[];
    this.children=[];
    this.parent=null;
    this.position="";
    this.time=(time==undefined) ? -1 : +time;
    this.counter=(counter==undefined) ? 0: +counter;
};
function RGFProperty(name,argument,time,counter) {
    this.name=name;
    this.argument=argument;
    this.time=(time==undefined) ? -1 : +time;
    this.counter=(counter==undefined) ? 0: +counter;
};
RGFNode.prototype.addNode=function(node) {
    node.parent=this;
    if (this.parent==null) {
        node.position=""+this.children.length;
    } else {
        node.position=this.position+"."+this.children.length;
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

// returns the time/counter of the last property/node in the current subtree
RGFNode.prototype.getDuration=function() {
    var duration={time: this.time, counter: this.counter};
    if (this.properties.length) {
        var lastProp=this.properties[this.properties.length-1];
        if (lastProp.time>=duration.time) {
            duration.time=lastProp.time;
            if (lastProp.counter>duration.counter) duration.counter=lastProp.counter;
        }
    }
    
    for (var i=0; i<this.children.length; i++) {
        var childDuration=this.children[i].getDuration();
        if (childDuration.time>=duration.time) {
            duration.time=childDuration.time;
            if (childDuration.counter>duration.counter) duration.counter=childDuration.counter;
        }
    }
    
    return duration;
}

// We store the node position temporarly in _nodePos (used later, see below)
// We also always store a counter to be able to make an easier comparison later...
RGFNode.prototype._getUnsortedActions = function() {
    var actions=[];
    if (this.parent==null && !this.children.length) {
        return actions;
    } else if (this.parent!=null) {
        actions.push({time:this.time, counter:this.counter, name:";", arg:"", position:this.parent.position, _nodePos:this.position});
    }

    for (var i=0; i<this.properties.length; i++) {
        actions.push({time:this.properties[i].time, counter:this.properties[i].counter, name:this.properties[i].name, arg:this.properties[i].argument, position:this.position});
    }
    for (var i=0; i<this.children.length; i++) {
        actions=actions.concat(this.children[i]._getUnsortedActions());
    }
    return actions;
};

RGFNode.prototype._sortActions = function(actionList) {
    var actions=mergeSort(actionList,function(a, b) {if (a.time!=b.time) return (a.time - b.time); else return (a.counter-b.counter);});
    var lastPosition="";

    for (var i=0; i<actions.length; i++) {
        //if (!actions[i].counter) delete actions[i].counter;
        if (actions[i].name==";") {
            if (actions[i].position==lastPosition) delete actions[i].position;
            lastPosition=actions[i]._nodePos;
            delete actions[i]._nodePos;
        } else {
            if (actions[i].position==lastPosition) delete actions[i].position;
            else lastPosition=actions[i].position;
        }
    }
    return actions;
};

RGFNode.prototype.getActions = function() {
    return this._sortActions(this._getUnsortedActions());
};

// TODO: Fix property lists!!!
RGFNode.prototype.writeRGF = function(indent,baseIndent) {
    var output;
    if (indent==null) indent="    ";
    if (baseIndent==null) baseIndent=indent;

    if (this.parent==null) {
        output="";
        if (!this.children.length) {
            // Someone else should check for output=="" then and react approrpiately (e.g. by not creating a game stream)
            // Note that if we create an rgf _file_ it necessarily has to contain a timestamp to be valid! 
        } else {
            for (var i=0; i<this.children.length; i++) {
                output += "(\n"; 
                output += this.children[i].writeRGF(indent,baseIndent);
                output += ")\n";
            }
        }
    } else {
        var lastPropname=undefined;
        output=indent;
        output += ";" + ((this.time==-1) ? "" : ("TS["+this.time+((this.counter)? ":"+this.counter:"")+"] "));
        for (var i=0; i<this.properties.length; i++) {
            if (this.properties[i].time==-1 && this.properties[i].name===lastPropname) {
                output=output.slice(0, -1);
                output += "[" + this.properties[i].argument + "] ";
            } else {
                lastPropname=this.properties[i].name;
                output +=  this.properties[i].name + "[" + this.properties[i].argument + "]";
                output += (this.properties[i].time==-1) ? " " : ("TS[" + this.properties[i].time + ((this.properties[i].counter) ? ":"+this.properties[i].counter : "")+"] ");
            }
        }
        output += "\n";

        if (!this.children.length) {
        } else if (this.children.length==1) {
            output += this.children[0].writeRGF(indent,baseIndent);
        } else {
            for (var i=0; i<this.children.length; i++) {
                output += indent + "(\n";
                output += this.children[i].writeRGF(indent+baseIndent,baseIndent);
                output += indent + ")\n";
            }
        }
    }
    return output;
};

RGFNode.prototype.toString=function(indent,base) {
    return this.writeRGF(indent,base);
}

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

function mergeSort(array,comparison) {
    if(array.length < 2)
        return array;
    var middle = Math.ceil(array.length/2);
    return merge(
        mergeSort(array.slice(0,middle),comparison),
        mergeSort(array.slice(middle),comparison),
        comparison);
};
