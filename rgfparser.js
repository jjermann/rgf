function RGFParser() { };

RGFParser.prototype.loadRGF = function(rgf) {
    this.rgf=rgf;
    this.index=0;
    this.rgfTree=new RGFNode();
    this.times=undefined;
    this.maxDuration=undefined;
    this._parseTree(this.rgfTree);
    this.actionList=this.rgfTree.getActions();
    this.ended=true;
    if (this.actionList.length) {
        if (this.actionList[this.actionList.length-1].counter) {
            this.ended=false;
        }
        this.maxDuration=this.actionList[this.actionList.length-1].time;
    } else {
        this.maxDuration=undefined;
        this.ended=false;
    }
    this.rgf=this.rgfTree.writeRGF();
};

// expects an SGF _content_, e.g. no root or game-info properties...
// not that the rgfTree is _not_ valid at the end, just the actionList!
RGFParser.prototype.importLinearSGF = function(sgf,mode) {
    this.rgf=sgf;
    this.index=0;
    this.rgfTree=new RGFNode();
    this.times=new Object();
    this.maxDuration=undefined;
    this._parseTree(this.rgfTree);
    this._updateTimemode(mode,"init");
    this.applySGFTimes(this.rgfTree,mode);
    this.actionList=this.rgfTree.getActions();
    this.ended=true;
    if (this.actionList.length) {
        this.actionList.push({name: "VT", arg: "ENDED", time: this.actionList[this.actionList.length-1].time+1, counter:0});
    } else {
        this.actionList.push({name: "VT", arg: "ENDED", time: 1, counter:0});
    }
    this.maxDuration=this.actionList[this.actionList.length-1].time;
    this.rgf=this.rgfTree.writeRGF();
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
        this.rgfTree = node;
    node = this._parseProperties(node);
    if (parent && parent.children.length>1 && node.time < parent.children[parent.children.length-2].time) {
        alert("Invalid RGF file!");
    }
    return node;
};


RGFParser.prototype._parseProperties = function(node) {
    var prop = "";
    var lastProperty=null;
    var arg = [];
    var tsArg,time,counter;
    var i = 0;
    while (this.index < this.rgf.length) {
        var c = this._curChar();
        // proceed to the next node/tree
        if (c == ';' || c == '(' || c == ')') {
            break;
        }
        // a new property argument starts
        if (this._curChar() == '[') {
            // while we have a property list (not that the index still points to the '[')
            while (this._curChar() == '[') {
                this.index++;
                arg[i] = "";
                while (this._curChar() != ']' && this.index < this.rgf.length) {
                    if (this._curChar() == '\\') {
                        //arg[i] += this._curChar();
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
                // ignore the following characters if they come after a property argument:
                while (this._curChar() == ']' || this._curChar() == "\n" || this._curChar() == "\r") {
                    this.index++;
                }
            }
            if (prop=="TS"){
                tsArg=(arg[i-1]).split(":");
                counter=0;
                if (!tsArg.length || tsArg.length>2) {
                    // invalid TS property
                } else if (tsArg.length==1) {
                    time=+tsArg[0];
                } else if (tsArg.length==2) {
                    time=+tsArg[0];
                    counter=+tsArg[1];
                    if (counter <= 0) {
                        // invalid TS property
                    }
                }
                if (lastProperty==null) {
                    // set the time for this node
                    node.time=time;
                    node.counter=counter;
                } else {
                    // set the time for the last property
                    lastProperty.time=time;
                    lastProperty.counter=counter;
                }
            } else {
                // we add each list entry as a property to the node
                for (var j=0; j<i; j++) {
                    lastProperty=node.addProp(new RGFProperty(prop,arg[j]));
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

// use the timings BL and WL from a linear SGF content to get the RGF timestamps...
RGFParser.prototype.applySGFTimes = function(node, mode) {
    for (var i=0; i<node.properties.length; i++) {
        var prop=node.properties[i];
        if (prop.name=="BL" && prop.time==-1) {
            this._updateTimemode(mode,"BL",prop.argument);
        } else if (prop.name=="WL" && prop.time==-1) {
            this._updateTimemode(mode,"WL",prop.argument);
        } else if (prop.name=="OB" && prop.time==-1) {
            this._updateTimemode(mode,"OB",prop.argument);
        } else if (prop.name=="OW" && prop.time==-1) {
            this._updateTimemode(mode,"OW",prop.argument);
        }
    }
    if (node.parent!=null && node.time==-1) {
        node.time=mode.time;
        if (this.times[node.time]==null) this.times[node.time]=0;
        else this.times[node.time]++;
        node.counter=this.times[node.time];
        for (var i=0; i<node.properties.length; i++) {
            var prop=node.properties[i];
            if (prop.time==-1) {
                this.times[node.time]++;
                prop.time=node.time;
                prop.counter=this.times[prop.time];
            }
        }
    }

    for (var i=0; i<node.children.length; i++) {
        var clone=deepclone(mode);
        this.applySGFTimes(node.children[i], clone);
    }
};

RGFParser.prototype._updateTimemode = function(mode,change,arg) {
    switch(mode.type) {
        case "absolute":
            switch(change) {
                case "init":
                    mode.time=0;
                    mode.lastBl=mode.timeLimit;
                    mode.lastWl=mode.timeLimit;
                    if (mode.step==undefined) mode.step=5;
                    break;
                case "BL":
                    var diff=mode.lastBl-arg;
                    mode.lastBl=arg;
                    if (diff>0) {
                        mode.time+=diff;
                    } else {
                        // if time was added or in byoyomi
                        mode.time+=mode.step;
                    }
                    break;
                case "WL":
                    var diff=mode.lastWl-arg;
                    mode.lastWl=arg;
                    if (diff>0) {
                        mode.time+=diff;
                    } else {
                        // if time was added or in byoyomi
                        mode.time+=mode.step;
                    }
                    break;
                case "OB":
                    break;
                case "OW":
                    break;
            }
            break;
        case "fischer":
        case "japanese":
        case "canadian":
        case "hourglass":
        default:
    }
}

RGFParser.prototype._curChar = function() {
    return this.rgf.charAt(this.index);
};

