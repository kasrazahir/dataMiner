const express = require('express')
const app = express()


var fetch = require('node-fetch');
var firebase = require('firebase');
var admin = require("firebase-admin");
require("firebase/firestore");
var serviceAccount = require("./private/firebaseKey.json");
var krakenKey = require("./private/krakenKey.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kraken-d0db9.firebaseio.com"
});
const kraken  = krakenKey.key; // API Key

var db = admin.firestore();


function addDbKraken(type, pair, data, time){
	db.collection('kraken').doc(pair).collection(time).doc(type).set(data)
	.then(function(docRef) {
		console.log(time + " - " + pair + " " + type + " recorded");
	})
	.catch(function(error) {
	    console.error("Error adding document: ", time, pair, type, error);
	});
}

function addExchange(type, data, time) {
	db.collection('kraken').doc(type).get()
		.then(doc =>{
			if(doc.exists) {
				db.collection('kraken').doc(type).update(data)
				.then(function(docRef) {
					console.log(time + " - " + type + " recorded");
				})
				.catch(function(error) {
					console.error("Error adding document: ", type, error);
				});
			} else {
				db.collection('kraken').doc(type).set(data)
				.then(function(docRef) {
					console.log(time + " - " + type + " recorded - set");
				})
				.catch(function(error) {
					console.error("Error adding document: ", type, error);
				});
			}
		})

}

function payload_KrakenTicker(data, time){
	result = {}
	dummy = data.result[Object.keys(data.result)[0]]
	// ask array(<price>, <whole lot volume>, <lot volume>)
	result['ask'] = dummy.a
	// bid array(<price>, <whole lot volume>, <lot volume>),
	result['bid'] = dummy.b
	// last trade closed array(<price>, <lot volume>),
	result['last'] = dummy.c
	// volume array(<today>, <last 24 hours>),
	result['volume'] = dummy.v
	// volume weighted average price array(<today>, <last 24 hours>),
	result['voulmeWeightedPrice'] = dummy.p
	// number of trades (<today>, <last 24 hours>)
	result['numberOfTrades']= dummy.t
	// low array(<today>, <last 24 hours>),
	result['low'] = dummy.l
	// high array(<today>, <last 24 hours>),
	result['high'] = dummy.h
	// today's opening price
	result['open'] = dummy.o
	result['time'] = time
	return result
}

function payload_KrakenBook(data, time){
	dummy = data.result[Object.keys(data.result)[0]]
	result = {asks:[], bids:[]}
	dummy.asks.forEach(x=>{
		result.asks.push({price:x[0], volume:x[1], time:x[2]})
	})
	dummy.bids.forEach(x=>{
		result.bids.push({price:x[0], volume:x[1], time:x[2]})
	})
	dummy.time = time
	return result
}

function payload_exchange(data,time){
	response = {};
	response[time] = {USDCAD: data.rates.CAD};
	return response;
}

// db.collection("users").get().then((querySnapshot) => {
//     querySnapshot.forEach((doc) => {
//         console.log(`${doc.id} => ${doc.data()}`);
//     });
// });

app.get('/run', (req, res) => {
	time = String((new Date).getTime())

	pairs = ["ETHCAD","ETHUSD", "XBTCAD", "XBTUSD"]
	// pairs = ["ETHCAD"]

	priceValues = {}

	pairs.forEach(pair=>{
		// priceValues[pair]={}
		fetch('https://api.kraken.com/0/public/Ticker?pair='+pair)
			.then(x=> x.json())
			.then(x=> payload_KrakenTicker(x, time))
			.then(x=> {addDbKraken('Trades', pair, x, time)})
			
		fetch('https://api.kraken.com/0/public/Depth?pair='+pair+'&count=5')
			.then(x=> x.json())
			.then(x=> payload_KrakenBook(x, time))
			.then(x=> {addDbKraken('Book', pair, x, time)})
	})

	fetch('https://api.fixer.io/latest?base=USD&symbols=CAD')
		.then(x=> x.json())
		.then(x=> payload_exchange(x, time))
		.then(x=> {addExchange('Exchange', x, time)})

	res.send('Hello World!')
})




app.listen(3000, () => console.log('Example app listening on port 3000!'))

console.log('donzo')