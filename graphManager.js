

/*

Many of the functions written here have to do with the construction of the HTML container
that would hold the line graph or raster plot. The functions would also add functionality
to the buttons and sliders.


*/


/*
Only one instance of createGraphManager will be created
instantiated in the javascript in templates/pages/reports/reports.html
*/
var createGraphManager = function(){

	var domsArray = new Array();
	var graphID = 0;
	var plotID = 0;

	var graphsArray = new Array();
	var dataArray = new Array();
/*
	var activeCell;
	var activeGraph;
*/
	var promptInputStr;
	var promptInputArr;

	var intervals = [];

	var dataInterval = 300;
	
	var lineGraphs = [];
	var rasterPlots = [];
	var runningIntervals = [];
	
	var time = new Date().getTime();
	var dataGenerator;
	var runningGraphs;
	
	var dataSet=[];
	var dataSetFront=[];
	var totalValues;

	var animations = true;
	/*
	returns the graph instance by type and ID
	*/
	var getGraph = function(type, ID){
		if(type == "GRAPH")
			return lineGraphs[ID];
		else if(type == "PLOT")
			return rasterPlots[ID];
		else
			return null;

	}
	
	/*
	returns the graph's ID
	*/
	var getID = function(type, container){
		return parseInt($(container).attr("id").split(type)[1]);
	}

	var getType = function(container){
		var result;

		if($(container).attr("id")[0] == "P")
			result = "PLOT";
		else if($(container).attr("id")[0] == "G")
			result = "GRAPH";
		else
			result = null;

		return result;
	}

	/*
	prompts the user for input. In this case, cell ID's.
	*/
	var promptForCells = function(inputLineID, numberOfExistingCells){
//		promptInputStr = prompt("Enter up to 4 neuron id's (eg: 1,2,3,4)","");
		var status = true;


		promptInputStr = document.getElementById(inputLineID).value;
		
		document.getElementById(inputLineID).value = "";

		promptInputArr = promptInputStr.split(" ");
		
		if(promptInputStr == undefined)
			return false;

		// error functions

		if (promptInputArr.length + numberOfExistingCells > 4){
			alert("Error: Too many cells");
			return false;
		}
		else if (promptInputArr.length + numberOfExistingCells < 1){
			alert("Error: Needs at least 1 cell");
			return false;
		}

		promptInputArr.forEach(function(d){
			d = parseInt(d);
			if(d < 0){
				alert("Error: Negative cell detected");
				status = false;
			}
			if(isNaN(d)){
				alert("Error: Invalid input");
				status = false;
			}
		});



		return status;
	}
	
	/*
	constructs the very basic HTML that would hold the graph, buttons, slider, etc.
	*/
	var constructContainer = function(type, graphPrefix){
		var elementPntr;
		
		if(putGraphsOnTop){
			$('#sortable-column'+activeReportingColumn).prepend(
				elementPntr = $('<li id="' + graphPrefix +'-portlet_handle" class="portlet_handle"></li>')
			);
		}
		else{
			$('#sortable-column'+activeReportingColumn).append(
				elementPntr = $('<li id="' + graphPrefix +'-portlet_handle" class="portlet_handle"></li>')
			);
		}

		elementPntr.append(
			elementPntr = $('<div id="'+graphPrefix+'-container" class="panel panel-default graph-unit" style="position:relative;"></div>')
		);
		
		var height;
		if(type == "GRAPH")
			height = "180px";
		else
			height = "220px";
		
		elementPntr.append(
			'<div id="'+graphPrefix+'-panel" class="panel-heading" style="position:relative;display:flex;padding: 5px 5px;"></div>' +
			'<div id="'+graphPrefix+'-body" class="panel-body" style="position:relative;width:100%;height:'+ height +';"></div>'+
			'<div id="'+graphPrefix+'-footer" class="panel-footer" style="position:relative;display:none;"></div>'
		);
	}
	
	/*
	constructs the HTML and adds functionality for the buttons found in the panel for each line graph or raster plot
	*/
	var addMainButtons = function(type, containerID, graphPrefix){
		 
		$("#"+graphPrefix+"-panel").append(
			'<span style="font-size: 1.2em;position:relative; padding:5px 10px 5px 5px">' + type + ' ' + containerID + '</span>'+
			'<div class="btn-toolbar" id='+graphPrefix+'-button_toolbar style="position:relative;">'+
				'<div class="btn-group button_list" id="'+graphPrefix+'-cell_button_list"></div>'+
				'<div class="btn-group button_list" id="'+graphPrefix+'-scale_button_list"></div>'+
				'<div class="btn-group button_list" id="'+graphPrefix+'-playback_button_list"></div>'+
			'</div>'
		);
		
		
		var cellButtonList;
		if(type == "GRAPH")
			cellButtonList = '<li><a id="'+graphPrefix+'-menu-button-add" href="#">Add Cell</a></li>';
		else
			cellButtonList = '';
			
		$('#'+graphPrefix+'-cell_button_list').append(
			'<div id="'+graphPrefix+'-menu-container" class="btn-group">'+
				'<button id="'+graphPrefix+'-menu-button" class="btn btn-default dropdown-toggle menu_button" data-toggle="dropdown">Main</button>'+
				'<ul id="'+graphPrefix+'-menu-dropdown" class="dropdown-menu">'+
					cellButtonList +
					'<li><a id="'+graphPrefix+'-menu-button-slider" href="#">Toggle Position Slider</a></li>'+
					'<li><a id="'+graphPrefix+'-menu-button-sync" href="#">Synchronize Graphs in Column</a></li>'+
					'<li><a id="'+graphPrefix+'-menu-button-delete" href="#">Delete Graph</a></li>'+
				'</ul>'+
			'</div>'
		);
		
		if(type == "GRAPH"){

			$("#"+graphPrefix+"-menu-button-add").click(function(event){

				$("#modal-addLine").modal("show");

				/*

				var str = prompt("Enter 1 cell","");
				
				if(str == null)
					return false;
				*/
//				var cell = parseInt(str);
//				var graph = getID(type, this);

				activeGraph = getID(type, this);

//				addLinesToGraph(getID(type, this));

/*				addCellButton(graph,cell);
				lineGraphs[graph].requestAddLine(cell);
*/
				event.preventDefault();
			});
			
			for (var i = 0; i<promptInputArr.length; i++)
				addCellButton(containerID, promptInputArr[i]);
		}
		
		$("#"+graphPrefix+"-menu-button-slider").click(function(event){
			var graph = getID(type, this);
			
			var slider = $("#" + type + graph + "-footer");
			
			var visibility = slider.css("display");
			if(visibility != "none")
				slider.css("display", "none");
			else
				slider.css("display", "block");

			event.preventDefault();
		});

		$("#"+graphPrefix+"-menu-button-sync").click(function(event){
			var graph = getID(type, this);
			syncGraphs(type, graph);

			event.preventDefault();
		});
		
		$("#"+graphPrefix+"-menu-button-delete").click(function(event){
			var graph = getID(type, this);
			
			$("#"+type+graph+"-container").remove();

			event.preventDefault();
		});
	}
	
	/*
	In line graphs, there are cell buttons that users may click and a drop down menu would appear.
	This function adds functionality to that drop down menu.
	*/
	var addCellButton = function (graphID, cell){
		var buttonSuffix = "-cell_button"+cell;
		var graphPrefix = "GRAPH"+graphID;

		var id = graphPrefix + buttonSuffix;
		
		$("#"+graphPrefix+"-cell_button_list").append(		
			'<div id="'+id+'-cell-container" class="btn-group">'+
				'<button id="'+id+'-cell-button" class="btn btn-default dropdown-toggle cell_button" data-toggle="dropdown">'+cell+'</button>'+
				'<ul id="'+id+'-cell-menu" class="dropdown-menu">'+
					'<li><a id="'+id+'-cell-delete" href="#">Remove Cell</a></li>'+
				'</ul>'+
			'</div>'
		);
		
		$('#'+id+'-cell-delete').click(function (event) {
			var cell = parseInt($(this).attr('id').split("cell_button")[1]);
			var graph = getID("GRAPH", this);

			lineGraphs[graph].requestDelete(cell);
			$("#GRAPH"+graph+"-cell_button"+cell+"-cell-container").remove();

			event.preventDefault();
		})
		
		$('#'+id+'-cell-container').on('show.bs.dropdown', function () {
			var cell = parseInt($(this).attr('id').split("cell_button")[1]);
			var graph = getID("GRAPH", this);

			activeCell = cell;
			activeGraph = graph;
		})
		
		scope = angular.element('#'+id+'-cell-menu').scope();
		scope.add('#'+id+'-cell-menu',id);

	}
	
	/*
	Add functionality to the scale buttons:
	"Zoom in," "Zoom out," "Expand up," "Expand down"
	*/
	var addScaleButtons = function(type, graphPrefix){
		
		var elementPntr = $("#"+graphPrefix+"-scale_button_list");
		elementPntr.append('<button id="'+graphPrefix+'-scale_button-" class="btn btn-default"><span class="glyphicon glyphicon-zoom-out"></span></button>');
		elementPntr.append('<button id="'+graphPrefix+'-scale_button+" class="btn btn-default"><span class="glyphicon glyphicon-zoom-in"></span></button>');
		elementPntr.append('<button id="'+graphPrefix+'-scale_button_up" class="btn btn-default"><span class="glyphicon glyphicon-chevron-up"></span></button>');
		elementPntr.append('<button id="'+graphPrefix+'-scale_button_down" class="btn btn-default"><span class="glyphicon glyphicon-chevron-down"></span></button>');
		
		
		// jquery functionallity for menu. Help found here:
		// http://jqueryui.com/button/#splitbutton
		
		$("#"+graphPrefix+"-scale_button-").click(function(){
			var graph = getID(type, this);
			getGraph(type, graph).zoomOut();
		})
		.next()
		.click(function(){
			var graph = getID(type, this);
			getGraph(type, graph).zoomIn();
		})
		.next()
		.click(function(){
			var graph = getID(type, this);
			var body = $("#" + type + graph + "-body");
			
			if(parseInt(body.css("height"))>70){
				body.css("height", "-="+10);
			}
		})
		.next()
		.click(function(){
			var graph = getID(type, this);
			var body = $("#" + type + graph+"-body");
			
			if(parseInt(body.css("height"))<320){
				body.css("height", "+="+10);
			}
		});
	}
	
	/*
	Adds functionality to the play buttons:
	"Play/Pause," "Fast forward," "Record," "Take picture"
	*/
	var addPlaybackButtons = function(type, graphPrefix){
		
		var elementPntr = $("#"+graphPrefix+"-playback_button_list");
		elementPntr.append('<button id="'+graphPrefix+'-playback_button-play" class="btn btn-default" type="button"><span class="glyphicon glyphicon-pause"></span></button>');
		elementPntr.append('<button id="'+graphPrefix+'-playback_button-gotoend" class="btn btn-default" type="button"><span class="glyphicon glyphicon-fast-forward"></span></button>');
		elementPntr.append('<button id="'+graphPrefix+'-playback_button-record" class="btn btn-default" type="button"><span class="glyphicon glyphicon-film"></span></button>');
		elementPntr.append('<button id="'+graphPrefix+'-playback_button-picture" class="btn btn-default" type="button"><span class="glyphicon glyphicon-camera"></span></button>');
		
		
		$("#"+graphPrefix+"-playback_button-play").click(function(){
			var graph = getID(type, this);
			var state = getGraph(type, graph).getState();
			var newState;

			if(state[0])
				newState = "PLAY";
			else
				newState = "PAUSE";

			setPauseOrPlay(newState, type, graph);
		})
		.next()
		.click(function(){
			var graph = getID(type, this);
/*
			getGraph(type, graph).play();
			getGraph(type, graph).goToEnd();
			
			$("#" + type + graph + "-playback_button-play").children().attr("class", "glyphicon glyphicon-pause");
*/
			setPauseOrPlay("PLAY", type, graph);
			getGraph(type, graph).goToEnd();
			
//			putSliderToEnd(type, graph);
		})
		.next()
		.click(function(){
			var graph = getID(type, this);
			/*
			if(rasterPlot!=undefined)
				rasterPlot.pauseTransitions();
			lineGraphs.forEach(function(d){
				d.pauseTransitions();
			});*/
			
			global_flag = true;

			getGraph(type, graph).setAnimation(false);
			
			getGraph(type, graph).startRecording(20, "GIF");

			var wait = setInterval(function(){
				if(global_flag==false){
					getGraph(type, graph).setAnimation(true);
/*
					lineGraphs.forEach(function(d){
						d.resumeTransitions();
					});*/
					clearInterval(wait);
				}
			}, 1000);
		})
		.next()
		.click(function(){
			var graph = getID(type, this);
			getGraph(type, graph).takePicture(pictureFormat);
		});
		
	}

	/*
	Adds the position slider and its functionality
	*/
	var addSlider = function(type, graphPrefix){
		
		$("#"+graphPrefix+"-footer").append(
			'<div id="'+graphPrefix+'-slider" style="position:relative;margin:5px 5px;height:2px;"></div>'
		)
		
		$("#"+graphPrefix+"-slider").slider({
			max: time,
			min: time - 40,
			step: 1,
			create: function() {/*
				var graph = getID(type, this);
				var slider = $("#" + type + graph + "-slider");

				var max = slider.slider( "option", "max" );
				
				slider.slider("value", max);*/
			},
			start: function(){
				setPauseOrPlay("PAUSE", type, getID(type, this));

				var graph = getID(type, this);
				var slider = $("#" + type + graph + "-slider");

				setPauseOrPlay("PAUSE", type, graph);
				
				var max = slider.slider( "option", "max" );
				
				if(slider.slider("value") == max){
					var newMax = getGraph(type, graph).getLastTimeTick();
					slider.slider("option", "max", newMax); 
					slider.slider("value", newMax);
				}
			},
			slide: function(event, ui){
				var graph = getID(type, this);
				var slider = $("#" + type + graph + "-slider");
				
				getGraph(type, graph).updateToSlider(ui.value);
			},
			stop: function(){}
		});
	}
	
	/*
	Create an instance of a Line Graph or a Raster Plot that would be held by the container
	*/
	var createGraph = function(type, containerName){
		var id;

		var cellRange = [];

		for(var i = 1; i <= 50; i++){
			cellRange.push(i);
		}

		if(type == "GRAPH"){
			id = parseInt(containerName.split("GRAPH")[1]);
			lineGraphs[id] = new createLineGraph(containerName, promptInputArr, dataInterval, time, animations);
		}
		else if(type == "PLOT"){
			id = parseInt(containerName.split("PLOT")[1]);
			rasterPlots[id] = new createRasterPlot(containerName, cellRange, dataInterval, time, animations);
		}
	}
	
	/*
	Ultimately adds the HTML container and its graph onto the current web page
	*/
	var addElement = function(type){

		var graphPrefix;
		var buttonSuffix;
		var containerID;

		if(type == "GRAPH"){
			// prompt user for neuron cells			
			if(!promptForCells("createGraphInput", 0))
				return false;

			graphID++;
			containerID = graphID;
			graphPrefix = "GRAPH"+graphID;
		}
		else if(type == "PLOT"){
			plotID++;
			containerID = plotID;
			graphPrefix = "PLOT"+plotID;
		}
	
		constructContainer(type, graphPrefix);
		addMainButtons(type, containerID, graphPrefix);
		addScaleButtons(type, graphPrefix);
		addPlaybackButtons(type, graphPrefix);
		addSlider(type, graphPrefix);
		
		$("#"+graphPrefix+"-body").append(
			'<div id="'+graphPrefix+'-graph" class="aGraph" style="position:relative;width:100%;height:100%;"></div>'
		)

		createGraph(type, "#"+graphPrefix+"-graph");
	}
	
	var addLinesToGraph = function(id){
		var graph = getGraph("GRAPH", id);

//		console.log(graph.getReportingCells().length);
//		console.log(id);

		if(promptForCells("addLineInput", graph.getReportingCells().length)){
//			console.log(promptInputArr, graph.getReportingCells().length);
			promptInputArr.forEach(function(d){
//				console.log(d);
				addCellButton(id, d);
				graph.requestAddLine(d);
			});
		}
	}

	var currentDotColorChange = -1;

	this.changeDotColor = function(dotID, color){
		if(dotID != currentDotColorChange){
			rasterPlots.forEach(function(d,i){
				d.updateDotPointer(dotID, color);
				d.setCurrentDot(dotID);
			});
			currentDotColorChange = dotID;
//			console.log("CHANGED");
		}

		rasterPlots.forEach(function(d,i){
			d.updateColors(dotID, color);
		});
		
	}

	var putSliderToEnd = function(type, graph){
		var slider = $("#" + type + graph + "-slider");

		var newMax = getGraph(type, graph).getLastTimeTick();
		slider.slider("option", "max", newMax); 
		slider.slider("value", newMax);
	}

	var syncGraphs = function(type, caller){

		var siblingType, siblingID;
		var dimensions = getGraph(type, caller).getDimensions();
		var state;

		if(getGraph(type, caller).getState()[0])
			state = "PAUSE";
		else
			state = "PLAY";

		$("#" + type + caller + "-portlet_handle").siblings().each(function(i){
			siblingType = getType(this);
			siblingID = getID(siblingType, this);

			getGraph(siblingType, siblingID).manuallySetDimensions(dimensions[0], dimensions[1]);
			setPauseOrPlay(state, siblingType, siblingID);
//			getGraph(siblingType, siblingID).setState(state[0], state[1]);
		});
	}

	var setPauseOrPlay = function(state, type, graph){
		var icon = $("#" + type + graph + "-playback_button-play").children();
		if(state == "PLAY"){
			getGraph(type, graph).play();
			icon.attr("class", "glyphicon glyphicon-pause");
		}
		else{
			getGraph(type, graph).pause();
			icon.attr("class", "glyphicon glyphicon-play");
		}
	}

	var togglePauseAll = function(paused){
		var icon = $("#control_panel-playback_button-play").children();
		var state;

		if(paused){
			state = "PLAY";
			icon.attr("class", "glyphicon glyphicon-pause");
			allPaused = false;
		}
		else{
			state = "PAUSE";
			icon.attr("class", "glyphicon glyphicon-play");
			allPaused = true;
		}

		lineGraphs.forEach(function(d){
			setPauseOrPlay(state, "GRAPH", d.getID());
		});
		rasterPlots.forEach(function(d){
			setPauseOrPlay(state, "PLOT", d.getID());
		});
	}

	var allGoToEnd = function(){
		togglePauseAll(true);
		lineGraphs.forEach(function(d){
			d.goToEnd();
//			putSliderToEnd("GRAPH", d.getID());
		});
		rasterPlots.forEach(function(d){
			d.goToEnd();
//			putSliderToEnd("PLOT", d.getID());
		});
	}

	var toggleAnimations = function(state){
		lineGraphs.forEach(function(d){
			d.setAnimation(state);
		});
		rasterPlots.forEach(function(d){
			d.setAnimation(state);
		});
	}

	/*
	Initializes the control panel that the users interact with to use the webpage
	*/
	var initializeControlPanel = function(){

//		document.getElementById("createGraphButton").onclick = addElement("GRAPH");


		$("#createGraphButton").click(function(){
			addElement("GRAPH");
		});
		
		$("#createPlotButton").click(function(){
			addElement("PLOT");
		});

		$("#control_panel-playback_button-play").click(function(){
			togglePauseAll(allPaused);
		});

		$("#control_panel-playback_button-gotoend").click(function(){
			allGoToEnd();
		});

		$("#addLineButton").click(function(){
			addLinesToGraph(activeGraph);
		});

		$("#control_panel-report-time_of_last").html("Status updated: "+Date());
	}
	
	/*
	Initializes the current sample data
	*/
	var dataInit = function(){
	
		/* 
		 * hard copy sample data into dataSet
		 * dataSet will by cyclic
		 */

		var i;
		var tempArray;
		totalValues = data["values"].length;
		
		dataSetFront = [];
		
		for(i=0; i<totalValues; i++)
		{
			dataSet[i] = data["values"][i].slice();
			dataSetFront[i]=dataSet[i][0];
		}
	}

	/*
	cycles through the data and prepares it for feeding for the graphs
	*/
var oldTime;
	var runData = function(){
		dataGenerator = setInterval(function(){
			var i, temp;
			dataSetFront = [];
			oldTime = time;
//			time = new Date().getTime();
			time += dataInterval;

			
			for(i=0; i<totalValues; i++)
			{
				temp=dataSet[i].shift();
				dataSetFront[i]=[time, temp];
				dataSet[i].push(temp);
			}
		},dataInterval);
	}

	/*
	Feeds the data to the graphs
	*/
	var runGraphs = function(){
		runningGraphs = setInterval(function(){

			var cells;
			var appendDataSet;

			rasterPlots.forEach(function(d){
				d.slideData(time, dataSetFront);
			});
			
			lineGraphs.forEach(function(d){
				cells = d.getReportingCells();
				appendDataSet = [];

				cells.forEach(function(d){
					appendDataSet.push(dataSetFront[d]);
				});

				d.slideData(time, appendDataSet);
			});
		},dataInterval);
	}

	initializeControlPanel();
	dataInit();
	runData();
	runGraphs();

}
