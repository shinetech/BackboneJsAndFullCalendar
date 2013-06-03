class Event < ActiveRecord::Base
  belongs_to :department
  delegate :color, :to => :department
  def as_json(options={})
    result = super(options)
    result[:color] = self.color
    result
  end
end
