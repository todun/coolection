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
		searchResults: [],
		addTitle: 'Fetching website...',
		tagsLabel: '',
		tags: [],
		inputTagVisible: false,
		inputTagValue: ''
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
						this.addTitle = 'Fetching website...';
						this.tagsLabel = '';

						axios.get('http://coolection.cyris.co/get-title/?url=' + this.input)
						.then(titleResponse => {
							if (titleResponse.data.substring(0,21) !== '<br />\n<b>Warning</b>') {
								this.addTitle = titleResponse.data;
								this.tagsLabel = 'GENERATING TAGS...';

								// Run entity extraction algorithm and index item
							} else {
								this.addTitle = 'Error fetching website';
							}
						})
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
									"url": "#"
								})
							})
						});
					}
				}, 500)
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
		},
		showInputTag() {
			this.inputTagVisible = true;
		},
		removeTag(tag) {
			this.tags.splice(this.tags.indexOf(tag), 1);
		},
		handleInputTagConfirm() {
			let inputTagValue = this.inputTagValue;
			if (inputTagValue) {
				this.tags.push(inputTagValue);
			}
			this.inputTagVisible = false;
			this.inputTagValue = '';
		}
	}
})