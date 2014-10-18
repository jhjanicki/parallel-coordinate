//global variables
var keyArray=["Nemonychidae","Anthribidae","Attelabidae","Brentidae"];
var expressed = keyArray[3];



//display which family is expressed
/*
d3.select("body").append("p").text(expressed);
d3.select("body").append("p").text(keyArray[0]+" "+keyArray[1]+" "+keyArray[2]+" "+keyArray[3]);
*/

window.onload=initialize();

function initialize(){
	setMap();
}

function setMap(){

	
	var width = 1200;
	var height= 700;
	
	
	var map= d3.select("#wrapper")
			.append("svg")
			.attr("width",width)
			.attr("height",height)
			.attr("id","main");
	//use svg to render 2d geometry, also need projection and path generator
	
			

	var projection = d3.geo.albers()
	    .rotate([96, 0])
	    .center([6.6, 44.7])
	    .parallels([29.5, 45.5])
	    .scale(5000)
	    .translate([width / 2, height / 2])
	    .precision(.1);
		
	
	var graticule = d3.geo.graticule()
	    .extent([[-98 - 45, 38 - 45], [-98 + 45, 38 + 45]])
	    .step([5, 5]);
	    
	var path = d3.geo.path()
	    			.projection(projection);
	//Creates a new geographic path generator
	
	/* note add graticule to map after projection */
	map.append("path")
	    .datum(graticule)
	    .attr("class", "graticule")
	    .attr("d", path);
	    
	    var gratBackground=map.append("path")
	    	.datum(graticule.outline)
	    	.attr("class","gratBackground")
	    	.attr("d",path)
	    	
	    var gratLines=map.selectAll(".gratLines")
	    	.data(graticule.lines)
	    	.enter()
	    	.append("path")
	    	.attr("class","gratLines")
	    	.attr("d",path);
	
	
	
	
	
	
	d3.json("data/states.topojson", function(error, wi){
	//wi now represents the json data we passed in
	/* console.log(wi); */
	
	var counties = map.append("path")
		.datum(topojson.object(wi,wi.objects.states))
		.attr("class","counties2")
		.attr("d",path)
	});
	//basemap, Illinois, Minnesota and Iowa
		


	d3.csv("data/weevilData.csv", function(csvData){
	
		var recolorMap = colorScale(csvData);
		//console.log(csvData);
		console.log(csvData[0].NAME);
		
		//this is when we call all functions that would use csvData
		drawPcp(csvData);
		drawLegend(csvData);
		//sequenceButtons(csvData);
		
		d3.json("data/wi_new.topojson", function(error,wi){
			
			
			var jsonCounties=wi.objects.WiCounties.geometries;
			//loops through csv to assign each csv value to json county
			for(var i=0;i<csvData.length;i++){//loop over the array of counties/rows /loop ove all rows
				var csvCounty=csvData[i]; //the current county
				var csvCountyName=csvCounty.NAME;//get name attribute of current county
				
				//loop through counties to find the right county
				for (var a=0; a<jsonCounties.length;a++){
					if(jsonCounties[a].properties.NAME==csvCountyName){ // if the name of the json county is equal to the csv county name
						for (var b=0; b<keyArray.length;b++){ // loop over Nemonychidae, Anthribidae, Attelabidae and Brentidae
							var key=keyArray[b]; //
							var beetle=parseFloat(csvCounty[key]);
							//console.log(beetle);
							jsonCounties[a].properties[key]=beetle; // add the property to the json county
							
						};//end for
						
						jsonCounties[a].properties.name=csvCounty.name;
						break; // if match found then break out of loop
					};
				};
				
			};
			console.log(csvData[0].Nemonychidae); // get nemonychidae for adams county
			//console.log(jsonCounties[0].properties.NAME);
	
		var counties = map.selectAll(".counties")
		.data(topojson.object(wi,wi.objects.WiCounties).geometries)
		.enter()
		.append("path")
		.attr("class","counties")
		.attr("id",function(d){
			var finalId= d.properties.NAME.replace(" ","");
			finalId = finalId.replace(" ","");
			finalId = finalId.replace(".","");
			return finalId;
		})
		.attr("d",path)
		.style("fill", function(d) { //color enumeration units
						return choropleth(d, recolorMap);
					})
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel)
		.append("desc") //append the current color as a desc element
						.text(function(d) { 
							return choropleth(d, recolorMap); 
				   		});
	
		
				 });
		});


}; // end of setMap


//takes callback function as a parameter
function colorScale(csvData){

	//create quantile classes with color scale
	//var colors = colorClass();
	
	var color = d3.scale.quantile() //designate quantile scale generator
		.range([
			
			"#fdcc8a",
			"#fc8d59",
			"#e34a33",
			"#b30000"
		]);
		
		//set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) { return Number(d[expressed]); }),
		d3.max(csvData, function(d) { return Number(d[expressed]); })
	]);

	//return the color scale generator
	return color;	

};
	
function choropleth(d, recolorMap){
	//<-setMap d3.json provinces.style
	
	//Get data value
	var value = d.properties[expressed];
	//If value exists, assign it a color; otherwise assign gray
	if (value) {
		return recolorMap(value);
	} else {
		return "#fef0d9";
	};
};



function drawPcp(csvData){
	
	//pcp dimensions
	var width=960;
	var height=200;
	
	var keys = [], attributes = [];
	
	
	//fill keys array with all property names
	// in this case, beetle families
	for (var key in csvData[0]){
		keys.push(key);
	};
	
	
	//fill attributes array with only the attribute names
	// in this case, counties
	for (var i=2; i<keys.length; i++){
		attributes.push(keys[i]);
	};


	var coordinates = d3.scale.ordinal() //create an ordinal scale for plotting axes
		.domain(attributes) //horizontally space each attribute's axis evenly
		.rangePoints([0, width]); //set the horizontal scale width as the SVG width
		
		
    var axis = d3.svg.axis() //create axis generator
		.orient("left"); //orient generated axes vertically
	
	//create vertical pcp scale
	scales = {}; //object to hold scale generators
	attributes.forEach(function(att){ //for each attribute
    	scales[att] = d3.scale.linear() //create a linear scale generator for the attribute
        	.domain(d3.extent(csvData, function(data){ //compute the min and max values of the scale
				return +data[att]; //create array of data values to compute extent from
			})) 
        	.range([height, 0]); //set the height of each axis as the SVG height
	});
	
	var line = d3.svg.line(); //create line generator
	
	//create a new svg element with the above dimensions
	var pcplot = d3.select("#wrapper")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "pcplot") //for styling
		.append("g") //append container element
		.attr("transform", d3.transform( //change the container size/shape
			"scale(0.8, 0.6),"+ //shrink
			"translate(96, 50)")); //move
			
	var pcpBackground = pcplot.append("rect") //background for the pcp
		.attr("x", "-30")
		.attr("y", "-35")
		.attr("width", "1020")
		.attr("height", "270")
		.attr("rx", "15")
		.attr("ry", "15")
		.attr("class", "pcpBackground");
	
	//add lines
	var pcpLines = pcplot.append("g") //append a container element
		.attr("class", "pcpLines") //class for styling lines
		.selectAll("path") //prepare for new path elements
		.data(csvData) //bind data
		.enter() //create new path for each line
		.append("path") //append each line path to the container element
		.attr("id", function(d){
			return d.NAME; //id each line by admin code
		})
		.attr("d", function(d){
			return line(attributes.map(function(att){ //map coordinates for each line to arrays object for line generator
				return [coordinates(att), scales[att](d[att])]; //x and y coordinates for line at each axis
			}));
		})
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	
	//add axes	
	var axes = pcplot.selectAll(".attribute") //prepare for new elements
		.data(attributes) //bind data (attribute array)
		.enter() //create new elements
		.append("g") //append elements as containers
		.attr("class", "axes") //class for styling
		.attr("transform", function(d){
			return "translate("+coordinates(d)+")"; //position each axis container
		})
		.each(function(d){ //invoke the function for each axis container element
			d3.select(this) //select the current axis container element
				.call(axis //call the axis generator to create each axis path
					.scale(scales[d]) //generate the vertical scale for the axis
					.ticks(0) //no ticks
					.tickSize(0) //no ticks, I mean it!
				)
				.attr("id", d) //assign the attribute name as the axis id for restyling
				.style("stroke-width", "5px") //style each axis		
				.on("click", function(){ //click listener
					sequence(this, csvData);
				});	
		});
		
	//axes.append("text").text(/* function(d,i){d.keyArray[i];} */keyArray[0]);
	//maybe do somethin with the attribute array?
	
	
	pcplot.select("#"+expressed) //select the expressed attribute's axis for special styling
		.style("stroke-width", "10px")
		/* .append("text").text(expressed) */;
	
	
};




function dehighlight(data){

	var recolorMap = colorScale(data);
	var props = datatest(data);	//standardize json or csv data
	
	var finalId= props.NAME.replace(" ","");
	finalId = finalId.replace(" ","");
	finalId = finalId.replace(".","");
	
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.NAME) //select the right pcp line
		.style("stroke","black"); //restyle the line
	
	var county = d3.select("#"+finalId); //designate selector variable for brevity
	var fillcolor = county.select("desc").text();  //access original color from desc
	county.style("fill", fillcolor); //reset enumeration unit to orginal color
	
	d3.select("#"+finalId+"label").remove(); //remove info label
	
	
};

function highlight(data){
	var props= datatest(data);
	
	var finalId= props.NAME.replace(" ","");
	finalId = finalId.replace(" ","");
	finalId = finalId.replace(".","");
			
	d3.select("#"+finalId)//select the current county in the dome	
		.style("fill","#000");
		
		
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.NAME) //select the right pcp line
		.style("stroke","#fc8d59"); //restyle the line
		
	var labelAttribute="<h1>"+props[expressed]+"</h1><br><b>"+expressed+"</b>&nbsp;&nbsp;&nbsp;&nbsp;"+props.NAME;
	
	/* var labelName=props.NAME;	 */
	
	var infolabel=d3.select("#wrapper").append("div")
		.attr("class","infolabel")
		.attr("id", finalId+"label")
		.html(labelAttribute);
		/*
.append("div")
		.attr("class", "labelname")
		.html(labelName);
*/
			
		
};

/*
function datatest (data){
	
	if(data.properties){
		return data.properties;
	}else{
		return data;
	}
	
};
*/


//select vs selectAll
function moveLabel(){
	var x=d3.event.clientX+10;
	var y=d3.event.clientY-75;
	d3.selectAll(".infolabel")
		.style("margin-left", x+"px")
		.style("margin-top", y+"px");
};


function sequence(axis, csvData){
		//<-drawPcp axes.each.on("click"...
		
		//restyle the axis
		d3.selectAll(".axes") //select every axis
			.style("stroke-width", "5px"); //make them all thin
		axis.style.strokeWidth = "10px"; //thicken the axis that was clicked as user feedback
		
		
		expressed = axis.id; //change the class-level attribute variable
		
		console.log(expressed+" in sequence");
		//recolor the map
		d3.selectAll(".counties") //select every province
			.style("fill", function(d) { //color enumeration units
				return choropleth(d, colorScale(csvData)); //->
			})
			.select("desc") //replace the color text in each province's desc element
			.text(function(d) {
				return choropleth(d, colorScale(csvData)); //->
			});
			updateLegend(csvData); 
	};



//not called yet

function datatest(data){
	//<-highlight
	//<-dehighlight
	
	if (data.properties){ //if json data
		return data.properties;
	} else { //if csv data
		return data;
	};
};

function computeBounds(csvData){
	//<-colorScale
	//<-updateLegend
	
	//set min and max values for current dataset
	var datamin = d3.min(csvData, function(d){
		return Number(d[expressed]);
	});
	var datamax = d3.max(csvData, function(d){
		return Number(d[expressed]);
	});
	
	return [datamin,datamax]; //array with upper and lower bounds
}


function colorClass(){
	//<-colorScale
	//<-drawLegend
	
	return [
		"#fef0d9",
		"#fdcc8a",
			"#fc8d59",
			"#e34a33",
			"#b30000"
		
	];
};


function drawLegend(csvData) {
	//<-setMap d3.csv
	
	var colorsArray = colorClass(); //-> get the array of choropleth colors
	
	//create a legend div
	var legend = d3.select("#wrapper")
		.append("div")
		.attr("id", "legend");
	
	//create the legend title in a child div
	var legtitle = legend.append("div")
		.attr("id","legtitle")
		.html("<h2>Number of Beetle Species by County</h2>");
		
	//create a child div to hold the color scale
	var legendColors = legend.append("div")
		.attr("id", "legendColors");
		
	//create and color each div in the color scale
	var colorbox = legendColors.selectAll(".colorbox")
		.data(colorsArray.reverse()) //highest value on top
		.enter()
		.append("div")
		.attr("class","colorbox")
		.style("background-color", function(d){
			return d;
		});
		
	//create a div for the number scale
	var legendScale = legend.append("div")
		.attr("id", "legendScale");
	
	//create a div for the attribute name	
	var attributeName = legend.append("div")
		.attr("id","attributeName");
	
	//fill in the legend with dynamic data	
	updateLegend(csvData); //->
};


function updateLegend(csvData){
	//<-drawLegend
	//<-sequence
	
	//generate an array of legend values
	var colScale = colorScale(csvData); //-> get the quantile scale generator
	var quantiles = colScale.quantiles(); //get the quantile bounds
	var databounds = computeBounds(csvData); //-> get the upper and lower data bounds
	var datascale = [databounds[1]]; //create an array variable for numbers with upper limit
	//add middle quantile bounds to array
	for (var i=quantiles.length-1; i>=0; i--){
		datascale.push(quantiles[i]); 
	};
	datascale.push(databounds[0]); //add lower limit to array
	
	var legend = d3.select("#legend"); //select the legend div
	
	//create a separate div to hold each number in the number scale
	var legendNum = legend.select("#legendScale")
		.selectAll(".legendNum")
		.data(datascale)
		.enter()
		.append("div")
		.attr("class","legendNum")
		.html(function(d){
			return Math.round(d)
		});
		
	//update the numbers according to the current datascale
	legend.selectAll(".legendNum")
		.html(function(d){
			return Math.round(d)
		});
	
	//update the attribute name according to the current attribute	
	legend.select("#attributeName")
		.html("<h3>"+expressed+"</h3>");	
};






