class BuyerRequestsController < ApplicationController
  before_action :require_login
  load_and_authorize_resource

  def index
    if current_user.role.name == "Seller"
      @requests = BuyerRequest.joins(:product).where(products: { seller_id: current_user.id })
    elsif current_user.role.name == "Buyer"
      @requests = current_user.buyer_requests
    end
  end


  def create
    product = Product.find(params[:product_id])
    if product
       request = BuyerRequest.new(product: product, buyer: current_user)
        if request.save
         redirect_to dashboard_buyer_path, notice: "Request sent"
        else
          redirect_to dashboard_buyer_path, alert: "Unable to send request."
        end
    else
        redirect_to dashboard_buyer_path, notice: "product not found."
    end
  end

  def approve_by_seller
    request = BuyerRequest.find_by(id: params[:id])

    if request
      product = request.product

      if product.seller_id == current_user.id
        if params[:status].in?(%w[approved rejected])
          request.update(status: params[:status].to_sym)

          if params[:status] == "approved"
            product.buyer_requests.where.not(id: request.id)
                   .update_all(status: BuyerRequest.statuses[:rejected])
          end

          redirect_to dashboard_seller_path, notice: "Request updated."
        else
          redirect_to dashboard_seller_path, alert: "Invalid status."
        end
      else
        redirect_to dashboard_seller_path, alert: "Unauthorized action."
      end
    else
      redirect_to dashboard_seller_path, alert: "Request not found."
    end
  end
end
