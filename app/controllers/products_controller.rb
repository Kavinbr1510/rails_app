class ProductsController < ApplicationController
  before_action :require_login
  load_and_authorize_resource

  def new
    @product = Product.new
  end

  def create
    @product = current_user.products.build(product_params)

    if @product.save
      flash[:notice] = "Product submitted"
      redirect_to dashboard_seller_path
    else
      render :new
    end
  end

  def approve_by_admin
    # @product = Product.find_by(id: params[:id])
    if @product
      @product.update(admin_status: :approved, approved_by: current_user.id)
      redirect_to dashboard_admin_path, notice: "Product approved successfully."
    else
      redirect_to dashboard_admin_path, alert: "Invalid product ID."
    end
  end



  private

  def product_params
    params.require(:product).permit(:product_name, :cost)
  end
end
