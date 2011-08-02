$(function(){
    var Event = Backbone.Model.extend();

    var Events = Backbone.Collection.extend({
        model: Event,
        url: 'events'
    }); 
  
	var EventsView = Backbone.View.extend({
        el: $("#calendar"),
        initialize: function(){
            _.bindAll(this, 'render', 'addAll', 'addOne', 'change', 'eventDropOrResize', 'destroy');            
            this.fcEvents = [];
            this.collection.bind('reset', this.addAll);
			this.collection.bind('add', this.addOne);
			this.collection.bind('change', this.change);
			this.collection.bind('destroy', this.destroy);
			
            this.collection.fetch();
			
			this.eventView = new EventView();
			this.eventView.collection = this.collection;			
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
		            this.eventView.model = 
					   new Event({start: startDate.getTime() / 1000, end: endDate.getTime() / 1000});
					this.eventView.render();
		        }, this),				
		        eventClick: _.bind(function(fcEvent) {
                    this.eventView.model = this.collection.get(fcEvent.id);
					this.eventView.render();
		        }, this),
                eventDrop: _.bind(function(fcEvent, dayDelta, minuteDelta, allDay, revertFunc) {
					this.eventDropOrResize(fcEvent, revertFunc);					
                }, this),        
                eventResize: _.bind(function(fcEvent, dayDelta, minuteDelta, revertFunc) {
					this.eventDropOrResize(fcEvent, revertFunc);
                }, this)
            });
			
			return this;		
		},
        addAll: function(){
			// Clear out the events that were loaded into the calendar, then reload the new ones
			this.calendar.fullCalendar('removeEventSource', this.fcEvents);
			this.fcEvents = this.collection.toJSON();
			this.calendar.fullCalendar('addEventSource', this.fcEvents);
        },
		addOne: function(event) {
			this.el.fullCalendar('renderEvent', event.toJSON());
			this.el.fullCalendar('unselect');
		},
		change: function(event) {
			// Look up the underlying event in the calendar and update its details from the event
			var fcEvent = this.el.fullCalendar('clientEvents', event.get('id'))[0];
			fcEvent.title = event.get('title');
			fcEvent.color = event.get('color');
            this.el.fullCalendar('updateEvent', fcEvent);			
		},
		eventDropOrResize: function(fcEvent, revertFunc) {
            var start = event.start;
			// Lookup the event that has the ID of the event and update its details
            var event = this.collection.get(fcEvent.id);
			var previousAttributes = event.previousAttributes();                    
            event.save({
                start: start.getTime() / 1000,
                end: (event.end || start).getTime() / 1000
            }, 
            {error: function(event, response) {
                alert(errorFromEventSave(response));
				event.set(previousAttributes);
                revertFunc();
            }});			
		},
        destroy: function(event) {
            this.el.fullCalendar('removeEvents', event.id);         
        }		
	});

    // For editing or adding a event
    var EventView = Backbone.View.extend({
		el: $('#eventDialog'),
        initialize: function() {
			_.bindAll(this, 'render', 'open', 'save', 'close', 'remove');			
		},
		render: function() {
			var buttons = {'Ok': this.save};
			if (!this.model.isNew()) {
				_.extend(buttons, {'Delete': this.remove});
			}
			_.extend(buttons, {'Cancel': this.close});
			this.el.dialog({
                modal: true,
                title: (this.model.isNew() ? 'New' : 'Edit') + ' Event',
				create: this.create,
		        open: this.open,
	            buttons: buttons		
            });

			return this;
		},
		open: function() {
	        $('#title').val(this.model.get('title'));
	    },
		save: function() {
			var previousAttributes = this.model.previousAttributes();
			function error(event, response) {
	            this.$(".errors").text(errorFromEventSave(response));
	            event.set(previousAttributes);				
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
		var events = new Events();		
		var eventsView = new EventsView({collection: events});
		eventsView.render();
	}).call();
});