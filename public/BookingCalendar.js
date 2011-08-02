// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

    // Model Classes
    // ----------

    var Network = Backbone.Model.extend({});
	var Site = Backbone.Model.extend({urlRoot: 'service/sites'});
	var Area = Backbone.Model.extend({urlRoot: 'service/areas'});
    var Product = Backbone.Model.extend({urlRoot: 'service/products'});	
    var Booking = Backbone.Model.extend({urlRoot: 'service/bookings'});
	
    // Collection Classes
    // ---------------
    var Categories = Backbone.Collection.extend({
        clear: function() {
            this.reset();
            this.selected = null;
        }		
	});
	
    var Networks = Categories.extend({
        url: 'service/networks',
        model: Network,
		setSelectedId: function(networkId) {
			this.sites.setParentId(networkId);
		}
    });

    var Sites = Categories.extend({
        model: Site,
        setSelectedId: function(siteId) {
			this.areas.setParentId(siteId);
        },
		setSelected: function(site) {
			this.selected = site;
            this.setNetworkId(site.get('networkId'));			
		},
		setParentId: function(networkId){
			if (networkId) {
				this.setNetworkId(networkId);
			}
			else {
				this.reset();
			}
			
			this.networkId = networkId;
			this.areas.clear();
		},
		setNetworkId: function(networkId) {
            this.url = 'service/networks/' + networkId + '/sites';
            this.fetch();			
		}					
    });

    var Areas = Categories.extend({
        model: Area,
        setSelectedId: function(areaId) {
			if (this.products) {
				this.products.setParentId(areaId);
			}
        },
		setSelected: function(area) {
            this.selected = area;
			this.setSiteId(area.get('siteId'));			
		},
		setParentId: function(siteId) {
            if (siteId) {
				this.setSiteId(siteId);
            } else {
                this.reset();
            }
            
            this.siteId = siteId;
            this.clear();			
		},
		setSiteId: function(siteId) {
            this.url = 'service/sites/' + siteId + '/areas';
            this.fetch();			
		},
        clear: function() {
			Categories.prototype.clear.call(this);
            if (this.products) {
				this.products.clear();
			}
        }		
    });

    var Products = Categories.extend({
        model: Product,
        setSelectedId: function(productId) {
			this.selected = this.get(productId);
        },
        setSelected: function(product) {
            this.selected = product;
			this.setAreaId(product.get('areaId'));      
        },
		setParentId: function(areaId) {
            if (areaId) {
				this.setAreaId(areaId);
            } else {
                this.clear();
            }
            
            this.areaId = areaId;			
		},
		setAreaId: function(areaId) {
            this.url = 'service/areas/' + areaId + '/products';
            this.fetch();			
		}
    });

    var Bookings = Backbone.Collection.extend({
        model: Booking
    }); 
  
    // Views
    // --------------
    
	// Used for displaying a network, site, area or product
    var CategoryView = Backbone.View.extend({
        tagName: "option",
        
        initialize: function(){
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.model.view = this;
        },
        
        render: function(){
            $(this.el).attr('value', this.model.get('id')).html(this.model.get('name'));
            return this;
        }
    });
    
	// Used for displaying a list of networks, sites, areas or products
    var CategoriesView = Backbone.View.extend({
        events: {
            "change": "changeSelected"
        },
        
        initialize: function(){
            _.bindAll(this, 'addOne', 'addAll', 'render');

            this.categoryViews = [];			
            this.collection.bind('reset', this.addAll);
            this.collection.bind('all', this.render);
        },
        
        render: function(){
            return this;
        },
        
        addOne: function(site){
            var categoryView = new CategoryView({ model: site });
			this.categoryViews.push(categoryView);			
            $(this.el).append(categoryView.render().el);
        },
        
        addAll: function(){
			// Clear out the old options
			_.each(this.categoryViews, function(categoryView) { categoryView.remove(); });
			this.categoryViews = [];
            $(this.el).attr('disabled', this.collection.length < 1);			
            this.collection.each(this.addOne);
			
			var selected = this.collection.selected;
			if (selected) {
			    $(this.el).val(selected.id);	
			}						
        },
        
        changeSelected: function(e){
            this.collection.setSelectedId($(this.el).val());
        }
    });
    
	// The error message that is displayed to the user when an error occurs whilst saving a booking  
	function errorFromBookingSave(response) {
        return response.status === 409 ? 
            "There are no slots available for the product during this period" :
                "A problem occurred on the server";		
	}
	
	var BookingsView = Backbone.View.extend({
        el: $("#calendar"),
        initialize: function(){
            _.bindAll(this, 'render', 'addAll', 'addOne', 'change', 'eventDropOrResize', 'destroy');            
            this.bookingArray = [];
            this.collection.bind('reset', this.addAll);
			this.collection.bind('add', this.addOne);
			this.collection.bind('change', this.change);
			this.collection.bind('destroy', this.destroy);
			
            this.collection.url = 'service/bookings';
            this.collection.fetch();
			
			this.bookingView = new BookingView();
			this.bookingView.collection = this.collection;			
        },
		render: function() {
            this.calendar = this.el.fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay'
                },
                selectable: true,
                selectHelper: true,
                editable: true,
		        select: _.bind(function(startDate, endDate, allDay) {
		            this.bookingView.model = 
					   new Booking({start: startDate.getTime() / 1000, end: endDate.getTime() / 1000});
					this.bookingView.render();
		        }, this),				
		        eventClick: _.bind(function(event) {
                    this.bookingView.model = this.collection.get(event.id);
					this.bookingView.render();
		        }, this),
                eventDrop: _.bind(function(event, dayDelta, minuteDelta, allDay, revertFunc) {
					this.eventDropOrResize(event, revertFunc);					
                }, this),        
                eventResize: _.bind(function(event, dayDelta, minuteDelta, revertFunc) {
					this.eventDropOrResize(event, revertFunc);
                }, this)
            });
			
			return this;		
		},
        addAll: function(){
			// Clear out the bookings that were loaded into the calendar, then reload the new ones
			this.calendar.fullCalendar('removeEventSource', this.bookingArray);
			this.bookingArray = this.collection.toJSON();
			this.calendar.fullCalendar('addEventSource', this.bookingArray);
        },
		addOne: function(booking) {
			this.el.fullCalendar('renderEvent', booking.toJSON());
			this.el.fullCalendar('unselect');
		},
		change: function(booking) {
			// Look up the underlying event in the calendar and update its details from the booking
			var event = this.el.fullCalendar('clientEvents', booking.get('id'))[0];
			event.title = booking.get('title');
			event.color = booking.get('color');
            this.el.fullCalendar('updateEvent', event);			
		},
		eventDropOrResize: function(event, revertFunc) {
            var start = event.start;
			// Lookup the booking that has the ID of the event and update its details
            var booking = this.collection.get(event.id);
			var previousAttributes = booking.previousAttributes();                    
            booking.save({
                start: start.getTime() / 1000,
                end: (event.end || start).getTime() / 1000
            }, 
            {error: function(booking, response) {
                alert(errorFromBookingSave(response));
				booking.set(previousAttributes);
                revertFunc();
            }});			
		},
        destroy: function(booking) {
            this.el.fullCalendar('removeEvents', booking.id);         
        }		
	});

    // For editing or adding a booking
    var BookingView = Backbone.View.extend({
		el: $('#bookingDialog'),
        initialize: function() {
			_.bindAll(this, 'render', 'create', 'open', 'setProduct', 'setArea', 'setSite', 'save',
			 'close', 'remove');
			
		    this.networks = new Networks();
            this.sites = new Sites();
            this.areas = new Areas();
            this.products = new Products();
			
            this.networks.sites = this.sites;
            this.sites.areas = this.areas;                   
            this.areas.products = this.products;
			
            this.networksView = new CategoriesView({el: this.$('.network'), collection: this.networks});
            var sitesView = new CategoriesView({el: this.$('.site'), collection: this.sites});
            var areasView = new CategoriesView({el: this.$('.area'), collection: this.areas});
            var productsView = new CategoriesView({el: this.$('.product'), collection: this.products});

		},
		render: function() {
			var buttons = {'Ok': this.save};
			if (!this.model.isNew()) {
				_.extend(buttons, {'Delete': this.remove});
			}
			_.extend(buttons, {'Cancel': this.close});
			this.el.dialog({
                modal: true,
                title: (this.model.isNew() ? 'New' : 'Edit') + ' Booking',
				create: this.create,
		        open: this.open,
	            buttons: buttons		
            });

			return this;
		},
		create: function() {
			this.networks.fetch();            
        },
		open: function() {
	        $('#title').val(this.model.get('title'));
	        
	        if (this.model.isNew()) {
                this.$('.network').val(null);
				this.sites.clear();
                this.areas.clear();
                this.products.clear();
			} else {				
				// Set the product
	            new Product({id:this.model.get('productId')}).fetch({success: this.setProduct});
	        }                   
			
            var start = this.model.get('start');
            this.$('.startDate').text(this.formatDate(start));
            // Deal with single-day bookings where the end date has been set to null
            this.$('.endDate').text(this.formatDate(this.model.get('end') || start));
			    
            this.$('.ioNumber').val(this.model.get('ioNumber'));
            this.$('.errors').text('');			
	    },
		setProduct: function(product) {
			this.products.setSelected(product);			
			new Area({id:product.get('areaId')}).fetch({success:this.setArea});							
		},
		setArea: function(area) {
			this.areas.setSelected(area);			
			new Site({id:area.get('siteId')}).fetch({success:this.setSite});
		},
        setSite: function(site) {
			this.sites.setSelected(site);			
			this.$('.network').val(site.get('networkId'));
        },
	    formatDate: function(seconds) {
			var date = new Date();
			date.setTime(seconds * 1000);
	        return $.fullCalendar.formatDate(date, 'd/M/yy');
	    },
		save: function() {
			var previousAttributes = this.model.previousAttributes();
			function error(booking, response) {
	            this.$(".errors").text(errorFromBookingSave(response));
	            booking.set(previousAttributes);				
			}
			
			this.model.set({'title': this.$('#title').val(), 'productId': this.$('.product').val(),
			    'ioNumber': this.$('.ioNumber').val()});
			
            if (this.model.isNew()) {
				this.collection.create(this.model, {success: this.close, error: error});
			} else {
				this.model.save({}, {success: this.close, error: error});
			}
        },
		close: function() {
            this.el.dialog('close');
        },
		remove: function() {
			this.model.destroy({success: this.close});
		}
	});

    // For editing or adding a product
    var ProductView = Backbone.View.extend({
        el: $('#productDialog'),
        initialize: function() {
            _.bindAll(this, 'render', 'create', 'open', 'setArea', 'setSite', 'save', 'close');
            
            this.networks = new Networks();
            this.sites = new Sites();
            this.areas = new Areas();
            
            this.networks.sites = this.sites;
            this.sites.areas = this.areas;                   
            
            this.networksView = new CategoriesView({el: this.$('.network'), collection: this.networks});
            var sitesView = new CategoriesView({el: this.$('.site'), collection: this.sites});
            var areasView = new CategoriesView({el: this.$('.area'), collection: this.areas});
        },
        render: function() {
            this.el.dialog({
                modal: true,
                title: (this.model.isNew() ? 'New' : 'Edit') + ' Product',
                create: this.create,
                open: this.open,
                buttons: {'Ok': this.save, 'Cancel': this.close}        
            });

            return this;
        },
        create: function() {
            this.networks.fetch();            
        },
        open: function() {
            this.$('.name').val(this.model.get('name'));
			var color = this.model.get('color');
            this.$('.color').val(color);
            this.$('.numberOfSlots').val(this.model.get('numberOfSlots'));
            this.$('.errors').text('');
            
            if (this.model.isNew()) {
                this.$('.network').val(null);
                this.sites.clear();
                this.areas.clear();
            } else {                
                // Set the area
                new Area({id:this.model.get('areaId')}).fetch({success:this.setArea});
            }
			
	        var colors = ['Red', 'Blue', 'Green', 'Orange', 'Purple', 'Brown', 'Crimson', 'LightSeaGreen', 
	              'Olive', 'DeepPink'];
	                  
	        var index = 0;
			
			if (color) {
				index = colors.indexOf(color);
				if (index < 0) {
					throw "The color '" + color + "' is not available for selection";
				}
			}
	                          
	        this.$('#colorPicker').colorPicker({
	            defaultColor: index,
	            color: colors,            
	            click: _.bind(function(newColor) { this.$('.color').val(newColor); }, this) 
	        });			                   
        },
        setArea: function(area) {
            this.areas.setSelected(area);           
            new Site({id:area.get('siteId')}).fetch({success:this.setSite});
        },
        setSite: function(site) {
            this.sites.setSelected(site);           
            this.$('.network').val(site.get('networkId'));
        },
        save: function() {
            this.model.save({'name': this.$('.name').val(), 'areaId': this.$('.area').val(),
			    'color': this.$('.color').val(), 'numberOfSlots': this.$('.numberOfSlots').val()}, 
			    {success: this.close});
        },
        close: function() {
            this.el.dialog('close');
        }
    });
		
    // Bootstrap everything in a function to avoid polluting the global namespace
	function setup(){
		var networks = new (Networks.extend({
			setSelectedId: function(networkId){
				Networks.prototype.setSelectedId.call(this, networkId);
				this.bookings.url = 'service/' + (networkId ? 'networks/' + networkId + '/bookings' : 'bookings');
				this.bookings.fetch();
			}
		}))();
		
		var sites = new (Sites.extend({
			setSelectedId: function(siteId){
				Sites.prototype.setSelectedId.call(this, siteId);				
				this.bookings.url = 'service/' + (siteId ? 'sites/' + siteId : 'networks/' + this.networkId) + '/bookings';
				this.bookings.fetch();
			}
		}))();
		
		var areas = new (Areas.extend({
			setSelectedId: function(areaId){
				Areas.prototype.setSelectedId.call(this, areaId);				
				this.bookings.url = 'service/' + (areaId ? 'areas/' + areaId : 'sites/' + this.siteId) + '/bookings';
				this.bookings.fetch();
			}
		}))();
		
		var products = new (Products.extend({
			setSelectedId: function(productId){
				Products.prototype.setSelectedId.call(this, productId);				
				this.bookings.url = 'service/' + (productId ? 'products/' + productId : 'areas/' + this.areaId) + '/bookings';
				this.bookings.fetch();
			}
		}))();
		
		networks.sites = sites;
		sites.areas = areas;
		areas.products = products;
		
		var bookings = new Bookings();
		networks.bookings = bookings;
		sites.bookings = bookings;
		areas.bookings = bookings;
		products.bookings = bookings;
		
		var networksView = new CategoriesView({el: $("#filter .network"), collection: networks});
		var sitesView = new CategoriesView({el: $("#filter .site"), collection: sites});
		var areasView = new CategoriesView({el: $("#filter .area"), collection: areas});
		var productsView = new CategoriesView({el: $("#filter .product"),collection: products});
		var bookingsView = new BookingsView({collection: bookings});		
		var productView = new ProductView();
		
		$('#editProduct').button({text:true}).click(function() {
			productView.model = products.selected;
			productView.render();
		});
		
        $('#newProduct').button({text:true}).click(function() {
            productView.model = new Product();
            productView.render();
        });		
		
		networks.fetch();
		bookingsView.render();
	}
	
	setup();
});