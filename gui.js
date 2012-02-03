function DisplayGUI(base_id,sources,media_type,max_duration,width,height) {
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
    this.media_stream=new MediaStream(this.id+"_media_stream",sources,media_type,max_duration,width,height);
    this.media_interface=new MediaInterface(this.id+"_media_interface");
    this.game_stream=new GameStream(this.id+"_game",this.board,max_duration);

    // initialize the HTML elements
    document.body.appendChild(this.game_stream.html);
    document.body.appendChild(this.board.html);
    document.body.appendChild(this.media_stream.html);
    document.body.appendChild(this.media_interface.html);

    // initialize all components
    this.board.init();
    this.media_stream.init();
    this.media_interface.init(this.media_stream);
    this.media_stream.addInterface(this.game_stream.updatedStatus.bind(this.game_stream),this.game_stream.updatedTime.bind(this.game_stream));
    
    // The game stream is set to the initial (starting) position
    this.game_stream.update(0);
};

