class ProductsController < ApplicationController
  before_action :authenticate_request
  load_and_authorize_resource

  def index
    if current_user.role.name == "Admin"
      @products = Product.includes(:seller, :category)
    elsif current_user.role.name == "Seller"
      @products = current_user.products.includes(:category)
    elsif current_user.role.name == "Buyer"
      @products = Product
                    .approved
                    .left_outer_joins(:buyer_requests)
                    .where(
                      'buyer_requests.status IS NULL
                       OR buyer_requests.buyer_id = ?
                       OR buyer_requests.status != ?',
                      current_user.id, BuyerRequest.statuses[:approved]
                    )
                    .includes(:seller, :category)
                    .distinct
    else
      @products = []
    end

    render json: @products, each_serializer: ProductSerializer, status: :ok
  end

  def show
    @product = Product.find(params[:id])
    render json: @product, serializer: ProductSerializer, status: :ok
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
      render json: {
        message: "Product submitted",
        product: ProductSerializer.new(@product).as_json
      }, status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def approve_by_admin
    @product = Product.find(params[:id])
    # --- CRITICAL FIX HERE ---
    # Access admin_status from the nested 'product' hash
    status = params[:product][:admin_status]&.to_sym || :approved

    # Determine visibility based on the new status
    new_visibility = (status == :approved)

    if @product
      if @product.update(admin_status: status, approved_by: current_user.id, visible: new_visibility)
        render json: { message: "Product #{status} successfully", product: ProductSerializer.new(@product).as_json }, status: :ok
      else
        render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: "Invalid product ID" }, status: :not_found
    end
  end

  def my_products
    if current_user.role.name == "Seller"
      @products = current_user.products.includes(:category)
      render json: @products, each_serializer: ProductSerializer, status: :ok
    else
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end


  private

  def product_params
    params.require(:product).permit(:product_name, :cost, :category_id, :visible, :image)
  end
end