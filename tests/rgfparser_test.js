// variables
var rgf, rgfparser, maxDuration;


// Empty rgf parsing
module("Empty rgf parsing", {
    setup: function() {
        rgf="";
        rgfparser=new RGFParser;
        rgfparser.loadRGF("");
    },
    teardown: function() {
        rgf=undefined;
        rgfparser=undefined;
        maxDuration=undefined;
    }
});
test("Basic RGFParser properties", function(){
    equal(rgfparser.rgf, rgf, "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index, 0, "Character index after parsing (rgfparser.index): "+rgfparser.index);
    equal(rgfparser.duration, undefined, "Maximal time of all actions (rgfparser.duration): "+ ((rgfparser.duration==undefined) ? "undefined" : rgfparser.duration));
});
test("RGF Tree", function(){
    var root=new RGFNode();
    deepEqual(rgfparser.rgftree, root, "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    var unsortedActions=[];
    var sortedActions=[];
    deepEqual(rgfparser.rgftree._getUnsortedActions(),unsortedActions, "Step 1: Unsorted Action List created by rgfparser._getUnsortedActions(rgfparser.rgftree), it contains temporary node position information");
    deepEqual(RGFNode._sortActions(rgfparser.rgftree._getUnsortedActions()),sortedActions, "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.actionList,sortedActions, "Step 3: The Action List created by rgfparser.rgftree.getActions(), it should be the same as <result from above> => (rgfparser.actionList): "+rgfparser.actionList);
});
test("Writing RGF", function(){
    equal(rgfparser.rgftree.writeRGF(),"", "Generated RGF file, with standard indentations, created by rgfparser.rgftree.writeRGF(): "+rgfparser.rgftree.writeRGF());
    equal(rgfparser.rgftree.writeRGF("  "),"", "Generated RGF file, with 2 indentations, created by rgfparser.rgftree.writeRGF(\"<2 spaces>\"): "+rgfparser.rgftree.writeRGF("  "));
    equal(rgfparser.rgftree.writeRGF(""),"", "Generated RGF file, without indentations, created by rgfparser.rgftree.writeRGF(\"\"): "+rgfparser.rgftree.writeRGF(""));
});
test("Consistency", function(){
    var newRgfparser=new RGFParser;
    newRgfparser.loadRGF(rgfparser.rgftree.writeRGF());
    deepEqual(rgfparser.rgftree,newRgfparser.rgftree,"The generated RGF should give the same tree as the original one...");
});


// Empty rgf parsing
module("Simple RGF tree parsing", {
    setup: function() {
        rgf=";B[aa]VT[N]TS[49]VT[ENDED]TS[50](;W[bb]VT[N]TS[19];TS[20]B[dd]TS[20])(;W[bc]AB[ef][fg]VT[N]TS[29]AW[cd]TS[30]AB[gh]TS[40])";
        rgfparser=new RGFParser;
        rgfparser.loadRGF(rgf);
        maxDuration=50;
    },
    teardown: function() {
        rgf=undefined;
        rgfparser=undefined;
        maxDuration=undefined;
    }
});
test("Basic RGFParser properties", function(){
    //equal(rgfparser.rgf, rgfparser.rgftree.writeRGF()), "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index, rgf.length, "Character index after parsing (rgfparser.index): "+rgfparser.index);
    equal(rgfparser.maxDuration, maxDuration, "Maximal time of all actions (rgfparser.maxDuration): "+ ((rgfparser.maxDuration==undefined) ? "undefined" : rgfparser.maxDuration));
});
test("RGF Tree", function(){
    // here we construct the tree manually
    var root=new RGFNode();
    root.addNode(new RGFNode());
        root.children[0].addProp(new RGFProperty("B","aa"));
        root.children[0].addNode(new RGFNode());
            root.children[0].children[0].addProp(new RGFProperty("W","bb"));
            root.children[0].children[0].addProp(new RGFProperty("VT","N",19));
            root.children[0].children[0].addNode(new RGFNode(20));
                root.children[0].children[0].children[0].addProp(new RGFProperty("B","dd",20));
        root.children[0].addNode(new RGFNode());
            root.children[0].children[1].addProp(new RGFProperty("W","bc"))
            root.children[0].children[1].addProp(new RGFProperty("AB","ef"))
            root.children[0].children[1].addProp(new RGFProperty("AB","fg"))
            root.children[0].children[1].addProp(new RGFProperty("VT","N",29));
            root.children[0].children[1].addProp(new RGFProperty("AW","cd",30))
            root.children[0].children[1].addProp(new RGFProperty("AB","gh",40))
        root.children[0].addProp(new RGFProperty("VT","N",49));
        root.children[0].addProp(new RGFProperty("VT","ENDED",50));
    ok(_.isEqual(rgfparser.rgftree,root), "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    // here we construct the (un)sorted action lists manually
    var unsortedActions=[];
    unsortedActions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "",     _nodePos: "0"     } );
    unsortedActions.push( {time:  -1, counter: 0, name:  "B", arg:    "aa", position: "0"                        } );
    unsortedActions.push( {time:  49, counter: 0, name: "VT", arg:     "N", position: "0"                        } );
    unsortedActions.push( {time:  50, counter: 0, name: "VT", arg: "ENDED", position: "0"                        } );
    unsortedActions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "0",    _nodePos: "0.0"   } );
    unsortedActions.push( {time:  -1, counter: 0, name:  "W", arg:    "bb", position: "0.0"                      } );
    unsortedActions.push( {time:  19, counter: 0, name: "VT", arg:     "N", position: "0.0"                      } );
    unsortedActions.push( {time:  20, counter: 0, name:  ";", arg:      "", position: "0.0",  _nodePos: "0.0.0" } );
    unsortedActions.push( {time:  20, counter: 0, name:  "B", arg:    "dd", position: "0.0.0"                    } );
    unsortedActions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "0",    _nodePos: "0.1"   } );
    unsortedActions.push( {time:  -1, counter: 0, name:  "W", arg:    "bc", position: "0.1"                      } );
    unsortedActions.push( {time:  -1, counter: 0, name: "AB", arg:    "ef", position: "0.1"                      } );
    unsortedActions.push( {time:  -1, counter: 0, name: "AB", arg:    "fg", position: "0.1"                      } );
    unsortedActions.push( {time:  29, counter: 0, name: "VT", arg:     "N", position: "0.1"                      } );
    unsortedActions.push( {time:  30, counter: 0, name: "AW", arg:    "cd", position: "0.1"                      } );
    unsortedActions.push( {time:  40, counter: 0, name: "AB", arg:    "gh", position: "0.1"                      } );

    var sortedActions=[];
    sortedActions.push(   {time:  -1, counter: 0, name:  ";", arg:      ""                    } );
    sortedActions.push(   {time:  -1, counter: 0, name:  "B", arg:    "aa"                    } );
    sortedActions.push(   {time:  -1, counter: 0, name:  ";", arg:      ""                    } );
    sortedActions.push(   {time:  -1, counter: 0, name:  "W", arg:    "bb"                    } );
    sortedActions.push(   {time:  -1, counter: 0, name:  ";", arg:      "", position: "0"     } );
    sortedActions.push(   {time:  -1, counter: 0, name:  "W", arg:    "bc"                    } );
    sortedActions.push(   {time:  -1, counter: 0, name: "AB", arg:    "ef"                    } );
    sortedActions.push(   {time:  -1, counter: 0, name: "AB", arg:    "fg"                    } );
    sortedActions.push(   {time:  19, counter: 0, name: "VT", arg:     "N", position: "0.0"   } );
    sortedActions.push(   {time:  20, counter: 0, name:  ";", arg:      ""                    } );
    sortedActions.push(   {time:  20, counter: 0, name:  "B", arg:    "dd"                    } );
    sortedActions.push(   {time:  29, counter: 0, name: "VT", arg:     "N", position: "0.1"   } );
    sortedActions.push(   {time:  30, counter: 0, name: "AW", arg:    "cd"                    } );
    sortedActions.push(   {time:  40, counter: 0, name: "AB", arg:    "gh"                    } );
    sortedActions.push(   {time:  49, counter: 0, name: "VT", arg:     "N", position: "0"     } );
    sortedActions.push(   {time:  50, counter: 0, name: "VT", arg: "ENDED"                    } );

    deepEqual(rgfparser.rgftree._getUnsortedActions(),unsortedActions, "Step 1: Unsorted Action List created by rgfparser.rgftree._getUnsortedActions(), it contains temporary node position information");
    deepEqual(RGFNode._sortActions(rgfparser.rgftree._getUnsortedActions()),sortedActions, "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.actionList,sortedActions, "Step 3: The Action List created by rgfparser.rgftree.getActions(), it should be the same as <result from above> => (rgfparser.actionList)");
});
test("Writing RGF", function(){
    finalRgf="";
    finalRgf+="("+"\n";
    finalRgf+="    ;B[aa] VT[N]TS[49] VT[ENDED]TS[50]" + " \n";
    finalRgf+="    (" + "\n";
    finalRgf+="        ;W[bb] VT[N]TS[19]" + " \n";
    finalRgf+="        ;TS[20] B[dd]TS[20]" + " \n";
    finalRgf+="    )" + "\n";
    finalRgf+="    (" + "\n";
    finalRgf+="        ;W[bc] AB[ef][fg] VT[N]TS[29] AW[cd]TS[30] AB[gh]TS[40]" + " \n";
    finalRgf+="    )" + "\n";
    finalRgf+=")"+"\n";

    equal(rgfparser.rgf,finalRgf, "Generated RGF file, with standard indentations, created by rgfparser.rgftree.writeRGF()");
});
test("Consistency", function(){
    var newRgfparser=new RGFParser;
    newRgfparser.loadRGF(rgfparser.rgftree.writeRGF());
    ok(_.isEqual(rgfparser.rgftree,newRgfparser.rgftree),"The generated RGF should give the same tree as the original one...");
});
