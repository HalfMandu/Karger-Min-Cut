/* 
* 	Karger Minimum Cut - JS Implementation - O(n2)
*   Stephen Rinkus
* 
* 	Each merge operation takes O(n) time (going through at most O(n) edges and vertices)
*	and there are n − 2 merges until there are 2 supernodes left
*/

const { performance } = require('perf_hooks');

//Take input Karger txt file and output a Map, each key corrresponding to a row = [array of vertices]
const parseKargerFile = async (kargerFile) => {

	const util = require('util');
	const fs = require('fs');
	fs.readFileAsync = util.promisify(fs.readFile); 
	const data = await fs.readFileAsync(kargerFile);    
	const lines = data.toString().split('\r\n');

	//maps vertices (int keys) to lists of their adjacent vertices (array vals)
	const vertMap = new Map();

	//each line is a tab deliminated row of numbers (vertices)
	lines.map(line => {

		//make sure a line exists before trying to shove it in the map
		if (!line) { return null; }
		
		//es6 spread/desctructing to break apart row into key/value pairs....also removing extra commas
		let vert, neighbors;
		[vert, ...neighbors] = line.split('\t').toString().replace(/(^,)|(,$)/g, '').split(',');  
		
		//use the first number from each row as map key, and the remaining numbers on that row as value array
		vertMap.set(Number(vert), neighbors);
	});

	return vertMap;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Driver

console.log("Starting MinCut...");

//Begin
parseKargerFile('./kargerMinCut.txt').then((vertMap) => {
	const startTime = performance.now();
	countMinCuts(vertMap);
	const endTime = performance.now();
	console.log(`KargerMinCut() took ${endTime - startTime} milliseconds`);  // ~300 milliseconds
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Main

//Method to wrap the main cutMin logic and summarize the results
const countMinCuts = (vertMap) => {
	
	//formula: n^2 * ln(n) for probability of failure < 1/n, for n total vertices
	const trials = 10;
	const cuts = [];

	//run minCuts repeatedly, tracking each cut produced
	for (let i=1; i<=trials; i++){
		
		//need to use a deep copy or else the map will interfere with previous runs
		const mapDeepCopy = new Map(JSON.parse(
		  JSON.stringify(Array.from(vertMap))
		));
		
		//keeping track of all cuts, for posterity
		cuts.push(minCut(mapDeepCopy));
	}
		
	console.log("Final Minimum cut : " + Math.min(...cuts));
	console.log("All cuts : " + cuts);
};

//Random Contraction Algorithm
const minCut = (vertMap) => {
	
	//keep collapsing edges until there are only 2 vertices left
	while (vertMap.size > 2) {
		
		//merge two vertices of a randomly selected edge (any two connected vertices)
		merge(vertMap, pickRandomEdge(vertMap));
						
	}

	//get the final length of the array of the first remaining key 
	return vertMap.get(Math.min(...vertMap.keys())).length;
	
};

//Pick a random vertice, then pick a random neighboring vertice, and return them together
const pickRandomEdge = (vertMap) => {

	//choose a random key (vertice) from Map
	const randVert = getRandomKey([...vertMap.keys()]);		

	//choose a random neighboring vertice, given the chosen vertice above
	const neighbors = vertMap.get(randVert);
	const randNeighbor = getBoundedRandomNumber(0, neighbors.length-2);	

	//return an Object with two properties: the 2 vertice keys selected
	let edge = {};
	edge.vert1 = randVert;
	edge.vert2 = Number(neighbors[randNeighbor]);

	return edge;
};

//Absorb vertice v2 into vertice v1
const merge = (vertMap, edge) => {

	//temporily extract both verts to do work on them
	let v1 = vertMap.get(edge.vert1);
	let v2 = vertMap.get(edge.vert2);

	//add all of v2's neighbors to v1's neighbors array
	v1 = [...v1, ...v2]; 

	//remove v2 refs and v1 self-loops from v1 and set v1 back to main map
	vertMap.set(edge.vert1, v1.filter((neighbor) => 
		(neighbor != edge.vert2) && (neighbor != edge.vert1)
	));

	//for v2's neighbors, change stale v2 refs to v1
	updateVertReferences(vertMap, edge);

	//finally, remove the now-defunct v2
	vertMap.delete(edge.vert2); 

};

//Change any remaining mentions of v2 to v1 throughout the map/graph 
const updateVertReferences = (vertMap, edge) => {
	
	//for all neighbors of v2 (except v1), update their v2 refs
	for (neighbor of vertMap.get(edge.vert2)) {
		if (neighbor != edge.vert1){
			
			//retrieve this neighbor's neighbor list, since it must mention v2
			let currNeighbors = vertMap.get(Number(neighbor));
			
			//move through this neighbor's array, until ALL mentions of v2 have been changed to v1
			while (currNeighbors.includes(edge.vert2.toString())) {
				const index = currNeighbors.indexOf(edge.vert2.toString());
				currNeighbors[index] = edge.vert1.toString();
				vertMap.set(Number(neighbor), currNeighbors);
			}
		}
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Helpers

//Random whole number, min and max included 
const getBoundedRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
};

//takes in list of keys and returns a random one
const getRandomKey = (keys) => {
	const rand = Math.floor(Math.random() * (keys.length));
	return keys[rand];
};

//Print current state of Map
const printGraph = (vertMap) => {
	console.log("CURRENT GRAPH MAP: ");	
	console.log(vertMap.entries());	
};
