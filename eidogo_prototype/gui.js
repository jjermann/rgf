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
    self.gameInterface=new GameInterface({stepForwardId: self.id+"_game_step_forward", stepBackId: self.id+"_game_step_back"},self.gameStream,self.mediaStream);

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

    gui.appendChild(createBox("gui_game_rgf",self.id+"_game_rgf","Current RGF Tree"));
    gui.appendChild(createBox("gui_player_sgf",self.id+"_player_sgf","Current SGF tree"));
    gui.appendChild(createBox("gui_player_actions",self.id+"_player_actions","Currently applied actions"));
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

    