class Department < ActiveRecord::Base
  has_many :events
  validates_presence_of :name
  validates_presence_of :color

  validates_uniqueness_of :name
end

