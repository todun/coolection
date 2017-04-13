var main = new Vue({
	el: '#main',
	data: {
		input: '',
		timeout: null,
		scrolled: false,
		addBoxShow: false,
		resultBoxShow: false,
		searchResults: [],
		noResults: false,
		addTitle: 'Fetching website...',
		titleEdit: false,
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
				logo: 'img/logo-login.png',
				primaryColor: '',
			},
			auth: {
				redirectUrl: ''
			}
		}),
		username: '',
		userpic: ''
	},
	computed: {
		resultsLabel: function() {
			if (!this.scrolled)
				return 'Search results for ' + this.input + '...';
			else
				return 'Showing all links';
		}
	},
	mounted: function() {
		this.authenticated = this.checkAuth();

		this.lock.on('authenticated', (authResult) => {
			localStorage.setItem('id_token', authResult.idToken);
			localStorage.setItem('accessToken', authResult.accessToken);

			this.getUserInfo();
			this.lock.hide();
		});

		this.lock.on('authorization_error', (error) => {
			console.log(error);
		});

		window.addEventListener('scroll', this.mainScroll);
	},
	watch: {
		input: function(val) {
			if (val) {
				this.tags = [];
				this.noResults = false;

				clearTimeout(this.timeout);
				this.timeout = setTimeout(() => {
					if (this.input.substring(0,7) === 'http://' || this.input.substring(0,8) === 'https://') {
						this.resultBoxShow = false;
						this.addBoxShow = true;
						this.addTitle = 'Fetching website...';
						this.tagsLabel = '';

						this.getTitle();
					} else {
						this.searchResults = [];
						this.addBoxShow = false;
						this.resultBoxShow = true;
						this.search();
					}
				}, 500)
			} else {
				this.searchResults = [];
				this.addBoxShow = false;
				this.resultBoxShow = false;
				clearTimeout(this.timeout);
			}
		},
		authenticated: function(val) {
			if (!val)
				this.login();
		},
		scrolled: function(val) {
			if (val) {
				this.searchResults = [];
				this.search();
				setTimeout(() => {
					this.resultBoxShow = true;
				}, 300)
			} else
				this.resultBoxShow = false;
		}
	},
	methods: {
		login: function() {
			this.lock.show();
		},
		logout: function() {
			localStorage.removeItem('id_token');
			localStorage.removeItem('profile');
			this.authenticated = false;
		},
		checkAuth: function() {
			if (!!!localStorage.getItem('id_token'))
				this.login();
			else {
				this.restoreSession();
			}

			return !!localStorage.getItem('id_token');
		},
		restoreSession: function() {
			var profile = JSON.parse(localStorage.getItem('profile'));
			if (profile.hasOwnProperty('app_metadata')) {
				token = profile.app_metadata.token;
				client = algoliasearch(profile.app_metadata.applicationID, profile.app_metadata.apiKey);
				index = client.initIndex(profile.email);
				this.userpic = profile.picture;
			} else {
				this.getUserInfo();
			}
		},
		getUserInfo: function() {
			this.lock.getUserInfo(localStorage.getItem('accessToken'), (error, profile) => {
				if (error) {
					console.log(error);
				}

				localStorage.setItem('profile', JSON.stringify(profile));

				this.authenticated = true;
				
				if (profile.hasOwnProperty('app_metadata')) {
					token = profile.app_metadata.token;
					client = algoliasearch(profile.app_metadata.applicationID, profile.app_metadata.apiKey);
					index = client.initIndex(profile.email);
				} else {
					swal({
						title: 'Hang on...',
						text: 'Account is currently pending approval. Check back soon!',
						type: 'info',
						allowEscapeKey: false,
						showConfirmButton: false
					})
				}

				this.userpic = profile.picture;
			});
		},
		mainScroll: function() {
			if (!this.input && window.scrollY >= 10 && !this.scrolled) {
				this.scrolled = true;
			} else if (!this.input && window.scrollY === 0 && this.scrolled) {
				this.scrolled = false;
			}
		},
		getTitle: function() {
			axios.get('/api/getTitle?url=' + this.input)
				.then(titleResponse => {
					if (titleResponse.data === '') {
						this.addTitle = 'Can\'t fetch title. Please enter title.';
						this.titleEdit = true;
					} else if (titleResponse.data) {
						this.addTitle = titleResponse.data;
					}

					if (titleResponse.data !== "Can't fetch website. Check if URL is valid.")
						this.getTags();
				})
		},
		getTags: function() {
			this.tagsLabel = 'GENERATING TAGS...';
			axios.get('https://api.dandelion.eu/datatxt/nex/v1/?url=' + this.input + '&min_confidence=0.5&social=False&include=image%2Cabstract%2Ctypes%2Ccategories%2Clod&country=-1&token=' + token)
			.then(entityResponse => {
				this.tagsLabel = 'TAGS';
				var entities = entityResponse.data.annotations;
				entities.forEach(entity => {
					if (this.tags.indexOf(entity.title) === -1)
						this.tags.push(entity.title);
				})
			})
		},
		search: function() {
			index.search(this.input, (err, content) => {
				this.searchResults = [];

				if (content.hits.length) {
					content.hits.forEach(item => {
						this.searchResults.push({
							"title": item.title,
							"url": item.url,
							"id": item.objectID
						})
					})
				} else {
					this.noResults = true;
				}
			});
		},
		add: function() {
			this.addLoading = true;

			var siteObj = [{
				title: this.addTitle,
				url: this.input,
				tags: this.tags.toString(),
				datetime: new Date()
			}];

			// TODO: look for link's existence before adding

			index.addObjects(siteObj, (err, content) => {
				if (err) {
					swal({
						title: "Failed to save",
						text: err,
						type: "error"
					})

					this.addLoading = false;
				} else {
					swal({
						title: "Coolected!",
						text: "Your link has been successfully saved.",
						type: "success",
						showConfirmButton: false,
						timer: 1500
					})

					this.clearAll();
				}
			});
		},
		inputEnter: function() {
			if (this.input.substring(0,7) === 'http://' || this.input.substring(0,8) === 'https://')
				this.add();
		},
		clearAll: function() {
			this.addLoading = false;
			this.input = '';
		},
		editTitle: function() {
			this.titleEdit = true;
		},
		handleTitleEditConfirm: function() {
			this.titleEdit = false;
		},
		showInputTag: function() {
			this.inputTagVisible = true;
		},
		removeTag: function(tag) {
			this.tags.splice(this.tags.indexOf(tag), 1);
		},
		handleInputTagConfirm: function() {
			let inputTagValue = this.inputTagValue;
			if (inputTagValue) {
				this.tags.push(inputTagValue);
			}
			this.inputTagVisible = false;
			this.inputTagValue = '';
		}
	}
})

Vue.component('item', {
	props: ['title', 'url', 'id'],
	template: '<a :href="url" target="_blank">\
					<el-card>\
						{{title}}\
						<a href="javascript:void(0);">\
							<i @click="deleteItem()"class="el-icon-close"></i>\
						</a>\
						<span class="results-url">{{url}}</span>\
					</el-card>\
				</a>',
	methods: {
		deleteItem: function() {
			swal({
				title: "Are you sure?",
				text: "This link will be deleted!",
				type: "warning",
				confirmButtonColor: "#e74c3c",
				showCancelButton: true,
				confirmButtonText: "Delete",
				closeOnConfirm: false,
				showLoaderOnConfirm: true
			}, () => {
				index.deleteObject(this.id, (err, content) => {
					if (err) {
						swal({
							title: "Failed to delete",
							text: err,
							type: "error"
						})
					} else {
						swal({
							title: "Done!",
							text: "Your link has been successfully deleted.",
							type: "success",
							showConfirmButton: false,
							timer: 1500
						})

						for (var i = 0; i < main.searchResults.length; i++) {
							if (main.searchResults[i].id === this.id)
								main.searchResults.splice(i, 1);
						}
					}
				})
			})
		}
	}
})