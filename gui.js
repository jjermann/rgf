function DisplayGUI(base_id,ms_sources,duration) {
    /*
       DisplayGUI:      ID
       MediaStream:     ID_media
       MediaInterface:  ID_interface
       BoardPlayer:     ID_board
                        ID_board_sgf
                        ID_board_actions
                        ID_board_eidogo
       GameStream:      ID_game
                        ID_game_rgf
    */
    this.id=base_id;
    
    // create components
    this.board=new BoardPlayer(this.id+"_board");
    this.game_stream=new GameStream(this.id+"_game",this.board,duration);
    this.media_stream=new MediaStream(this.id+"_media_stream",ms_sources,duration);
    this.media_interface=new MediaInterface(this.id+"_media_interface");

    // initialize the main HTML element(s)
    this.html=document.createElement("div");
    this.html.id=this.id;    
    this.html.appendChild(this.media_stream.html({
        position: "absolute",
        top:      "4px",
        left:     "4px",
        width:    "640px",
        //height:   "500px",
        border:   "solid black 1px"
    }));
    this.html.appendChild(this.board.html({
        position: "absolute",
        /*
        overflow: "hidden";
        width:    "431px",
        height:   "431px",
        */
        left:     "650px",
        top:      "4px"
    }));
    this.html.appendChild(this.media_interface.html({
        position: "absolute",
        left:     "654px",
//        top:      "434px"
        top:      "471px"
//          left:     "1080px",
//          top:      "8px"
    }));

    // Textbox to output the current RGF tree
    this.html.appendChild(createBox(this.id+"_game_rgf","Current RGF Tree",{
        position: "absolute",
        width:    "640px",
        height:   "500px",
        top:      "560px",
        left:     "4px"
    }));
    // Textbox to output the current pseudo SGF file
    this.html.appendChild(createBox(this.id+"_board_sgf","Current SGF tree", {
        position: "absolute",
        width:    "422px",
        height:   "500px",
        top:      "560px",   
        left:     "650px"
    }));
    // Textbox to output the currently applied action list
    this.html.appendChild(createBox(this.id+"_board_actions","Currently applied actions", {
        position: "absolute",
        width:    "382px",
        height:   "500px",
        top:      "560px",   
        left:     "1078px"
    }));
    
    // insert the gui into the html body
    document.body.appendChild(this.html);

    // initialize all components
    this.board.eidogoConfig.GS_insertAction=this.game_stream.applyActionList.bind(this.game_stream);
    this.board.init();
    this.media_stream.init();
    this.media_interface.init(this.media_stream);
    this.media_stream.addInterface(this.game_stream.updatedStatus.bind(this.game_stream),this.game_stream.updatedTime.bind(this.game_stream));
    this.media_stream.addInterface(this.updatedStatus.bind(this));
    
    // The game stream is set to the initial (starting) position
    this.game_stream.update(0);
};

DisplayGUI.prototype.updatedStatus = function(newstatus) {
    if (newstatus.failed) {
        // TODO: should load the fallback media stream...
        alert("Media stream loading failed!");
    }
};

DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};

    