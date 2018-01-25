module.exports = {
	KrakenTicker: function (data, time) {
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
	},
	KrakenBook: function(data, time){
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
	},
	exchange: function (data,time){
		response = {};
		response[time] = {USDCAD: data.rates.CAD};
		return response;
	}
  };

