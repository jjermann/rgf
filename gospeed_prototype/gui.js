function DisplayGUI(baseId,msSources,duration) {
    var self = this;
    
    self.id=baseId;
    
    /* Configuration for GoSpeed */
    DIV_ID_BOARD = DIV_ID_TREE = DIV_ID_CAPTURED_W = DIV_ID_CAPTURED_B = DIV_ID_RESULT = DIV_ID_COMMENTS = DIV_ID_MOVE_NUMBER = self.id+"_player_";

    DIV_ID_BOARD += "board";
    DIV_ID_TREE += "tree";
    // if performance is an issue set DIV_ID_TREE to undefined
    // DIV_ID_TREE = undefined;
    DIV_ID_CAPTURED_W += "cap_w";
    DIV_ID_CAPTURED_B += "cap_b";
    DIV_ID_RESULT += "res";
    DIV_ID_COMMENTS += "comments";
    DIV_ID_MOVE_NUMBER += "move_no";

    var goSpeedConf = {
        size: 19,
        div_id_board: DIV_ID_BOARD,
        div_id_tree: DIV_ID_TREE,
        div_id_captured_w: DIV_ID_CAPTURED_W,
        div_id_captured_b: DIV_ID_CAPTURED_B,
        div_id_result: DIV_ID_RESULT,
        div_id_move_number: DIV_ID_MOVE_NUMBER,
        div_id_comments: DIV_ID_COMMENTS,
        server_path_gospeed_root: "./"
    };

    // create the main html container elements
    document.body.appendChild(self.html());

    // create components
    self.boardPlayer=new GoSpeedPlayer(self.id+"_player",goSpeedConf);
    self.gameStream=new GameStream()
    self.gameStream.update(0);
    self.mediaStream=new MediaStream(self.id+"_media",msSources,duration);
    self.mediaInterface=new MediaInterface(self.id+"_media_interface",self.mediaStream);
    self.gameInterface=new GameInterface({stepForwardId: self.id+"_game_step_forward", stepBackId: self.id+"_game_step_back"},self.gameStream,self.mediaStream);
    self.recorderBarInterface=new RecorderBarInterface({interfaceId: self.id+"_player_recorder_bar_interface", timeInterval: 30},self.gameStream,self.mediaStream);
    
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

DisplayGUI.prototype.hide = function() {
    $("#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("#"+this.id+" ").show();
};

DisplayGUI.prototype.html = function() {
    var self=this;
    
    var gui=document.createElement("div");
    gui.id=self.id;
    gui.className="gui";

    /* GoSpeed Player */
    var el=document.createElement("div");
    el.id=self.id+"_player";
    el.className="gui_player";
    el.appendChild(self.playerHtml());
    gui.appendChild(el);

    /* RGF debug output */
    gui.appendChild(createBox("gui_game_rgf",self.id+"_game_rgf","RGF Tree"));
    gui.appendChild(createBox("gui_game_actions",self.id+"_game_actions","ActionList"));

    /* Media Stream */
    el=document.createElement("div");
    el.id=self.id+"_media";
    el.className="gui_media";
    gui.appendChild(el);

    return gui;
};

DisplayGUI.prototype.playerHtml = function() {
    var self=this;
    var el, container, lvl1, lvl2;
    el=document.createDocumentFragment();
      container=document.createElement("div");
      container.id=self.id+"_player_board";
      container.className="player_board";
      el.appendChild(container);
      
      /* we add the media/game interfaces here, after the board */
      container=document.createElement("div");
      container.className="player_interface";
      container.appendChild(self.playerInterfaceHtml());
      el.appendChild(container);
      
      container=document.createElement("div");
      container.id=self.id+"_player_recorder_bar_interface";
      container.className="player_recorder_bar_interface";
      el.appendChild(container);

      container=document.createElement("div");
      container.id=self.id+"_player_tree";
      container.className="player_tree";
      el.appendChild(container);

      container=document.createElement("table");
      container.className="player_stats";
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Captured W';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=self.id+"_player_cap_w";
          lvl2.className="player_cap_w";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Captured B';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=self.id+"_player_cap_b";
          lvl2.className="player_cap_b";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Result';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=self.id+"_player_res";
          lvl2.className="player_res";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Move number';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=self.id+"_player_move_no";
          lvl2.className="player_move_no";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
      el.appendChild(container);

      container=document.createElement("div");
      container.id=self.id+"_player_comments";
      container.className="player_comments";
      el.appendChild(container);
      
      return el;
};

DisplayGUI.prototype.playerInterfaceHtml = function() {
    var self=this;
    var controls=document.createDocumentFragment();

    var el=document.createElement("div");
    el.id=self.id+"_media_interface";
    el.className="gui_media_interface";
    controls.appendChild(el);

    var el=document.createElement("a");
    el.id=self.id+"_game_step_back";   
    el.className="gs-step-back";
    controls.appendChild(el);

    el=document.createElement("a");
    el.id=self.id+"_game_step_forward";
    el.className="gs-step-forward";
    controls.appendChild(el);

    return controls;
};

