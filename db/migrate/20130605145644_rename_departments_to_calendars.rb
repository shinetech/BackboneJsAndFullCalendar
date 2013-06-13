class RenameDepartmentsToCalendars < ActiveRecord::Migration
  def up
    rename_table :departments, :calendars
    rename_column :events, :department_id, :calendar_id
  end

  def down
    rename_table :calendars, :departments
    rename_column :events, :calendar_id, :department_id
  end
end
