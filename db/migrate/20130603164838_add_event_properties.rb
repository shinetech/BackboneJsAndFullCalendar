class AddEventProperties < ActiveRecord::Migration
  def up
    add_column :events, :all_day, :boolean, :default => false
    add_column :events, :description, :string, :default => ''
    add_column :events, :department_id, :integer
    remove_column :events, :color

    create_table :departments do |t|
      t.string :name
      t.string :color
      t.text :description

      t.timestamps
    end
  end

  def down
    remove_column :events, :all_day
    remove_column :events, :description
    remove_column :events, :department_id
    add_column :events, :color, :string, :default => ''

    drop_table :departments
  end
end
