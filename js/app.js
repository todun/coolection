var menu = new Vue({
	el: '#menu'
})

// Initialize Algolia SDK
axios.get('/config.json')
.then(function (response) {
	client = algoliasearch(response.data.applicationID, response.data.apiKey);
	index = client.initIndex('getstarted_actors');
})
.catch(function (error) {
	console.log(error);
});

var main = new Vue({
	el: '#main',
	data: {
		input: '',
		timeout: null,
		mainboxShow: false
	},
	watch: {
		input: function(val) {
			if (val) {
				this.mainboxShow = true;
			} else {
				this.mainboxShow = false;
			}

			clearTimeout(this.timeout);
			this.timeout = setTimeout(() => {
				// index.search(val, function searchDone(err, content) {
				// 	console.log(content);
				// 	content.hits.forEach(function(item) {
				// 		results.push({
				// 			"value": item.name,
				// 			"link": "#"
				// 		})
				// 	})
				// });
			}, 300)
		}
	},
	methods: {
		handleIconClick(e) {
			console.log(e);
		}
	}
})