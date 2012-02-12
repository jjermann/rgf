function RGFParser(rgf) {
    this.rgf=rgf;
    this.index=0;
    this.rgftree=new RGFNode();
    this._parseTree(this.rgftree);
    this.action_list=this.rgftree.getActions();
    if (this.action_list.length) {
        this.duration=this.action_list[this.action_list.length-1].time;
    }
};

RGFParser.prototype._parseTree = function(curnode) {
    while (this.index < this.rgf.length) {
        var c=this._curChar();
        this.index++;
        switch (c) {
            case ';':
                curnode = this._parseNode(curnode);
                break;
            case '(':
                this._parseTree(curnode);
                break;
            case ')':
                return;
                break;
        }
    }
};

RGFParser.prototype._parseNode = function(parent) {
    var node=new RGFNode();
    if (parent)
        parent.addNode(node);
    else  
        // this should not happen unless called from the outside
        this.rgftree = node;
    node = this._parseProperties(node);
    if (parent && parent.children.length>1 && node.time < parent.children[parent.children.length-2].time) {
        alert("Invalid RGF file!");
    }
    return node;
};


RGFParser.prototype._parseProperties = function(node) {
    var prop = "";
    var last_property=null;
    var prop_time_before=+node.time;
    var arg = [];
    var i = 0;
    while (this.index < this.rgf.length) {
        var c = this._curChar();
        // proceed to the next node/tree
        if (c == ';' || c == '(' || c == ')') {
            break;
        }
        // a new property starts
        if (this._curChar() == '[') {
            // while we have a property list
            while (this._curChar() == '[') {
                this.index++;
                arg[i] = "";
                while (this._curChar() != ']' && this.index < this.rgf.length) {
                    if (this._curChar() == '\\') {
                        this.index++;
                        // not technically correct, but works in practice
                        while (this._curChar() == "\r" || this._curChar() == "\n") {
                            this.index++;
                        }
                    }
                    // continue parsing the current argument
                    arg[i] += this._curChar();
                    this.index++;
                }
                i++;
                while (this._curChar() == ']' || this._curChar() == "\n" || this._curChar() == "\r") {
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

RGFParser.prototype._curChar = function() {
    return this.rgf.charAt(this.index);
};

