# Note that to avoid bugs and security issues, we manually specify the parameters we want to save &
# update, rather than just passing them all in.
class EventsController < ApplicationController
  def index
    render :json => Event.all
  end
  
  def create
    render :json => 
      Event.create!(:start => params[:start], :end => params[:end], :title => params[:title],
        :color => params[:color])
  end
  
  def update
    event = Event.find(params[:id])
    event.update_attributes!(:start => params[:start], :end => params[:end], :title => params[:title],
      :color => params[:color])
    render :json => event
  end  
  
  def destroy
    event = Event.find(params[:id])
    event.destroy    
    render :json => event
  end
end
