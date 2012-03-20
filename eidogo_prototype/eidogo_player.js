/* This should already exist! So _all_ content is for testing only... */
function EidogoPlayer(boardId) {
    this.id=boardId;
    this.onApplyAction = this.applyAction.bind(this);
};

EidogoPlayer.prototype.attachStream = function (stream) {
    var self = this;
    
    self.detachStream();
    
    self.attachedStream = stream;
    stream.bind('applyAction', self.onApplyAction);
};

EidogoPlayer.prototype.detachStream = function () {
    var self = this,
        stream = self.attachedStream;
        
    if (stream) {
        stream.unbind('applyAction', self.onApplyAction);
        delete self.attachedStream;
    }
};

EidogoPlayer.prototype.insertActions = function(actions) {
    var self=this;
    
    if (self.attachedStream) {
        return self.attachedStream.applyActionList(actions,"remove_necessary");
    } else {
        return false;
    }
};

// Returns the html element for the board player
EidogoPlayer.prototype.html=function(style) {
    var elEidogo=document.createElement("div");
    elEidogo.id=this.id+"_eidogo";
    extend(elEidogo.style,style);
    return elEidogo;
};

EidogoPlayer.prototype.init=function() {
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
        
        gsInsertActions:  this.insertActions.bind(this)
    };

    this.eidogoPlayer = new eidogo.Player(this.eidogoConfig);
    this.eidogoPlayer.loadSgf(this.eidogoConfig);
};

EidogoPlayer.prototype._getEidogoPath=function(position) {
    return this.eidogoPlayer._getEidogoPath(pathToArray(position));
};

EidogoPlayer.prototype.applyAction = function(action) {
    var path;
    if (action.name=="KeyFrame") {
        this.eidogoConfig.sgf=action.arg;
        path=this._getEidogoPath(action.position);
        if (path!=null) this.eidogoConfig.loadPath=path;
        else this.eidogoPlayer.loadPath=[0,0];
        this.eidogoPlayer.loadSgf(this.eidogoConfig);
    } else {
        if (action.position!=undefined) {
            path=this._getEidogoPath(action.position);
            if (path!=null) this.eidogoPlayer.goTo(path);
            else {
                // TODO
            }
        }
        // if a node is added
        if (action.name==";") {
            this.eidogoPlayer.createNode();
        // if a property is added
        } else {
            if (action.name!="VT") {
                this.eidogoPlayer.cursor.node.pushProperty(action.name,action.arg);
            }
        }
        this.eidogoPlayer.refresh();
    }

    // demo output
    if (action.name=="KeyFrame") {
        $('div#'+this.id+"_actions").text("");
    }
    
    var newActiontxt="board.apply({"
         + "time: " + ((action.time!==undefined)  ? (action.time)                               : "-1")
         + ((action.name!==undefined)             ? (", name: \"" + action.name +"\"")          :   "")
         + ((action.arg!==undefined)              ? (", arg: \"" + action.arg + "\"")           :   "")
         + ((action.position!==undefined)         ? (", position: \"" + action.position + "\"") :   "")
    + "});\n";

    var parser=new RGFParser;
    parser.loadRGF(this.eidogoPlayer.cursor.getGameRoot().toSgf());
    $('div#'+this.id+"_sgf").text(parser.rgf);
    $('div#'+this.id+"_actions").append(document.createTextNode(newActiontxt));
};

asEvented.call(EidogoPlayer.prototype);
