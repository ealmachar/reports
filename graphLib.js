/*

Constructs a Raster Plot instance and appends itself onto the calling container

*/

function createRasterPlot(containerName, cells, dataInterval, start, animations) {

	// D3 plot basics for drawing axes found here:
	// http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337

	var context;
	var canvas;
	
	var reportingCells = cells.slice(0);

	var width, height, oldw, oldh;
	var Data_url;
	
	var marginTop, marginBottom, marginLeft, marginRight,
		yAxisBuffer;
	
	var svg;
	
	var xDomain, yDomain;
	var xAxis, yAxis;
	var numberOfXTicks;
	var numberOfYTicks;

	var data = [];
	var pastData = [];
	var liveData = [];
	var forwardData = [];

	var appendingData = [];

	var assignedColors = [];
	var dotPointers = [];
	var currentDotColorChange;

	var g;
	/*
	var graphID = parseInt(containerName.split("graph")[1])
	var svgID = "graph"+graphID+"_SVG";
	*/
	
	var graphID = parseInt(containerName.split("PLOT")[1])
	var svgID = "PLOT"+graphID+"_SVG";
	var slider = $("#PLOT"+graphID+"-slider");
	
	var transitionDuration = dataInterval;
	
	var svgDocument;
	var serializer;
	
	var svg_str;
	
	var encoder;
	var transitionsOn = animations;
	
	var domainStart = start- transitionDuration*100;
	var domainEnd = start;
	var domainInterval, domainBuffer, domainBufferScale = .2;

	var latestTimeValue;
	var tickTime, differenceInPercent, oldTime;

	var pauseDataUpdate = false;

	var drawing = false;
	var captureFormat = "GIF";
	
	var recordTimer = -1;
	var numberOfSlides;
	
	var zoomModifier = 0.1;
	var zoomClicked = false;
	
	var updating = true;
	var upToDate = true;
	var paused = false;
	
	var init = function(){
		
		initDimensions();
		
		marginTop = 10;
		marginBottom = 17;
		marginLeft = 40;
		marginRight = 20;
		yAxisBuffer = 20;
			
		svg = d3.select(containerName)
			.append("svg")
			.attr("class", svgID)
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("xmlns", "http://www.w3.org/2000/svg");

		recalculateXDomain();
		recalculateYDomain();

//		xDomain = d3.scale.linear().domain([domainStart, domainEnd]).range([marginLeft, width-marginRight]);
//		yDomain = d3.scale.linear().domain([d3.max(reportingCells), d3.min(reportingCells)]).range([marginTop, height-marginBottom]);
			
//		xAxis = d3.svg.axis().scale(xDomain).orient("bottom");
//		yAxis = d3.svg.axis().scale(yDomain).orient("left");
/*
		svg.append("rect")
			.attr("width", "100%")
			.attr("height", height-marginBottom)
			.attr("fill", "white");	
*/			

		svg.append("rect")
			.attr("id", "plot"+graphID+"_whitebg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "white")
			.attr("visibility", "hidden");	

		svg.append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", width)
			.attr("height", height);

		svg.append("g")
			.attr("id", "plot" + graphID + "-xaxis")
			.attr("class", "axis xaxis")
			.attr("transform", "translate(0, "+(height-marginBottom)+")")
			.call(xAxis)
			.selectAll("path, line")
			.style("fill", "none")
			.style("stroke", "#eee");

		// simple plot basics using D3, help found here:
		//http://bl.ocks.org/bunkat/2595950
		g = svg.append("svg:g").attr("id", "dots");

		g.selectAll("scatter-dots")
			.data(data)
				.enter().append("svg:circle")
				.attr("class", "rasterData")
				.attr("cx", function (d) { return xDomain(d[0]); } )
				.attr("cy", function (d) { return yDomain(d[1]); } )
				.attr("r", 2);

		svg.append("rect")
			.attr("id", "plot"+graphID+"_whiteBgYaxisLeft")
			.attr("width", (marginLeft-yAxisBuffer)+"px")
			.attr("height", "100%")
			.attr("fill", "white");

		svg.append("g")
			.attr("class", "axis yaxis")
			.attr("transform", "translate("+(marginLeft-yAxisBuffer)+", 0)")
			.call(yAxis)
			.selectAll("path, line")
			.style("fill", "none")
			.style("stroke", "#eee");
			
		svg.selectAll("text")
			.style("font-family", "sans-serif")
			.style("font-size", "11px");

		calculateDomainInterval();

		reportingCells.forEach(function(d,i){
			pastData[i] = [];
			liveData[i] = [];
			forwardData[i] = [];
		});
	}
	
	var initDimensions = function(){
		width = $(containerName).width();
		height = $(containerName).height();
	}
	
	var calculateDomainInterval = function(){
		var domainDifference = domainEnd - domainStart;
		domainBuffer = domainDifference * domainBufferScale;
		domainInterval = domainDifference + domainBuffer;
	}

	var recalculateXDomain = function(){
		numberOfXTicks = width/100;
//		console.log(domainInterval);
/*
		xDomain = d3.scale.linear().domain([domainStart, domainEnd]).range([marginLeft, width-marginRight]);
		xAxis = d3.svg.axis().scale(xDomain).orient("bottom");*/
		xDomain = d3.time.scale().domain([domainStart, domainEnd]).range([marginLeft, width-marginRight]);
		xAxis = d3.svg.axis().scale(xDomain).orient("bottom").tickFormat(d3.time.format("%X")).ticks(numberOfXTicks);
	}

	var recalculateYDomain = function(){
		numberOfYTicks = height/20;
		yDomain = d3.scale.linear().domain([d3.max(reportingCells), d3.min(reportingCells)]).range([marginTop, height-marginBottom]);
		yAxis = d3.svg.axis().scale(yDomain).orient("left").ticks(numberOfYTicks);
	}
	
	var setDimensions = function(){
	
		/*
		 * the Dimensions are set to the current width and height global variables.
		 * unless they are changed, dimensions will stay the same
		 */
		recalculateYDomain();

//		yDomain = d3.scale.linear().domain([d3.max(reportingCells), d3.min(reportingCells)]).range([marginTop, height-marginBottom]);
//		yAxis = d3.svg.axis().scale(yDomain).orient("left").ticks(height/20);

		if((oldh-height)!=0){
		
			svg.selectAll(".yaxis")
				.call(yAxis);
				
				
			svg.selectAll("g .axis.xaxis")
				.transition()
				.duration(transitionDuration)
				.ease("linear")
				.call(xAxis);
				
			svg.selectAll(".xaxis")
				.attr("transform", "translate(0, "+(height-marginBottom)+")");
		}
	}

	this.getDimensions = function(){
		return [domainStart, domainEnd];
	}

	this.manuallySetDimensions = function(start, end){
//		if(isSliderAtEnd())
//			slider.slider("option", "max", domainEnd);

		updating = false;

		domainStart = start;
		domainEnd = end;
		calculateDomainInterval();

		updateGraph();
		recalculateXDomain();
		redrawXAxis(true);

//		updateSlider(true);
	}
	
	var dimensionsChanged = function(){
		oldw = width;
		oldh = height;
		
		// refresh width and height variables
		initDimensions();
		
		if(oldw-width != 0 || oldh-height != 0)
			return true;
		else
			return false;
	}

	var updateDomain = function(){

		difference = latestTimeValue - domainEnd;
		
		if(typeof latestTimeValue != 'undefined' && updating){
			if(difference < 0){
				difference *= Math.pow((Math.exp(difference*.001)-1), 2);
				upToDate = true;
			}
			else{
//console.log("                                                       PLOT: " + difference);
				difference *= Math.pow((Math.exp(-difference*.001)-1), 2);
				upToDate = true;
			}
		}
		
		if(!updating){
			difference = 0;
		}
		

		if(!paused){
			domainEnd += transitionDuration + difference;
			domainStart += transitionDuration + difference;
		}
	}

	var addDotsToSVG = function(arrayOfDots){

		g.selectAll("scatter-dots")
			.data(arrayOfDots)
			.enter()
			.append("svg:circle")
			.attr("class", "rasterData")
			.attr("fill", function(d) {
				var color = "#222";
				var found = false;

				for(var i = 0; !found && i < assignedColors.length; i++){
					if(d[1] == assignedColors[i][0]){
						color = assignedColors[i][1];
						found = true;
					}

					if(d[1] == currentDotColorChange){
						dotPointers.push(d3.select(this));
					}
				}

				return color;
			})
			.attr("id", function (d) { return d[0] + " " + d[1]; })
			.attr("cx", function (d) { return xDomain(d[0]); })
			.attr("cy", function (d) { return yDomain(d[1]); })
			.attr("r", 2);


/*
		g.selectAll("scatter-dots")
			.data(arrayOfDots)
			.exit()
			.remove();*/
	}

	var removeDotsFromSVG = function(){

		g.selectAll(".rasterData").select(function(d,i){
			var id = parseInt(d3.select(this).attr("id"));

			if(id < domainStart - domainBuffer)
				d3.select(this).remove();
			else if(id > domainEnd + domainBuffer)
				d3.select(this).remove();
		});

		console.log($("#plot" + graphID + "-xaxis").children().length);

/*
		for(var k = 0; $("#plot" + graphID + "-xaxis").children().length > 2 * numberOfXTicks; k++){
			$("#plot" + graphID + "-xaxis g:first-child").remove();
		}*/
	}



	var updateData = function(){
		var temp;

		forwardData.forEach(function(d,i){
			while(d.length > 0){
				temp = d.shift();
				liveData[i].push(temp);
				appendingData.push(temp);
			}

		});
	}
	
	/*
	finds the time value of the very left hand side of the graph
	and returns it
	*/
	var findLowerBound = function(){

		var lowerBound = [];

		liveData.forEach(function(d,i){
			if(d.length > 0)
				lowerBound.push(d[0][0]);
		});

		return Math.min.apply(null, lowerBound);
	};
	
	/*
	finds the time value of the very right hand side of the graph
	and returns it
	*/
	var findUpperBound = function(dataSet){
		var upperBound = [];

		liveData.forEach(function(d,i){
			if(d.length > 0)
				upperBound.push(d[d.length - 1][0]);
		});

		return Math.max.apply(null, upperBound);
	};
	
	/*
	for the current graph, finds the maximum length of the dataset
	given in the parameter. The number of data sets in the parameter
	could be more than one, and finds the maximum of them
	*/
	var getDataMaxLength = function(sampleDataSet){
/*
		var maxLength = 0;
		
		sampleDataSet.forEach(function(d,i){
			if(d.length > maxLength)
				maxLength = d.length;
		});
		return maxLength;*/
	}
	
	var clipData = function(){
		var dataTrimmed;
		var temp;

		reportingCells.forEach(function(d,i){

			dataTrimmed = false;

			while(liveData[i].length > 0 && !dataTrimmed){

				if(liveData[i][0][0] < domainStart){
					temp = liveData[i].shift();
					pastData[i].push(temp);
				}
				else
					dataTrimmed = true;
			}

			dataTrimmed = false;

			while(pastData[i].length > 0 && !dataTrimmed){

				var pastDataLength = pastData[i].length;
//				console.log(pastData[i].length + " " + pastData[i][pastDataLength - 1]);
				var pastLastElement = pastData[i][pastDataLength - 1][0];

				if(pastLastElement > domainStart){
					temp = pastData[i].pop();
					liveData[i].unshift(temp);
					appendingData.push(temp);
				}
				else
					dataTrimmed = true;
			}

			dataTrimmed = false;

			while(liveData[i].length > 0 && !dataTrimmed){

				var liveDataLength = liveData[i].length;
				var liveLastElement = liveData[i][liveDataLength - 1][0];

				if(liveLastElement > domainEnd){
					temp = liveData[i].pop();
					forwardData[i].unshift(temp);
				}
				else
					dataTrimmed = true;
			}

			dataTrimmed = false;

			while(forwardData[i].length > 0 && !dataTrimmed){

				if(forwardData[i][0][0] < domainEnd){
					temp = forwardData[i].shift();
					liveData[i].push(temp);
					appendingData.push(temp);
				}
				else
					dataTrimmed = true;
			}

		});
		
	};

	var updateGraph = function(){
		clipData();
/*
		var test = [];

		liveData.forEach(function(d,i){
			test.push(d.length);
		});

		console.log(appendingData);
*/

		removeDotsFromSVG();

		addDotsToSVG(appendingData);
		appendingData = [];


	}

	var times = [];

	var tick = function (){

		/*
		Used for timing purposes
		*/
		var d = new Date().getTime();
		tickTime = d-oldTime;
		oldTime = d;
		//differenceInPercent = (tickTime-transtionDuration)/transitionDuration;

		times.push(tickTime);

		while(times.length > 60)
			times.shift();

		var sum = times.reduce(function(a,b){
			return a + b;
		});

		var average = sum/times.length;

//		console.log("                                                             PLOT: " + transitionDuration + " " + tickTime + " " + average + " " + times.length);

//		yDomain = d3.scale.linear().domain([50, 0]).range([marginTop, height-marginBottom]);
		
		if(recordTimer>=0)
			recordTick(captureFormat);

		updateDomain();

		if(upToDate)
			updateData();

		updateGraph();

//		updateSlider(false);

		recalculateXDomain();
		recalculateYDomain();

		redrawXAxis(transitionsOn);
	}

	var redrawPlotOnce = function(){

		recalculateXDomain()

		updateGraph();

		svg.selectAll(".rasterData")
			.attr("cx", function (d) { return xDomain(d[0]); } )
			.attr("cy", function (d) { return yDomain(d[1]); } );

		svg.selectAll(".xaxis")
			.call(xAxis);

	}


	var redrawXAxis = function(transitions){

/*
		setTimeout(function(){

		}, transitionDuration);
*/
		if(transitions){
		
			svg.selectAll(".rasterData")
				.transition()
					.duration(transitionDuration)
					.ease("linear")
					.attr("cx", function (d) { return xDomain(d[0]); } )
					.attr("cy", function (d) { return yDomain(d[1]); } );

			svg.selectAll(".xaxis")
				.transition()
					.duration(transitionDuration)
					.ease("linear")
					.call(xAxis)
					.each("end", function(d,i){
						if(i == 0){
							if(!paused)
								tick();
						}
					});
		}		
		else{
			svg.selectAll(".rasterData")
				.transition()
					.duration(0)
					.delay(transitionDuration)
					.attr("cx", function (d) { return xDomain(d[0]); } )
					.attr("cy", function (d) { return yDomain(d[1]); } );

			svg.selectAll(".xaxis")
				.transition()
					.duration(0)
					.delay(transitionDuration)
					.call(xAxis)
					.each("end", function(d,i){
						if(i == 0){
							if(!paused)
								tick();
						}
					});
/*
			svg.selectAll(".xaxis")
					.transition()
					.duration(0)
					.delay(transitonDuration)
					.call(xAxis)
						this.getDimensions = function(){
		return [domainStart, domainEnd]
	}.each("end", function(d,i){
						if(i == 0)
							tick();
					});*/
		}
	}
	

	
	this.getReportingCells = function(){
		return reportingCells;
	}
	
	this.zoomIn = function(){
		domainStart += domainInterval * zoomModifier;
		calculateDomainInterval();
//		redrawXAxis();
	}
	
	this.zoomOut = function(){
		domainStart -= domainInterval * zoomModifier;
		calculateDomainInterval();
//		redrawXAxis();
	}

	/*
	initialize the recording process
	*/
	this.startRecording = function(slideLength, pictureFormatInit){

		svgDocument = d3.selectAll("."+svgID)[0][0];

		// grabs the SVG string of the graph
		serializer = new XMLSerializer();
		svg_str = serializer.serializeToString(svgDocument);

		// initialize the GIF encorder
		encoder = new GIFEncoder();
		encoder.setRepeat(0);
		encoder.setDelay(250);
		encoder.start()
	
		captureFormat = pictureFormatInit;

		numberOfSlides = slideLength;
	
		if(captureFormat == "SVG")
			numberOfSlides = 1;
	
		recordTimer=0;
	}
	
	var recordTick = function(format){

		var pointer;
		if (recordTimer==0){
			canvas = document.getElementById('canvasExample');

			/*
			 * show white background
			 * update its dimensions
			 */
			pointer = $("#plot"+graphID+"_whitebg");
			pointer.attr("visibility","visible");
			pointer.css("width", width.toString()+"px");
			pointer.css("height", height.toString()+"px");
		console.log("values: " + width.toString() + " " + height.toString());
		console.log("before: " + $("#plot"+graphID+"_whitebg").attr("width") + " " + $("#plot"+graphID+"_whitebg").attr("height"));

			svg.style("width", width.toString()+"px")
				.style("height", height.toString()+"px");

			svg.select(".axis")
				.selectAll("path, line")
				.style("fill", "none")
				.style("stroke", "#eee");

			svg.select(".axis")
				.selectAll("text")
				.style("font-family", "sans-serif")
				.style("font-size", "11px");
			
			recordTimer++;
		}


		if (recordTimer >= 0 && recordTimer <= numberOfSlides){	

			svg.select(".axis")
				.selectAll("path, line")
				.style("fill", "none")
				.style("stroke", "#eee");

			svg.select(".axis")
				.selectAll("text")
				.style("font-family", "sans-serif")
				.style("font-size", "11px");
				
			// grabs the SVG string of the graph
			svg_str = serializer.serializeToString(svgDocument);

			// draws the SVG onto a canvas element
			canvg('canvasExample', svg_str);

			// gets the picture written onto the canvas
			canvas = document.getElementById('canvasExample');
			context = canvas.getContext("2d");
			
			// adds the canvas picture onto the Gif encoder
			encoder.addFrame(context);
			recordTimer++;
		}
		else if (recordTimer >= numberOfSlides)
			finalizeRecording();
	}
	
	/*
	finish the recording process and save to file
	*/
	var finalizeRecording = function(){

		encoder.finish();

		var binary_gif = encoder.stream().getData()
		var data_url;
		
		var a = document.createElement('a');
		a.target = '_blank';
		
		if(captureFormat == "SVG"){
			data_url = 'data:application/octet-stream;base64,' + btoa(svg_str);
			a.download    = 'myFile.svg';
		}
		else{
			data_url = 'data:image/gif;base64,'+encode64(binary_gif);
			a.download    = 'myFile.gif';
		}

		a.href = data_url;

		document.body.appendChild(a);
		a.click();

		$("."+svgID).css("width", "100%");
		$("."+svgID).css("height", "100%");

		$("#plot"+graphID+"_whitebg").attr("visibility","hidden");

		console.log("after: " + $("#plot"+graphID+"_whitebg").attr("width") + " " + $("#plot"+graphID+"_whitebg").attr("height"));

		recordTimer=-1;

		global_flag = false;
	}
	
	this.takePicture = function(captureFormatInit){
		this.startRecording(1, captureFormatInit);
		recordTick(captureFormatInit);
		finalizeRecording();
	}
	
	this.setAnimation = function(state){
		transitionsOn = state;
	}

	this.setTransitionDuration = function(newTime){
		transitionDuration = newTime;
	}
	
	this.pause = function(){
		updating = false;
		upToDate = false;
		paused = true;
	}

	this.play = function(){
		if(paused)
			tick();
		paused = false;
	}
	
	this.goToEnd = function(){
		updating = true;
	}

	this.setState = function(pausedState, updatingState){
		paused = pausedState;
		updating = updatingState;
	}

	this.getState = function(){
		return [paused, updating];
	}
	
	this.getLastTimeTick = function(){
		return latestTimeValue;
	}

	this.getID = function(){
		return graphID;
	}
	
	this.updateToSlider = function(newDomainEnd){

		domainEnd = newDomainEnd;
		domainStart = domainEnd - domainInterval + domainBuffer;
		redrawPlotOnce();		
//		redrawXAxis(false);
	}
	
	var updateSlider = function updateSlider(value){
		slider.slider("value", value);
	}

	var isSliderAtEnd = function (){
		return slider.slider("option", "value") == slider.slider("option", "max");
	}

	this.setCurrentDot = function(dotID){
		currentDotColorChange = dotID;
	}

	this.updateColors = function(dotID, color){
		dotPointers.forEach(function(d,i){
			d.attr("fill", color);
		});

		var found = false;

		for(var i = 0; !found && i < assignedColors.length; i++){
			if(dotID == assignedColors[i][0]){
				assignedColors[i][1] = color;
				found = true;
			}
		}
	}

	this.updateDotPointer = function(dotID, color){
		dotPointers = [];
		assignedColors.push([dotID, color]);

		g.selectAll(".rasterData").select(function(d,i){
			var id = d3.select(this).attr("id");
			var cell = id.split(" ")[1];

			if(cell == dotID)
				dotPointers.push(d3.select(this));
		});
	}

	
	var drawing = false;

	this.slideData = function(time, incomingData){
//console.log("PLOT: " + $("#PLOT"+graphID+"-slider").slider( "option", "max" ) + " " + $("#GRAPH"+graphID+"-slider").slider( "option", "max" ) + " GRAPH");
		latestTimeValue = time;

		if (dimensionsChanged())
			setDimensions();

		incomingData.forEach(function(d,i){
			if(d[1]>32){
				var newElement = [d[0],i];
				forwardData[i].push(newElement);
			}
		});

		updateSlider(domainEnd);

		slider.slider("option", "max", latestTimeValue);
		
		if(!drawing){
			oldTime = new Date().getTime() - 1;
			drawing = true;
			tick();
		}
	}
	

	
	init();
};

