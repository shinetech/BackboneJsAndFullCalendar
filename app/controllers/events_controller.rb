class EventsController < ApplicationController
  def index
    render :json => Event.all
  end
end
