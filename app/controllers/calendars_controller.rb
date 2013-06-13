class CalendarsController < ApplicationController
  expose(:calendars){ Calendar.all }
  expose(:calendar){
    if params[:id]
      Calendar.find(params[:id])
    elsif params[:calendar][:id]
      Calendar.find(params[:calendar][:id])
    else
      Calendar.new(params[:calendar])
    end
  }
  def create
    calendar.save
    redirect_to :back
  end

  def update
    calendar.save
    redirect_to :back
  end

  def destroy
    calendar.destroy
    redirect_to :back
  end
end
