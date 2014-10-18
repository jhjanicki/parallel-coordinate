window.onload=initialize();

function initialize(){
	setMap();
}

function setMap(){



	var width = 960;
	var height= 960;
	
	var map= d3.select("body")
			.append("svg")
			.attr("width",width)
			.attr("height",height);
			
	
/*
var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);
*/

var projection = d3.geo.albers()
    .rotate([96, 0])
    .center([6.6, 44.7])
    .parallels([29.5, 45.5])
    .scale(3000)
    .translate([width / 2, height / 2])
    .precision(.1);
	

var graticule = d3.geo.graticule()
    .extent([[-98 - 45, 38 - 45], [-98 + 45, 38 + 45]])
    .step([5, 5]);
    
var path = d3.geo.path()
    			.projection(projection);

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
	
	//keep	
	
	
	
	
	d3.json("data/states.topojson", function(error, wi){
	/* console.log(wi); */
	
	var counties = map.append("path")
		.datum(topojson.object(wi,wi.objects.states))
		.attr("class","counties2")
		.attr("d",path)
	});
		


	
	
	
	
	
d3.json("data/wi_new.topojson", function(error, wi){

	var counties = map.selectAll(".counties")
	.data(topojson.object(wi,wi.objects.WiCounties).geometries)
	.enter()
	.append("path")
	.attr("class","counties")
	.attr("id",function(d){return d.properties.NAME})
	.attr("d",path)
		

		
	});

	
	
	
	
	
	
	
}