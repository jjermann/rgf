/* This should already exist! So _all_ content is for testing only... */
function BoardPlayer(board_id) {
    this.id=board_id;
    
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

BoardPlayer.prototype._getEidogoPath=function(position) {
    return this.eidogo_player._getEidogoPath(pathToArray(position));
};

BoardPlayer.prototype.apply=function(action) {
    var path;
    if (action.name=="KeyFrame") {
        this.eidogoConfig.sgf=action.arg;
        path=this._getEidogoPath(action.position);
        if (path!=null) this.eidogoConfig.loadPath=path;
        else this.eidogo_player.loadPath=[0,0];
        this.eidogo_player.loadSgf(this.eidogoConfig);
    } else {
        if (action.position!=undefined) {
            path=this._getEidogoPath(action.position);
            if (path!=null) this.eidogo_player.goTo(path);
        }
        // if a node is added
        if (action.name[0]==";") {
            this.eidogo_player.createNode();

            if (action.name==";") {
            } else if (action.name==";B") {
                this.eidogo_player.cursor.node.pushProperty("B",action.arg);
            } else if (action.name==";W") {
                this.eidogo_player.cursor.node.pushProperty("W",action.arg);
            } else {
                alert("Invalid node action: "+action.name);
            }
        // if a property is added
        } else {
            if (action.name!="VT") {
                this.eidogo_player.cursor.node.pushProperty(action.name,action.arg);
            }
        }
        this.eidogo_player.refresh();
    }

    // demo output
    if (action.name=="KeyFrame") {
        $('div#'+this.id+"_actions").text("");
    }
    
    var new_actiontxt="board.apply({"
         + "time: " + ((action.time!==undefined)  ? (action.time)                               : "-1")
         + ((action.name!==undefined)             ? (", name: \"" + action.name +"\"")          :   "")
         + ((action.arg!==undefined)              ? (", arg: \"" + action.arg + "\"")           :   "")
         + ((action.position!==undefined)         ? (", position: \"" + action.position + "\"") :   "")
    + "});\n";
    
    $('div#'+this.id+"_sgf").text(this.eidogo_player.cursor.getGameRoot().toSgf());
    $('div#'+this.id+"_actions").append(document.createTextNode(new_actiontxt));
};
