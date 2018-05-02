const express = require('express')
const app = express()
var fetch = require('node-fetch');
var firebase = require('firebase');
var admin = require("firebase-admin");
require("firebase/firestore");
var serviceAccount = require("./private/firebaseKey.json");
var krakenKey = require("./private/krakenKey.json");
var payloads = require('./payloads');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://krakendaily-d3728.firebaseio.com"
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

app.get('/run', (req, res) => {
	time = String((new Date).getTime())

	pairs = ["ETHCAD","ETHUSD", "XBTCAD", "XBTUSD"]
	// pairs = ["ETHCAD"]

	priceValues = {}

	pairs.forEach(pair=>{
		// priceValues[pair]={}
		fetch('https://api.kraken.com/0/public/Ticker?pair='+pair)
			.then(x=> x.json())
			.then(x=> payloads.KrakenTicker(x, time))
			.then(x=> {addDbKraken('Trades', pair, x, time)})
			
		fetch('https://api.kraken.com/0/public/Depth?pair='+pair+'&count=50')
			.then(x=> x.json())
			.then(x=> payloads.KrakenBook(x, time))
			.then(x=> {addDbKraken('Book', pair, x, time)})
	})

	fetch('https://api.fixer.io/latest?base=USD&symbols=CAD')
		.then(x=> x.json())
		.then(x=> payloads.exchange(x, time))
		.then(x=> {addExchange('Exchange', x, time)})

	res.send('Hello World!')
})

app.get('/test', (req, res) => {
	res.send({success: "1"})
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
