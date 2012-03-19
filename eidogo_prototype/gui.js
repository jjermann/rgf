function DisplayGUI(baseId,msSources,duration) {
    /*
       DisplayGUI:      ID
       MediaStream:     ID_media
       MediaInterface:  ID_media_interface
       EidogoPlayer:    ID_player
                        ID_player_sgf
                        ID_player_actions
                        ID_player_eidogo
       GameStream:      ID_game
                        ID_game_rgf
       GameInterface:   ID_game_interface
    */
    var self = this;
    
    self.id=baseId;
    
    // create components
    self.boardPlayer=new EidogoPlayer(self.id+"_player");
    self.gameStream=new GameStream(self.id+"_game")
    self.mediaStream=new MediaStream(self.id+"_media",msSources,duration);
    self.mediaInterface=new MediaInterface(self.id+"_media_interface");
    self.gameInterface=new GameInterface(self.id+"_game_interface");

    self.gameStream.attachStream(self.mediaStream);    
    self.boardPlayer.attachStream(self.gameStream);
    
    self.onStatusChange = function(newstatus) {
        if (newstatus.failed) {
            // TODO: should load the fallback media stream...
            alert("Media stream loading failed!");
        }
    };
    self.mediaStream.bind('statusChange', self.onStatusChange);

    // initialize the main HTML element(s)
    self.html=document.createElement("div");
    self.html.id=self.id;    
    self.html.appendChild(self.mediaStream.html({
        position: "absolute",
        top:      "4px",
        left:     "4px",
        width:    "640px",
        //height:   "500px",
        border:   "solid black 1px"
    }));
    self.html.appendChild(self.boardPlayer.html({
        position: "absolute",
        /*
        overflow: "hidden";
        width:    "431px",
        height:   "431px",
        */
        left:     "650px",
        top:      "4px"
    }));
    self.html.appendChild(self.mediaInterface.html({
        position: "absolute",
        left:     "654px",
//        top:      "434px"
        top:      "471px"
//          left:     "1080px",
//          top:      "8px"
    }));
    self.html.appendChild(self.gameInterface.html({
        position: "absolute",
        left:     "770px",
//        top:      "434px"
        top:      "461px"
//          left:     "1080px",
//          top:      "8px"
    }));

    // Textbox to output the current RGF tree
    self.html.appendChild(createBox(self.id+"_game_rgf","Current RGF Tree",{
        position: "absolute",
        width:    "640px",
        height:   "500px",
        top:      "560px",
        left:     "4px"
    }));
    // Textbox to output the current pseudo SGF file
    self.html.appendChild(createBox(self.id+"_player_sgf","Current SGF tree", {
        position: "absolute",
        width:    "422px",
        height:   "500px",
        top:      "560px",   
        left:     "650px"
    }));
    // Textbox to output the currently applied action list
    self.html.appendChild(createBox(self.id+"_player_actions","Currently applied actions", {
        position: "absolute",
        width:    "382px",
        height:   "500px",
        top:      "560px",   
        left:     "1078px"
    }));
    
    // insert the gui into the html body
    document.body.appendChild(self.html);

    // The game stream is set to the initial (starting) position,
    // the other components are initialized
    self.boardPlayer.init();
    self.gameStream.update(0);
    self.mediaInterface.init(self.mediaStream);
    self.mediaStream.init();
    self.gameInterface.init(self.gameStream, self.mediaStream);

};


DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};

    