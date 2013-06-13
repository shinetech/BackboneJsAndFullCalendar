class Event < ActiveRecord::Base
  belongs_to :calendar
  delegate :color, :to => :calendar

  validates_presence_of :title
  validates_presence_of :calendar_id

  def as_json(options={})
    super(:methods => [:color])
  end
  def color
    if self.calendar
      self.calendar.color
    else
      "grey"
    end
  end
end
