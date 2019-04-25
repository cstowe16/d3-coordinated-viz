//main.js
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 650,
        height = 650;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 44.51])
        .rotate([89.99, 0, 0])
        .parallels([28.36, 45.5])
        .scale(6566.67)
        .translate([width / 2, height / 2]);
    
        var path = d3.geoPath()
        .projection(projection);
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/WI_CountiesPop_data.csv")); //load attributes from csv
    promises.push(d3.json("data/states.topojson")); //load background spatial data
    promises.push(d3.json("data/WICounties.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);

    function callback(data){
	csvData = data[0];
	statesUS = data[1];
	counties = data[2];
        console.log(csvData);
        console.log(statesUS);
        console.log(counties);
        
            //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
       
        
       //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

//        //Example 2.6 line 5...create graticule lines
//        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
//        
//            .data(graticule.lines()) //bind graticule lines to each element to be created
//            .enter() //create an element for each datum
//            .append("path") //append each element to the svg as a path element
//            .attr("class", "gratLines") //assign class for styling
//            .attr("d", path); //project graticule lines
        
        
        //translate europe TopoJSON
        console.log(statesUS.objects);
        var USstates = topojson.feature(statesUS, statesUS.objects.ne_50m_admin_1_states_provinces_lakes),
            wiCounties = topojson.feature(counties, counties.objects.WICounties).features;


        //add US states  to map
        var states = map.append("path")
            .datum(USstates)
            .attr("class", "states")
            .attr("d", path);

        //add Counties to map
        var counitesWI = map.selectAll(".countiesWI")
            .data(wiCounties)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "counitesWI " + d.properties.adm1_code;
            })
            .attr("d", path);
        
        
        
        //examine the results
        console.log(USstates);
        console.log(wiCounties);
        
    };
};