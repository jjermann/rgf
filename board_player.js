/* This should already exist! So _all_ content is for testing only... */
function BoardPlayer(board_id) {
    this.id=board_id;
    
    // current SGF tree/content, note that this is just a "pseudo" SGF tree
    this._sgftree=new RGFNode();
    // current SGF path
    this._sgfpath=[];
    // current SGF parent node (equal to this._sgftree.descend(this._sgfpath))
    this._sgfnode=this._sgftree;
    // Eidogo Player (initialized later)
    this.eidogo_player;
    this.eidogoConfig = {
        theme:          "standard", // "standard" or "compact"
        mode:           "play", // "play" or "view"
        showComments:    true,
        showPlayerInfo:  false,
        showGameInfo:    true,
        showTools:       true,
        showOptions:     false,
        showNavTree:     true,
        markCurrent:     true,
        markVariations:  true,
        markNext:        false,
        problemMode:     false,
        enableShortcuts: false,
        
        container:       this.id+"_eidogo",
        sgf:             ";",
        loadPath:        [0,0],
    };
};

// Returns the html element for the board player
BoardPlayer.prototype.html=function(style) {
    var el_eidogo=document.createElement("div");
    el_eidogo.id=this.id+"_eidogo";
    extend(el_eidogo.style,style);
    return el_eidogo;
};

BoardPlayer.prototype.init=function() {
    this.eidogo_player = new eidogo.Player(this.eidogoConfig);
    this.eidogo_player.loadSgf(this.eidogoConfig);
};

BoardPlayer.prototype.apply=function(action) {
    // modify action list
    if (action.name=="KeyFrame") {
        $('div#'+this.id+"_actions").text("");
    }
    
    // modify pseudo sgf tree and apply eidogo stuff
    if (action.name=="KeyFrame") {
        // temporary solution, since we didn't specify the KeyFrame format yet...
        this._sgftree.children.length=0;
        this._sgfpath=[];
        this._sgfnode=this._sgftree;

        // EIDOGO
        this.eidogoConfig.sgf="";
        this.eidogoConfig.loadPath=[0];
        // this.eidogoConfig.sgf=new_sgf;
        // this.eidogoConfig.loadPath=this._sgfnode.getEidogoPath();
        this.eidogo_player.loadSgf(this.eidogoConfig);
    } else {
        if (action.position!=undefined) {
            if (action.position=="") this._sgfpath=[];
            else if (typeof action.position=='string') this._sgfpath=(action.position).split('.');
            else this._sgfpath=action.position;
            this._sgfnode=this._sgftree.descend(this._sgfpath);
            
            // EIDOGO
            // unfortunately we need an accurate sgf representation to determine the eidogo path
            this.eidogo_player.goTo(this._sgfnode.getEidogoPath());
        }
        // if a node is added
        if (action.name[0]==";") {
            this._sgfpath.push(this._sgfnode.children.length);
            this._sgfnode=this._sgfnode.addNode(new RGFNode(action.time));

            // EIDOGO
            this.eidogo_player.totalMoves++;
            this.eidogo_player.cursor.node.appendChild(new eidogo.GameNode(null, {}));
            this.eidogo_player.unsavedChanges = [this.eidogo_player.cursor.node._children.last(), this.eidogo_player.cursor.node];
            this.eidogo_player.updatedNavTree = false;
            this.eidogo_player.variation(this.eidogo_player.cursor.node._children.length-1);

            if (action.name==";") {
            } else if (action.name==";B") {
                this._sgfnode.addProp(new RGFProperty("B",action.arg,action.time));

                // EIDOGO
                this.eidogo_player.cursor.node.pushProperty("B",action.arg);
            } else if (action.name==";W") {
                this._sgfnode.addProp(new RGFProperty("W",action.arg,action.time));

                // EIDOGO
                this.eidogo_player.cursor.node.pushProperty("W",action.arg);
            } else {
                alert("Invalid node action: "+action.name);
            }
        // if a property is added
        } else {
            if (action.name!="VT") {
                this._sgfnode.addProp(new RGFProperty(action.name,action.arg,action.time));

                // EIDOGO
                this.eidogo_player.cursor.node.pushProperty(action.name,action.arg);
            }
        }
        
        // EIDOGO
        this.eidogo_player.refresh();
    }

    // demo output
    var new_actiontxt="board.apply({"
         + "time: " + ((action.time!==undefined)  ? (action.time)                               : "-1")
         + ((action.name!==undefined)             ? (", name: \"" + action.name +"\"")          :   "")
         + ((action.arg!==undefined)              ? (", arg: \"" + action.arg + "\"")           :   "")
         + ((action.position!==undefined)         ? (", position: \"" + action.position + "\"") :   "")
    + "});\n";
    
    var new_sgf=this.getSGF();
    $('div#'+this.id+"_sgf").text(new_sgf);
    $('div#'+this.id+"_actions").append(document.createTextNode(new_actiontxt));
};

BoardPlayer.prototype.getSGF = function() {
    var output=this.getSGFSub(this._sgftree);
    // TODO: maybe make this check somewhere else
    if (output=="") output=";";
    return output;
};

BoardPlayer.prototype.getSGFSub = function(node,indent,base_indent) {
    var output;
    if (indent==null) indent="    ";
    if (base_indent==null) base_indent=indent;

    if (node.parent==null) {
        output="";
        if (!node.children.length) {
            // Someone else should check for output=="" then and react approrpiately
        } else {
            for (var i=0; i<node.children.length; i++) {
                output += "(\n";
                output += this.getSGFSub(node.children[i],indent,base_indent);
                output += ")\n";
            }
        }
    } else {
        output=indent;
        output += ";";
        for (var i=0; i<node.properties.length; i++) {
            output +=  node.properties[i].name + "[" + node.properties[i].argument + "]"
        }
        output += "\n";

        if (!node.children.length) {
        } else if (node.children.length==1) {
            output += this.getSGFSub(node.children[0],indent,base_indent);
        } else {
            for (var i=0; i<node.children.length; i++) {
                output += indent + "(\n";
                output += this.getSGFSub(node.children[i],indent+base_indent,base_indent);
                output += indent + ")\n";
            }
        }
    }
    return output;
};
