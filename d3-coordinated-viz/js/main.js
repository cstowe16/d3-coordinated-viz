//main.js
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
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
        
        //translate europe TopoJSON
        var USstates = topojson.feature(statesUS, statesUS.objects.states),
            wiCounties = topojson.feature(counties, counties.objects.WICounties).features;

        //examine the results
        console.log(USstates);
        console.log(wiCounties);
        
    };
};