# app/controllers/categories_controller.rb
class CategoriesController < ApplicationController
  before_action :authenticate_request

  def index
    @categories = Category.all
    render json: @categories, status: :ok
  end

  def create
    @category = Category.new(category_params)
    if @category.save
      render json: @category, status: :created
    else
      render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def category_params
    params.require(:category).permit(:name)
  end
end
