class EventsController < ApplicationController
  expose(:events){ Event.all }
  expose(:event){
    if params[:id]
      Event.find(params[:id])
    elsif params[:event][:id]
      Event.find(params[:event][:id])
    else
      Event.new(params[:event])
    end
  }
  def index
    render :json => events
  end

  def show
    render :json => event
  end

  def create
    event.save
    render :json => event
  end

  def update
    event.update_attributes!(params[:event])
    render :json => event
  end

  def destroy
    event.destroy
    render :json => event
  end
end
