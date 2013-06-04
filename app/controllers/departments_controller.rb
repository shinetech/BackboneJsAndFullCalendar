class DepartmentsController < ApplicationController
  expose(:department)

  def create
    department.save
    redirect_to :back
  end

  def update
    department.save
    redirect_to :back
  end

  def destroy
    department.destroy
    redirect_to :back
  end
end
