class EventsController < ApplicationController
  expose(:events){ Event.all }
  expose(:event)
  def index
    render :json => events
  end

  def create
    event.save
    render :json => event
  end

  def update
    event.save
    render :json => event
  end

  def destroy
    event.destroy
    render :json => event
  end
end
