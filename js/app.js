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
		mainboxShow: false,
		addBoxShow: false,
		resultBoxShow: false,
		searchResults: []
	},
	watch: {
		input: function(val) {
			if (val) {
				this.mainboxShow = true;

				clearTimeout(this.timeout);
				this.timeout = setTimeout(() => {
					if (this.input.substring(0,7) === 'http://' || this.input.substring(0,8) === 'https://') {
						this.addBoxShow = true;
						this.resultBoxShow = false;

						// Run entity extraction algorithm and index item
					} else {
						this.resultBoxShow = true;
						this.addBoxShow = false;

						// Run search algorithm and return results
						index.search(val, (err, content) => {
							this.searchResults = [];
							console.log(content);
							content.hits.forEach(item => {
								this.searchResults.push({
									"value": item.name,
									"link": "#"
								})
							})
						});
					}
				}, 300)
			} else {
				this.mainboxShow = false;
				this.addBoxShow = false;
				this.resultBoxShow = false;
			}
		}
	},
	methods: {
		handleIconClick(e) {
			console.log(e);
		}
	}
})