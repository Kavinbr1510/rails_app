
class ProductsController < ApplicationController
  before_action :authenticate_request
  load_and_authorize_resource
  def index
    if current_user.role.name == "Admin"
      @products = Product.all
    elsif current_user.role.name == "Seller"
      @products = current_user.products
    else
      @products = Product.approved
    end

    render json: @products, status: :ok
  end

  def show
    @product = Product.find(params[:id])
    render json: @product, status: :ok
  end

  def new
    @product = Product.new
    render json: { product: @product }, status: :ok
  end

  def create
    Rails.logger.debug "👤 Current user: #{current_user.inspect}"
    Rails.logger.debug "SESSION: #{request.session.to_hash}"
Rails.logger.debug "COOKIES: #{request.cookies.inspect}"

    @product = current_user.products.build(product_params)

    if @product.save
      render json: { message: "Product submitted", product: @product }, status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def approve_by_admin
    status = params[:admin_status]&.to_sym || :approved

    if @product
      if @product.update(admin_status: status, approved_by: current_user.id)
        render json: { message: "Product #{status} successfully", product: @product }, status: :ok
      else
        render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: "Invalid product ID" }, status: :not_found
    end
  end


  private

  def product_params
    params.require(:product).permit(:product_name, :cost)
  end
end
