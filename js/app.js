var menu = new Vue({
	el: '#menu'
})

// Initialize Algolia SDK
axios.get('/config.json')
.then(function (response) {
	token = response.data.token;
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
				this.tags = [];

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
								axios.get('https://api.dandelion.eu/datatxt/nex/v1/?url=' + this.input + '&min_confidence=0.5&social=False&include=image%2Cabstract%2Ctypes%2Ccategories%2Clod&country=-1&token=' + token)
								.then(entityResponse => {
									this.tagsLabel = 'TAGS';
									var entities = entityResponse.data.annotations;
									entities.forEach(entity => {
										this.tags.push(entity.title);
									})
								})
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