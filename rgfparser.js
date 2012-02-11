function RGFParser(rgf) {
    this.rgf=rgf;
    this.index=0;
    this.rgftree=new RGFNode();
    this.parseTree(this.rgftree);
    this.action_list=this.getActions(this._getUnsortedActions(this.rgftree));
};

RGFParser.prototype.parseTree=function(curnode) {
    while (this.index < this.rgf.length) {
        var c=this.curChar();
        this.index++;
        switch (c) {
            case ';':
                curnode = this.parseNode(curnode);
                break;
            case '(':
                this.parseTree(curnode);
                break;
            case ')':
                return;
                break;
        }
    }
};

RGFParser.prototype.parseNode=function(parent) {
    var node=new RGFNode();
    if (parent)
        parent.addNode(node);
    else  
        // this should not happen unless called from the outside
        this.rgftree = node;
    node = this.parseProperties(node);
    if (parent && parent.children.length>1 && node.time < parent.children[parent.children.length-2].time) {
        alert("Invalid RGF file!");
    }
    return node;
};


RGFParser.prototype.parseProperties=function(node) {
    var prop = "";
    var last_property=null;
    var prop_time_before=+node.time;
    var arg = [];
    var i = 0;
    while (this.index < this.rgf.length) {
        var c = this.curChar();
        // proceed to the next node/tree
        if (c == ';' || c == '(' || c == ')') {
            break;
        }
        // a new property starts
        if (this.curChar() == '[') {
            // while we have a property list
            while (this.curChar() == '[') {
                this.index++;
                arg[i] = "";
                while (this.curChar() != ']' && this.index < this.rgf.length) {
                    if (this.curChar() == '\\') {
                        this.index++;
                        // not technically correct, but works in practice
                        while (this.curChar() == "\r" || this.curChar() == "\n") {
                            this.index++;
                        }
                    }
                    // continue parsing the current argument
                    arg[i] += this.curChar();
                    this.index++;
                }
                i++;
                while (this.curChar() == ']' || this.curChar() == "\n" || this.curChar() == "\r") {
                    this.index++;
                }
            }
            if (prop=="TS" && last_property==null) {
                // set the time for this node
                node.time=+arg[i-1];
                prop_time_before=+arg[i-1];
            } else if (prop=="TS") {
                if (arg[i-1]<prop_time_before) alert("Invalid RGF file!");
                // set the time for the last property
                last_property.time=+arg[i-1];
                prop_time_before=+arg[i-1];
            } else {
                // we add each list entry as a property to the node
                for (var j=0; j<i; j++) {
                    last_property=node.addProp(new RGFProperty(prop,arg[j]));
                }
            }
            // finnished parsing this property list for this node, so we reset
            prop = "";
            arg = [];
            i = 0;
            continue;
        }
        // continue parsing the current property name
        if (c != " " && c != "\n" && c != "\r" && c != "\t") {
            prop += c;
        }
        this.index++;
    }
    return node;
};

RGFParser.prototype.curChar=function() {
    return this.rgf.charAt(this.index);
};

RGFParser.prototype._getUnsortedActions=function(node) {
    var actions=[];
    if (node.parent==null && !node.children.length) {
        return actions;
    } else if (node.parent!=null) {
        // We store the node position temporarly in _node_pos (used later, see below)
        actions.push({time:node.time, name:";", arg:"", position:node.parent.position, _node_pos:node.position});
    }

    for (var i=0; i<node.properties.length; i++) {
        actions.push({time:node.properties[i].time, name:node.properties[i].name, arg:node.properties[i].argument, position:node.position});
    }
    for (var i=0; i<node.children.length; i++) {
        actions=actions.concat(this._getUnsortedActions(node.children[i]));
    }
    return actions;
};

RGFParser.prototype.getActions=function(action_list) {
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

RGFParser.prototype.writeParsedRGF = function(indent,base_indent) {
    return RGFParser.writeRGF(this.rgftree,indent,base_indent);
};

RGFParser.writeRGF = function(node,indent,base_indent) {
    var output;
    if (indent==null) indent="    ";
    if (base_indent==null) base_indent=indent;

    if (node.parent==null) {
        output="";
        if (!node.children.length) {
            // Someone else should check for output=="" then and react approrpiately (e.g. by not creating a game stream)
            // Note that if we create an rgf _file_ it necessarily has to contain a timestamp to be valid! 
        } else {
            for (var i=0; i<node.children.length; i++) {
                output += "(\n"; 
                output += RGFParser.writeRGF(node.children[i],indent,base_indent);
                output += ")\n";
            }
        }
    } else {
        var last_propname=undefined;
        output=indent;
        output += ";" + ((node.time==-1) ? "" : "TS["+node.time+"] ");
        for (var i=0; i<node.properties.length; i++) {
            if (node.properties[i].time==-1 && node.properties[i].name===last_propname) {
                output=output.slice(0, -1);
                output += "[" + node.properties[i].argument + "]";
            } else {
                last_propname=node.properties[i].name;
                output +=  node.properties[i].name + "[" + node.properties[i].argument + "]";
                output += (node.properties[i].time==-1) ? " " : "TS[" + node.properties[i].time + "] ";
            }
        }
        output += "\n";

        if (!node.children.length) {
        } else if (node.children.length==1) {
            output += RGFParser.writeRGF(node.children[0],indent,base_indent);
        } else {
            for (var i=0; i<node.children.length; i++) {
                output += indent + "(\n";
                output += RGFParser.writeRGF(node.children[i],indent+base_indent,base_indent);
                output += indent + ")\n";
            }
        }
    }
    return output;
};

