$(function(){
    var Booking = Backbone.Model.extend();

    var Bookings = Backbone.Collection.extend({
        model: Booking,
        url: 'events'
    }); 
  
	var BookingsView = Backbone.View.extend({
        el: $("#calendar"),
        initialize: function(){
            _.bindAll(this, 'render', 'addAll', 'addOne', 'change', 'eventDropOrResize', 'destroy');            
            this.bookingArray = [];
            this.collection.bind('reset', this.addAll);
			this.collection.bind('add', this.addOne);
			this.collection.bind('change', this.change);
			this.collection.bind('destroy', this.destroy);
			
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
			_.bindAll(this, 'render', 'create', 'open', 'save', 'close', 'remove');			
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
	    },
		save: function() {
			var previousAttributes = this.model.previousAttributes();
			function error(booking, response) {
	            this.$(".errors").text(errorFromBookingSave(response));
	            booking.set(previousAttributes);				
			}
			
			this.model.set({'title': this.$('#title').val()});
			
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
    
    // Bootstrap everything in a function to avoid polluting the global namespace
	(function() {
		var bookings = new Bookings();		
		var bookingsView = new BookingsView({collection: bookings});
		bookingsView.render();
	}).call();
});