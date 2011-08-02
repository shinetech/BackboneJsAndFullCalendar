class CreateEvents < ActiveRecord::Migration
  def self.up
    create_table :events do |t|
      t.string :title
      t.string :color
      t.date :start
      t.date :end

      t.timestamps
    end
  end

  def self.down
    drop_table :events
  end
end
