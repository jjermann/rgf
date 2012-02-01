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
    this.position="";
    this.time=(time==undefined || time==-1) ? -1 : time;
};
function RGFProperty(name,argument,time) {
    this.name=name;
    this.argument=argument;
    this.time=(time==undefined || time==-1) ? -1 : time;
};
RGFNode.prototype.addNode=function(node) {
    this.children.push(node);
    node.position=((this.position==="") ? "" : (this.position+"."))+(this.children.length-1);
    return node;
}
RGFNode.prototype.addProp=function(property) { this.properties.push(property); }
RGFNode.prototype.descend = function(path) {
    if (!path.length) return this;
    if (typeof path=='string') path=path.split('.');
    return this.children[path[0]].descend(path.slice(1));
};


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

function BoardWidget(board_id) {
/*  Go board internals/etc (should already exist)
    Has no information about time...
    Maybe also responsible for the drawing of the go board and/or variations (no idea)
    This is just here for testing!
*/
    this.board_id=board_id;
    this.board_element=this._initBoardElement(this.board_id);

    /* for testing */
    // current SGF tree/content
    this._sgftree=new RGFNode();
    // current SGF path
    this._sgfpath=[];
    // current SGF parent node (equal to this._sgftree.descend(this._sgfpath))
    this._sgfnode=this._sgftree;
};
BoardWidget.prototype._initBoardElement=function(id) {
    // only for testing at the moment
    return createBox(id,"Current (pseudo) SGF tree",350,500,1160,10);
};
BoardWidget.prototype.clear=function() {
    // Clears the whole game stream variation tree, reseting to an "initial" empty one.
   
    // For testing:
    $('div#'+this.board_id).text("");
};

BoardWidget.prototype.apply=function(action) {
    if (action.name=="KeyFrame") {
        this.clear();
    }

    /* all this is for testing/demo */

    // modify sgf tree
    if (action.name=="KeyFrame") {
        // temporary solution, since we didn't specify the KeyFrame format yet...
        this._sgftree.children.length=0;
        this._sgfpath=[];
        this._sgfnode=this._sgftree;
    } else {
        if (action.position!=undefined) {
            if (typeof action.position=='string') this._sgfpath=(action.position).split('.');
            else this._sgfpath=action.position;
            this._sgfnode=this._sgftree.descend(this._sgfpath);
        }
        // if a node is added
        if (action.name[0]==";") {
            this._sgfpath.push(this._sgfnode.children.length);
            this._sgfnode=this._sgfnode.addNode(new RGFNode(action.time));
            if (action.name==";") {
            } else if (action.name==";B") {
                this._sgfnode.addProp(new RGFProperty("B",action.arg,action.time));
            } else if (action.name==";W") {
                this._sgfnode.addProp(new RGFProperty("W",action.arg,action.time));
            } else {
                alert("Invalid node action: "+action.name);
            }
        // if a property is added
        } else {
            if (action.name!="VT") this._sgfnode.addProp(new RGFProperty(action.name,action.arg,action.time));
        }
    }
    $('div#'+this.board_id).text(this.getSGF());
};

BoardWidget.prototype.getSGF = function() {
    var output="";
    if (!this._sgftree.children.length) {
        output=";";
    } else {
        for (var i=0; i<this._sgftree.children.length; i++) {
            output += "(\n";
            output += this.getSGFSub("    ",this._sgftree.children[i]);
            output += ")\n";
        }
    }
    return output;
};

BoardWidget.prototype.getSGFSub = function(indent,node) {
    var output=indent;
    output += ";";
    for (var i=0; i<node.properties.length; i++) {
        output +=  node.properties[i].name + "[" + node.properties[i].argument + "]"
    }
    output += "\n";

    if (!node.children.length) {
    } else if (node.children.length==1) {
        output += this.getSGFSub(indent,node.children[0]);
    } else {
        for (var i=0; i<node.children.length; i++) {
            output += indent + "(\n";
            output += this.getSGFSub(indent + "    ",node.children[i]);
            output += indent + ")\n";
        }
    }
    return output;
};

