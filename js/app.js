var menu = new Vue({
	el: '#menu'
})

// Initialize Algolia SDK
// axios.get('/config.json')
// .then(function (response) {
// 	token = response.data.token;
// 	client = algoliasearch(response.data.applicationID, response.data.apiKey);
// 	index = client.initIndex('chris');
// })
// .catch(function (error) {
// 	console.log(error);
// });

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
		inputTagValue: '',
		addLoading: false,
		authenticated: false,
		secretThing: '',
		lock: new Auth0Lock('rD5ao9chGoZwgA2GaV7mBe4JKuPSZZ6M', 'chriswong.auth0.com', {
			closable: false,
			languageDictionary: {
				title: 'Login'
			},
			theme: {
				labeledSubmitButton: false,
				logo: '',
				primaryColor: '',
			}
		})
	},
	mounted: function() {
		this.authenticated = this.checkAuth();

		if (!this.authenticated)
			this.login();
		else {
			token = JSON.parse(localStorage.getItem('profile')).appMetadata.token;
			client = algoliasearch(JSON.parse(localStorage.getItem('profile')).appMetadata.applicationID, JSON.parse(localStorage.getItem('profile')).appMetadata.apiKey);
			index = client.initIndex(JSON.parse(localStorage.getItem('profile')).email);
		}

		this.lock.on('authenticated', (authResult) => {
			localStorage.setItem('id_token', authResult.idToken);
			this.lock.getUserInfo(authResult.accessToken, (error, profile) => {
				if (error) {
					// Handle error
					return;
				}
				// Set the token and user profile in local storage
				localStorage.setItem('profile', JSON.stringify(profile));

				this.authenticated = true;

				token = JSON.parse(profile).appMetadata.token;
				client = algoliasearch(JSON.parse(profile).appMetadata.applicationID, JSON.parse(profile).appMetadata.apiKey);
				index = client.initIndex(JSON.parse(profile).email);
			});
		});

		this.lock.on('authorization_error', (error) => {
			// handle error when authorizaton fails
		});
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

						this.getTitle();
					} else {
						this.resultBoxShow = true;
						this.addBoxShow = false;
						this.search();
					}
				}, 500)
			} else {
				this.mainboxShow = false;
				this.addBoxShow = false;
				this.resultBoxShow = false;
			}
		},
		authenticated: function(val) {
			if (!val)
				this.login();
		}
	},
	methods: {
		login() {
			this.lock.show();
		},
		logout() {
			localStorage.removeItem('id_token');
			localStorage.removeItem('profile');
			this.authenticated = false;
		},
		checkAuth() {
			return !!localStorage.getItem('id_token');
		},
		handleIconClick(e) {
			console.log(e);
		},
		getTitle() {
			axios.get('http://coolection.cyris.co/get-title/?url=' + this.input)
				.then(titleResponse => {
					if (titleResponse.data.substring(0,21) !== '<br />\n<b>Warning</b>') {
						this.addTitle = titleResponse.data;
						this.getTags();
					} else {
						this.addTitle = 'Error fetching website';
					}
				})
		},
		getTags() {
			this.tagsLabel = 'GENERATING TAGS...';
			axios.get('https://api.dandelion.eu/datatxt/nex/v1/?url=' + this.input + '&min_confidence=0.5&social=False&include=image%2Cabstract%2Ctypes%2Ccategories%2Clod&country=-1&token=' + token)
			.then(entityResponse => {
				this.tagsLabel = 'TAGS';
				var entities = entityResponse.data.annotations;
				entities.forEach(entity => {
					this.tags.push(entity.title);
				})
			})
		},
		search() {
			index.search(this.input, (err, content) => {
				this.searchResults = [];
				console.log(content);
				content.hits.forEach(item => {
					this.searchResults.push({
						"value": item.name,
						"url": "#"
					})
				})
			});
		},
		add() {
			this.addLoading = true;

			var siteObj = [{
				title: this.addTitle,
				url: this.input,
				tags: this.tags.toString()
			}];

			index.addObjects(siteObj, (err, content) => {
				console.log(err);
			});
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