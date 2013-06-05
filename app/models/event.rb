class Event < ActiveRecord::Base
  belongs_to :department
  delegate :color, :to => :department
 
  validates_presence_of :title
  validates_presence_of :department_id

  def as_json(options={})
    super(:methods => [:color])
  end
  def color
    if self.department
      self.department.color
    else
      "grey"
    end
  end
  #def as_json(options={})
  #  result = super(options)
  #  result["event"]["color"] = self.department.color
  #  result
  #end
end
