
class BuyerRequestsController < ApplicationController
  before_action :authenticate_request
  load_and_authorize_resource
#index
  def index
    if current_user.role.name == "Seller"
      @requests = BuyerRequest.joins(:product).where(products: { seller_id: current_user.id })
    elsif current_user.role.name == "Buyer"
      @requests = current_user.buyer_requests
    end

    render json: @requests, status: :ok
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
end


private

def buyer_request_params
  params.require(:buyer_request).permit(:product_id)
end
