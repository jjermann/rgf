function DisplayGUI(baseId,msSources,duration) {
    var self = this;
    self.id=baseId;
    
    // create the main html container elements
    document.body.appendChild(self.html());

    // create components
    self.boardPlayer=new EidogoPlayer(self.id+"_player",self.id+"_player_sgf");
    self.gameStream=new GameStream();
    self.gameStream.update(0);
    self.mediaStream=new MediaStream(self.id+"_media",msSources,duration);
    self.mediaInterface=new MediaInterface(self.id+"_media_interface",self.mediaStream);
    self.gameInterface=new GameInterface({stepForwardId: self.id+"_game_step_forward", stepBackId: self.id+"_game_step_back"},self.gameStream,self.mediaStream);
    self.recorderBarInterface=new RecorderBarInterface({interfaceId: self.id+"_recorder_bar_interface"},self.gameStream,self.mediaStream);

    self.gameStream.attachStream(self.mediaStream);    
    self.boardPlayer.attachStream(self.gameStream);
    
    self.onStatusChange = function(newstatus) {
        if (newstatus.failed) {
            // TODO: should load the fallback media stream...
            alert("Media stream loading failed!");
        }
    };
    self.mediaStream.bind('statusChange', self.onStatusChange);

    // Debug output
    self.updateRGFDebug = function() {
        $('#'+self.id+"_game_rgf").text(self.gameStream._rgfGame.writeRGF());
    };
    self.updateActionListDebug = function() {
        var txt="";
        for (var i=0; i<self.gameStream._rgfGame.actionList.length; i++) {
            if (i==self.gameStream.status.timeIndex) txt+="---- CURRENT INDEX ----\n";
            txt+=printAction(self.gameStream._rgfGame.actionList[i])+"\n";
        }
        if (i==self.gameStream.status.timeIndex) txt+="---- CURRENT INDEX ----\n";
        $('#'+self.id+"_game_actions").text(txt);
    };
    self.gameStream.bind('update', function() {
        self.updateActionListDebug();
    }); 
    self.gameStream._rgfGame.bind('actionQueued', function(index) {
        self.updateRGFDebug();
        self.updateActionListDebug();
    }); 
    self.gameStream._rgfGame.bind('timeModified', function(firstIndex,lastIndex,dt) {
        self.updateRGFDebug();
        self.updateActionListDebug();
    });
    self.gameStream._rgfGame.bind('removedAction', function(index,action) {
        self.updateRGFDebug();
        self.updateActionListDebug();
    });
};

DisplayGUI.prototype.html = function() {
    var self=this;
    
    var gui=document.createElement("div");
    gui.id=self.id;
    gui.className="gui";

    el=document.createElement("div");
    el.id=self.id+"_media";
    el.className="gui_media";
    gui.appendChild(el);

    var el=document.createElement("div");
    el.id=self.id+"_player";
    el.className="gui_player";
    gui.appendChild(el);

    var el=document.createElement("div");
    el.className="gui_player_interface";
    el.appendChild(self.playerInterfaceHtml());
    gui.appendChild(el);

    var el=document.createElement("div");
    el.id=self.id+"_recorder_bar_interface";
    el.className="gui_recorder_bar_interface";
    gui.appendChild(el);

    gui.appendChild(createBox("gui_game_rgf",self.id+"_game_rgf","RGF Tree"));
    gui.appendChild(createBox("gui_game_actions",self.id+"_game_actions","ActionList"));
    gui.appendChild(createBox("gui_player_sgf",self.id+"_player_sgf","Current SGF tree"));
    return gui;
};

DisplayGUI.prototype.playerInterfaceHtml = function() {
    var self=this;
    var controls=document.createDocumentFragment();
    
    var el=document.createElement("div");
    el.id=self.id+"_media_interface";
    el.className="gui_media_interface";
    controls.appendChild(el);
    
    el=document.createElement("div");
    el.id=self.id+"_game_step_back";
    el.className="gs-step-back";
    controls.appendChild(el);

    el=document.createElement("div");
    el.id=self.id+"_game_step_forward";
    el.className="gs-step-forward";
    controls.appendChild(el);
    
    return controls;
};

DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};
