function DisplayGUI(baseId,msSources,duration) {
    var self = this;
    
    self.id=baseId;
    
    // create the main html container elements
    document.body.appendChild(self.html());

    // create components
    self.boardPlayer=new EidogoPlayer(self.id+"_player",self.id+"_player_sgf",self.id+"_player_actions");
    self.gameStream=new GameStream(self.id+"_game_rgf")
    self.gameStream.update(0);
    self.mediaStream=new MediaStream(self.id+"_media",msSources,duration);
    self.mediaInterface=new MediaInterface(self.id+"_media_interface",self.mediaStream);
    self.gameInterface=new GameInterface(self.id+"_game_interface",self.gameStream,self.mediaStream);

    self.gameStream.attachStream(self.mediaStream);    
    self.boardPlayer.attachStream(self.gameStream);
    
    self.onStatusChange = function(newstatus) {
        if (newstatus.failed) {
            // TODO: should load the fallback media stream...
            alert("Media stream loading failed!");
        }
    };
    self.mediaStream.bind('statusChange', self.onStatusChange);
};

DisplayGUI.prototype.html = function() {
    var self=this;
    
    var gui=document.createElement("div");
    gui.id=self.id;
    gui.className="gui";
    var el=document.createElement("div");
    el.id=self.id+"_player";
    el.className="gui_player";
    gui.appendChild(el);

    gui.appendChild(createBox("gui_game_rgf",self.id+"_game_rgf","Current RGF Tree"));
    gui.appendChild(createBox("gui_player_sgf",self.id+"_player_sgf","Current SGF tree"));
    gui.appendChild(createBox("gui_player_actions",self.id+"_player_actions","Currently applied actions"));

    el=document.createElement("div");
    el.id=self.id+"_media";
    el.className="gui_media";
    gui.appendChild(el);
    el=document.createElement("div");
    el.id=self.id+"_media_interface";
    el.className="gui_media_interface";
    gui.appendChild(el);
    el=document.createElement("div");
    el.id=self.id+"_game_interface";
    el.className="gui_game_interface";
    gui.appendChild(el);

    return gui;
};

DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};

    