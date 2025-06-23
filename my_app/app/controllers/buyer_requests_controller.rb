# Fix: BuyerRequestsController authorization for Seller role

class BuyerRequestsController < ApplicationController
  before_action :authenticate_request
  load_and_authorize_resource except: [:index] # Skip CanCanCan here and use custom check

  def index
    if current_user.role.name == "Seller"
      # ✅ FIX: Explicitly authorize access to buyer_requests for seller's products
      @requests = BuyerRequest
                    .joins(:product)
                    .where(products: { seller_id: current_user.id })
                    .includes(:buyer)

    elsif current_user.role.name == "Buyer"
      @requests = current_user.buyer_requests.includes(:buyer)
    else
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end

    requests_with_buyer = @requests.map do |r|
      r.as_json.merge(buyer_name: r.buyer.name)
    end

    render json: requests_with_buyer, status: :ok
  end

  def create
    @buyer_request = BuyerRequest.new(buyer_request_params)
    @buyer_request.buyer = current_user

    if @buyer_request.save
      render json: { message: "Request sent", buyer_request: @buyer_request }, status: :created
    else
      render json: { error: "Unable to send request", details: @buyer_request.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def approve_by_seller
    request = BuyerRequest.find_by(id: params[:id])

    if request
      product = request.product

      if product.seller_id == current_user.id
        if params[:status].in?(%w[approved rejected])
          if request.update(status: params[:status].to_sym, approved_by: current_user.id)
            render json: { message: "Request updated", buyer_request: request }, status: :ok
          else
            render json: { error: "Validation failed", details: request.errors.full_messages }, status: :unprocessable_entity
          end
        else
          render json: { error: "Invalid status" }, status: :unprocessable_entity
        end
      else
        render json: { error: "Unauthorized action" }, status: :unauthorized
      end
    else
      render json: { error: "Request not found" }, status: :not_found
    end
  end

  private

  def buyer_request_params
    params.require(:buyer_request).permit(:product_id)
  end
end
